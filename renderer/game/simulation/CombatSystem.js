import { WEAPONS } from '../data/weapons.js';
import { stream, pick, range } from './PRNG.js';

export class CombatSystem {
  constructor(seed, utilitySystem, emit) { this.seed=seed; this.utility=utilitySystem; this.emit=emit; }
  update(squads,tick,dt) {
    const active=squads.filter(s=>!s.isEliminated);
    for (const squad of active) for (const member of squad.members) member.weaponCooldown=Math.max(0,member.weaponCooldown-dt);
    for (let i=0;i<active.length;i++) for(let j=i+1;j<active.length;j++) {
      const a=active[i], b=active[j], distance=Math.abs(a.x-b.x);
      if (distance>950) continue;
      this.fireSquad(a,b,distance,tick); this.fireSquad(b,a,distance,tick);
    }
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
      if(rng()>Math.min(0.92,hit))continue;
      const victim=pick(rng,targets); let damage=range(rng,weapon.damage*0.82,weapon.damage*1.18);
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
