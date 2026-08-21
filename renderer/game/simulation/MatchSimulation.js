import { CONFIG } from '../config.js';
import { Character } from '../entities/Character.js';
import { Squad } from '../entities/Squad.js';
import { WEAPONS } from '../data/weapons.js';
import { defaultCosmetics } from '../data/cosmetics.js';
import { stream, pick } from './PRNG.js';
import { RedZone } from './RedZone.js';
import { LootSystem } from './LootSystem.js';
import { DecisionSystem } from './DecisionSystem.js';
import { BotBrain } from './BotBrain.js';
import { VehicleSystem } from './VehicleSystem.js';
import { UtilitySystem } from './UtilitySystem.js';
import { CombatSystem } from './CombatSystem.js';

export class MatchSimulation {
  constructor(manifest,{playerCosmetics=[]}={}) {
    this.manifest=manifest; this.seed=manifest.seed; this.tick=0; this.time=0; this.running=true; this.events=[];
    this.redZoneSystem=new RedZone(this.seed); this.zone=this.redZoneSystem.stateAt(0);
    this.lootSystem=new LootSystem(this.seed); this.vehicleSystem=new VehicleSystem(this.lootSystem);
    this.utilitySystem=new UtilitySystem(this.seed); this.decisions=new DecisionSystem(CONFIG.DECISION_TIMEOUT_TICKS);
    this.botBrain=new BotBrain(this.seed,this.lootSystem); this.squads=[]; this.pendingPlayerRevives=new Set();
    this.spawnSquads(playerCosmetics);
    this.combatSystem=new CombatSystem(this.seed,this.utilitySystem,(text)=>this.emit(text));
    this.emit(`Match ${manifest.matchId} started`);
  }
  spawnSquads(playerCosmetics){
    for(const descriptor of this.manifest.squads){
      const members=descriptor.members.map((md,m)=>{
        const cosmetics=descriptor.id===0 && playerCosmetics[m] ? playerCosmetics[m] : defaultCosmetics();
        const c=new Character({...md,cosmetics});
        const rng=stream(this.seed,'START_LOADOUT',descriptor.id,m);
        if(rng()>0.7){c.utilities.smoke=1;} if(rng()>0.82){c.utilities.frag=1;} if(rng()>0.88){c.utilities.barrier=1;}
        return c;
      });
      const squad=new Squad({...descriptor,x:descriptor.spawnX,members});
      squad.targetX=this.initialTarget(squad);
      this.squads.push(squad);
    }
  }
  initialTarget(squad){
    const rng=stream(this.seed,'INITIAL_ROUTE',squad.id); const viable=this.lootSystem.pois.filter(p=>Math.abs(p.x-squad.x)>180);
    return pick(rng,viable).x;
  }
  get playerSquad(){return this.squads[CONFIG.PLAYER_SQUAD_ID];}
  aliveCharacters(){return this.squads.reduce((n,s)=>n+s.existingMembers.length,0);}
  aliveSquads(){return this.squads.filter(s=>!s.isEliminated).length;}
  emit(text){this.events.unshift({tick:this.tick,text});this.events=this.events.slice(0,12);}
  step(){
    if(!this.running)return;
    this.tick++; this.time=this.tick*CONFIG.TICK_SECONDS; this.zone=this.redZoneSystem.stateAt(this.time);
    const timedOut=this.decisions.update(this.tick); if(timedOut)this.applyDecisionResult(timedOut);
    this.utilitySystem.update(this.tick);
    for(const squad of this.squads) this.updateSquad(squad);
    this.combatSystem.update(this.squads,this.tick,CONFIG.TICK_SECONDS);
    this.updateDowned(); this.applyZoneDamage();
    if(this.time>=CONFIG.MATCH_SECONDS||this.aliveSquads()<=1){this.running=false;this.emit('Match complete');}
  }
  updateSquad(squad){
    if(squad.isEliminated)return;
    if(squad.id!==0) this.botBrain.updateDestination(squad,this.zone,this.tick);
    else this.updatePlayerAutoRoute(squad);
    const baseSpeed=squad.profile==='survival'?44:squad.profile==='aggressive'?58:50;
    const boost=squad.boostUntil>this.tick?1.18:1; const speed=baseSpeed*squad.speedMultiplier*boost;
    squad.x=Math.max(0,Math.min(CONFIG.WORLD_LENGTH,squad.x+Math.sign(squad.targetX-squad.x)*speed*CONFIG.TICK_SECONDS));
    this.vehicleSystem.updateSquadVehicle(squad);
    const poi=this.lootSystem.nearestPOI(squad.x);
    if(Math.abs(poi.x-squad.x)<70&&!squad.visitedPOIs.has(poi.id))this.arriveAtPOI(squad,poi);
    if(squad.id===0)this.maybeOfferContactDecision(squad); else this.botTactics(squad);
    this.setStances(squad);
  }
  updatePlayerAutoRoute(squad){
    const outside=squad.x<this.zone.left+150||squad.x>this.zone.right-150;
    if(outside){squad.targetX=this.zone.center;return;}
    if(Math.abs(squad.targetX-squad.x)<60){
      const viable=this.lootSystem.pois.filter(p=>!squad.visitedPOIs.has(p.id)&&p.x>this.zone.left&&p.x<this.zone.right);
      if(viable.length) squad.targetX=viable.reduce((a,b)=>Math.abs(a.x-squad.x)<Math.abs(b.x-squad.x)?a:b).x; else squad.targetX=this.zone.center;
    }
  }
  arriveAtPOI(squad,poi){
    squad.visitedPOIs.add(poi.id); const loot=this.lootSystem.lootFor(poi.id,squad.id,squad.visitedPOIs.size);
    if(squad.id===0){
      if(!this.decisions.hasType('loot'))this.decisions.offer({id:`loot-${poi.id}-${this.tick}`,type:'loot',title:`Search ${poi.name}`,description:'Choose one quick pickup while the squad keeps moving.',context:{poiId:poi.id},defaultOption:'skip',options:[
        {id:'weaponA',label:`Take ${WEAPONS[loot.weapons[0]].name}`,effect:{kind:'equipWeapon',weapon:loot.weapons[0]}},
        {id:'weaponB',label:`Take ${WEAPONS[loot.weapons[1]].name}`,effect:{kind:'equipWeapon',weapon:loot.weapons[1]}},
        {id:'utility',label:`Take ${loot.utility}`,effect:{kind:'takeUtility',utility:loot.utility}},
        {id:'skip',label:'Keep moving',effect:{kind:'noop'}}
      ]},this.tick);
      const vehicle=this.vehicleSystem.availableNear(squad.x,95); if(vehicle&&!this.decisions.hasType('vehicle'))this.offerVehicleDecision(vehicle);
      if(squad.visitedPOIs.size%3===0&&!this.decisions.hasType('route'))this.offerRouteDecision(squad,poi);
    } else {
      const weapon=this.botBrain.chooseLoot(squad,loot); const member=squad.aliveMembers.sort((a,b)=>(WEAPONS[a.weapon].damage/WEAPONS[a.weapon].fireInterval)-(WEAPONS[b.weapon].damage/WEAPONS[b.weapon].fireInterval))[0];
      if(member){member.secondary=member.weapon;member.weapon=weapon;member.ammo=WEAPONS[weapon].ammo;member.armour+=loot.armour;member.utilities[loot.utility]=(member.utilities[loot.utility]||0)+1;}
      const vehicle=this.vehicleSystem.availableNear(squad.x,95); if(vehicle&&this.botBrain.shouldTakeVehicle(squad,this.tick))this.vehicleSystem.claim(vehicle,squad);
    }
  }
  offerVehicleDecision(vehicle){
    this.decisions.offer({id:`vehicle-${vehicle.id}-${this.tick}`,type:'vehicle',title:'Vehicle available',description:'Faster travel, but the car can draw the squad into more contacts.',defaultOption:'walk',context:{vehicleId:vehicle.id},options:[
      {id:'drive',label:'Take the car',effect:{kind:'takeVehicle',vehicleId:vehicle.id}}, {id:'walk',label:'Continue on foot',effect:{kind:'noop'}}
    ]},this.tick);
  }
  offerRouteDecision(squad,poi){
    const safe=this.lootSystem.pois.filter(p=>p.x>this.zone.left+100&&p.x<this.zone.right-100&&p.id!==poi.id);
    if(safe.length<2)return;
    const center=[...safe].sort((a,b)=>Math.abs(a.x-this.zone.center)-Math.abs(b.x-this.zone.center))[0];
    const edge=[...safe].sort((a,b)=>Math.abs(b.x-this.zone.center)-Math.abs(a.x-this.zone.center))[0];
    this.decisions.offer({id:`route-${poi.id}-${this.tick}`,type:'route',title:'Choose the next route',description:'Cut toward the safer centre, or skirt the edge for a quieter path.',defaultOption:'centre',options:[
      {id:'centre',label:`Move toward ${center.name}`,effect:{kind:'route',targetX:center.x}},
      {id:'edge',label:`Take edge route via ${edge.name}`,effect:{kind:'route',targetX:edge.x}}
    ]},this.tick);
  }
  nearbyEnemies(squad,distance=850){return this.squads.filter(s=>s.id!==squad.id&&!s.isEliminated&&Math.abs(s.x-squad.x)<distance);}
  maybeOfferContactDecision(squad){
    if(this.tick-squad.lastContactDecisionTick<120||this.decisions.hasType('contact'))return;
    const enemies=this.nearbyEnemies(squad,850); if(!enemies.length)return;
    squad.lastContactDecisionTick=this.tick;
    const hasSmoke=squad.members.some(m=>m.state==='alive'&&m.utilities.smoke>0), hasFrag=squad.members.some(m=>m.state==='alive'&&m.utilities.frag>0), hasBarrier=squad.members.some(m=>m.state==='alive'&&m.utilities.barrier>0), hasMedkit=squad.members.some(m=>m.state==='alive'&&m.utilities.medkit>0), hasBoost=squad.members.some(m=>m.state==='alive'&&m.utilities.boost>0);
    this.decisions.offer({id:`contact-${this.tick}`,type:'contact',title:'Contact ahead',description:`${enemies.length} nearby squad${enemies.length>1?'s':''}. Combat remains automatic; choose the squad posture.`,defaultOption:'hold',options:[
      {id:'push',label:'Push',effect:{kind:'setProfile',profile:'aggressive'}},
      {id:'hold',label:'Hold / use cover',effect:{kind:'setProfile',profile:'balanced'}},
      {id:'avoid',label:'Avoid',effect:{kind:'avoidContact'}},
      {id:'smoke',label:'Use smoke',disabled:!hasSmoke,effect:{kind:'useUtility',utility:'smoke'}},
      {id:'frag',label:'Throw frag',disabled:!hasFrag,effect:{kind:'useUtility',utility:'frag'}},
      {id:'barrier',label:'Deploy barrier',disabled:!hasBarrier,effect:{kind:'useUtility',utility:'barrier'}},
      {id:'medkit',label:'Use medkit',disabled:!hasMedkit,effect:{kind:'useUtility',utility:'medkit'}},
      {id:'boost',label:'Use boost',disabled:!hasBoost,effect:{kind:'useUtility',utility:'boost'}}
    ]},this.tick);
  }
  botTactics(squad){
    const enemies=this.nearbyEnemies(squad,800);if(!enemies.length)return;
    const style=this.botBrain.engagementStyle(squad,this.tick);
    if(style==='avoid')squad.targetX=Math.max(this.zone.left+100,Math.min(this.zone.right-100,squad.x+(squad.x<this.zone.center?-500:500)));
    if(style==='push')squad.profile='aggressive';
    if(this.tick%55===0){
      const rng=stream(this.seed,'BOT_UTILITY',squad.id,this.tick); const target=enemies[0];
      if(style==='avoid'&&rng()<.42)this.utilitySystem.smoke(squad,this.tick);
      else if(style==='hold'&&rng()<.30)this.utilitySystem.barrier(squad,this.tick);
      else if(style==='push'&&rng()<.34){const result=this.utilitySystem.frag(squad,target,this.tick);for(const h of result.hits){h.victim.hp-=h.damage;if(h.victim.hp<=0)h.victim.knock(this.tick);}if(result.displacement)target.x=Math.max(0,Math.min(CONFIG.WORLD_LENGTH,target.x+Math.sign(target.x-squad.x)*result.displacement));}
    }
  }
  setStances(squad){
    const contact=this.nearbyEnemies(squad,900).length>0;
    for(const m of squad.members){if(m.state!=='alive')continue;if(contact)m.stance=squad.profile==='survival'?'proneShoot':squad.profile==='balanced'?'crouchShoot':'shoot';else m.stance=squad.vehicle?'idle':Math.abs(squad.targetX-squad.x)>90?'run':'idle';}
  }
  chooseDecision(optionId){const result=this.decisions.choose(optionId,this.tick);if(result)this.applyDecisionResult(result);return result;}
  applyDecisionResult(result){if(!result?.option)return;this.applyDecisionEffect(result.option.effect,result.decision);if(result.timedOut)this.emit(`${result.decision.title}: auto-selected ${result.option.label}`);}
  useUtility(type){
    const squad=this.playerSquad; const target=this.nearbyEnemies(squad,600)[0]; let ok=false;
    if(type==='smoke')ok=this.utilitySystem.smoke(squad,this.tick);
    else if(type==='barrier')ok=this.utilitySystem.barrier(squad,this.tick);
    else if(type==='medkit')ok=this.utilitySystem.medkit(squad);
    else if(type==='boost')ok=this.utilitySystem.boost(squad,this.tick);
    else if(type==='frag'&&target){const result=this.utilitySystem.frag(squad,target,this.tick);for(const h of result.hits){h.victim.hp-=h.damage;if(h.victim.hp<=0)h.victim.knock(this.tick);}if(result.displacement)target.x=Math.max(0,Math.min(CONFIG.WORLD_LENGTH,target.x+Math.sign(target.x-squad.x)*result.displacement));ok=result.hits.length>0;}
    if(ok)this.emit(`Used ${type}`);
  }
  updateDowned(){
    for(const squad of this.squads){
      for(const member of squad.members.filter(m=>m.state==='downed')){
        if(this.tick-member.downedAtTick>200){member.kill();this.emit(`${member.name} bled out`);continue;}
        const danger=this.nearbyEnemies(squad,520).length>0;
        if(squad.id===0){
          if(!danger&&!this.decisions.hasType('revive')&&!this.pendingPlayerRevives.has(member.id)){
            this.pendingPlayerRevives.add(member.id);
            const smoke=squad.members.some(m=>m.state==='alive'&&m.utilities.smoke>0);
            this.decisions.offer({id:`revive-${member.id}-${this.tick}`,type:'revive',title:`${member.name} is down`,description:'Choose whether the squad risks a revive.',defaultOption:'revive',context:{memberId:member.id},options:[
              {id:'revive',label:'Attempt revive',effect:{kind:'revive',memberId:member.id}},
              {id:'smokeRevive',label:'Smoke + revive',disabled:!smoke,effect:{kind:'smokeRevive',memberId:member.id}},
              {id:'leave',label:'Leave them',effect:{kind:'leaveDowned',memberId:member.id}}
            ]},this.tick);
          }
        } else if(!danger && this.tick-member.downedAtTick>45){member.revive();this.emit(`${member.name} was revived`);}
      }
    }
    const active=this.decisions.active;if(active?.type==='revive'&&active.expiresTick<this.tick)this.pendingPlayerRevives.delete(active.context?.memberId);
  }
  applyZoneDamage(){
    for(const squad of this.squads){if(squad.isEliminated|| (squad.x>=this.zone.left&&squad.x<=this.zone.right))continue;const damage=this.zone.damagePerSecond*CONFIG.TICK_SECONDS;for(const m of squad.members){if(m.state==='alive'){m.hp-=damage;if(m.hp<=0)m.knock(this.tick);}else if(m.state==='downed'&&this.tick%10===0)m.hp-=0.2;}}
  }
  applyDecisionEffect(effect,decision={}){
    const squad=this.playerSquad;if(!effect)return;
    if(effect.kind==='revive'||effect.kind==='smokeRevive'||effect.kind==='leaveDowned'){
      const member=squad.members.find(m=>m.id===effect.memberId);this.pendingPlayerRevives.delete(effect.memberId);
      if(!member)return;
      if(effect.kind==='leaveDowned'){this.emit(`Left ${member.name} downed`);return;}
      if(effect.kind==='smokeRevive')this.utilitySystem.smoke(squad,this.tick);
      member.revive();this.emit(`${member.name} revived`);return;
    }
    if(effect.kind==='equipWeapon'){const member=squad.aliveMembers.sort((a,b)=>WEAPONS[a.weapon].damage-WEAPONS[b.weapon].damage)[0];if(member){member.secondary=member.weapon;member.weapon=effect.weapon;member.ammo=WEAPONS[effect.weapon].ammo;this.emit(`${member.name} equipped ${WEAPONS[effect.weapon].name}`);}}
    else if(effect.kind==='takeUtility'){const member=squad.aliveMembers[0];if(member){member.utilities[effect.utility]=(member.utilities[effect.utility]||0)+1;this.emit(`Picked up ${effect.utility}`);}}
    else if(effect.kind==='takeVehicle'){const v=this.vehicleSystem.vehicles.find(v=>v.id===effect.vehicleId);if(this.vehicleSystem.claim(v,squad))this.emit('Squad entered a car');}
    else if(effect.kind==='setProfile'){squad.profile=effect.profile;this.emit(`Squad posture: ${effect.profile}`);}
    else if(effect.kind==='avoidContact'){squad.targetX=Math.max(this.zone.left+100,Math.min(this.zone.right-100,squad.x+(squad.x<this.zone.center?-900:900)));this.emit('Squad disengaging');}
    else if(effect.kind==='useUtility')this.useUtility(effect.utility);
    else if(effect.kind==='route'){squad.targetX=Math.max(0,Math.min(CONFIG.WORLD_LENGTH,effect.targetX));}
  }
  checksumState(){
    return JSON.stringify({tick:this.tick,zone:{phase:this.zone.phase,left:+this.zone.left.toFixed(2),right:+this.zone.right.toFixed(2)},squads:this.squads.map(s=>s.serialize()),decisions:this.decisions.history});
  }
}
