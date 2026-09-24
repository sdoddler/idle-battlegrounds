import { WEAPONS } from '../data/weapons.js';
import { stream, pick, range } from './PRNG.js';

export class CombatSystem {
  constructor(seed, utilitySystem, emit, effect=()=>{}) { this.seed=seed; this.utility=utilitySystem; this.emit=emit;this.effect=effect; }
  update(squads,tick,dt) {
    const active=squads.filter(s=>!s.isEliminated);
    for (const squad of active) for (const member of squad.members) member.weaponCooldown=Math.max(0,member.weaponCooldown-dt);
    // Focus fire on one nearby opponent at a time rather than creating an
    // unreadable all-versus-all crossfire whenever three squads overlap.
    for(const squad of active){const locked=active.find(s=>s.id===squad.engagedSquadId&&Math.abs(s.x-squad.x)<=1050);const candidates=active.filter(s=>s.id!==squad.id&&Math.abs(s.x-squad.x)<=950).sort((a,b)=>Math.abs(a.x-squad.x)-Math.abs(b.x-squad.x));squad.engagedSquadId=(locked||candidates[0])?.id??null;}
    for(const attacker of active){const target=active.find(s=>s.id===attacker.engagedSquadId);if(target)this.fireSquad(attacker,target,Math.abs(attacker.x-target.x),tick);}
  }
  fireSquad(attacker,target,distance,tick) {
    const downed=target.members.filter(m=>m.state==='downed');
    if(attacker.profile==='aggressive'&&downed.length&&distance<300&&tick%10===0){const finisher=attacker.members.find(m=>m.combatReady);const rng=stream(this.seed,'FLUSH',tick,attacker.id,target.id);if(finisher&&rng()<.4){const victim=pick(rng,downed);victim.kill();finisher.kills++;this.emit(`${victim.name} was flushed by ${finisher.name}`);}}
    const targets=target.members.filter(m=>m.state==='alive'); if(!targets.length)return;
    for (const shooter of attacker.members) {
      if (!shooter.combatReady || shooter.weaponCooldown>0 || shooter.ammo<=0) continue;
      const weapon=WEAPONS[shooter.weapon]||WEAPONS.pistol; if(distance>weapon.range)continue;
      shooter.weaponCooldown=weapon.fireInterval; shooter.ammo--;
      const rng=stream(this.seed,'COMBAT',tick,shooter.id,target.id);
      const rangePenalty=Math.max(0.2,1-distance/(weapon.range*1.35));
      const stanceBonus=shooter.stance==='proneShoot'?1.14:shooter.stance==='crouchShoot'?1.07:1;
      const boost=attacker.boostUntil>tick?1.12:1;
      const smoke=this.utility.smokeFactorAt(target.x,tick);
      const barrier=this.utility.barrierFor(target,tick);
      let hit=weapon.accuracy*0.52*shooter.skill*rangePenalty*stanceBonus*boost*smoke;
      if(barrier){hit*=0.68;barrier.hp=Math.max(0,barrier.hp-weapon.damage*.08);}
      const victim=pick(rng,targets),fromX=attacker.x+shooter.offsetX,toX=target.x+victim.offsetX;
      if(rng()>Math.min(0.92,hit)){this.effect({type:'shot',fromX,toX,hit:false,weapon:shooter.weapon});continue;}
      let damage=range(rng,weapon.damage*0.82,weapon.damage*1.18);this.effect({type:'shot',fromX,toX,hit:true,weapon:shooter.weapon});
      if(victim.armour>0){const absorbed=Math.min(victim.armour,damage*0.35);victim.armour-=absorbed;damage-=absorbed;}
      if(target.vehicle&&!target.vehicle.destroyed&&rng()<0.22){target.vehicle.damage(damage*1.4);continue;}
      victim.hp-=damage; shooter.damage+=damage;
      if(victim.hp<=0){
        const teammates=target.members.some(m=>m!==victim&&m.state==='alive');
        if(teammates){victim.knock(tick);this.emit(`${victim.name} was knocked by ${shooter.name}`);}
        else {victim.kill();shooter.kills++;this.emit(`${victim.name} was eliminated by ${shooter.name}`);}
      }
    }
  }
}
