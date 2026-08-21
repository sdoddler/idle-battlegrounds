import { CONFIG } from '../config.js';
import { stream, pick } from './PRNG.js';
import { weaponScore } from '../data/weapons.js';

export class BotBrain {
  constructor(seed, lootSystem) { this.seed=seed; this.loot=lootSystem; }
  updateDestination(squad, zone, tick) {
    const outside=squad.x < zone.left+180 || squad.x > zone.right-180;
    if (!outside && Math.abs(squad.targetX-squad.x)>80) return;
    const rng=stream(this.seed,'BOT_ROUTE',squad.id,Math.floor(tick/40));
    const viable=this.loot.pois.filter(p=>p.x>zone.left+120 && p.x<zone.right-120);
    if (!viable.length) { squad.targetX=zone.center; return; }
    if (squad.profile==='survival') {
      viable.sort((a,b)=>Math.abs(a.x-zone.center)-Math.abs(b.x-zone.center));
      squad.targetX=viable[Math.floor(rng()*Math.min(5,viable.length))].x;
    } else squad.targetX=pick(rng, viable).x;
  }
  chooseLoot(squad, loot) {
    const distance=squad.profile==='aggressive'?280:squad.profile==='survival'?650:450;
    return [...loot.weapons].sort((a,b)=>weaponScore(b,distance)-weaponScore(a,distance))[0];
  }
  shouldTakeVehicle(squad, tick) {
    const rng=stream(this.seed,'BOT_VEHICLE',squad.id,tick);
    const base={aggressive:0.58,balanced:0.48,survival:0.66,loot:0.42}[squad.profile]||0.5;
    return rng()<base;
  }
  engagementStyle(squad, tick) {
    const rng=stream(this.seed,'BOT_ENGAGE',squad.id,Math.floor(tick/25));
    if (squad.profile==='aggressive') return rng()<0.75?'push':'hold';
    if (squad.profile==='survival') return rng()<0.7?'avoid':'hold';
    return rng()<0.35?'push':rng()<0.7?'hold':'avoid';
  }
}
