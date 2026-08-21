import { stream, range } from './PRNG.js';

export class UtilitySystem {
  constructor(seed) { this.seed=seed; this.smokes=[]; this.barriers=[]; }
  update(tick) { this.smokes=this.smokes.filter(e=>e.expiresTick>tick); this.barriers=this.barriers.filter(e=>e.expiresTick>tick && e.hp>0); }
  smoke(squad,tick) { const m=squad.members.find(c=>c.state==='alive'&&c.utilities.smoke>0); if(!m)return false; m.utilities.smoke--; this.smokes.push({id:`smoke-${squad.id}-${tick}`,x:squad.x,radius:240,expiresTick:tick+120}); return true; }
  barrier(squad,tick) { const m=squad.members.find(c=>c.state==='alive'&&c.utilities.barrier>0); if(!m)return false; m.utilities.barrier--; this.barriers.push({id:`barrier-${squad.id}-${tick}`,squadId:squad.id,x:squad.x,hp:90,expiresTick:tick+180}); return true; }
  medkit(squad) { const target=squad.members.filter(c=>c.state==='alive'&&c.hp<c.maxHp).sort((a,b)=>a.hp-b.hp)[0]; const owner=squad.members.find(c=>c.state==='alive'&&c.utilities.medkit>0); if(!target||!owner)return false; owner.utilities.medkit--; target.hp=Math.min(target.maxHp,target.hp+48); return true; }
  boost(squad,tick) { const m=squad.members.find(c=>c.state==='alive'&&c.utilities.boost>0); if(!m)return false; m.utilities.boost--; squad.boostUntil=tick+120; return true; }
  frag(attacker,target,tick) {
    const owner=attacker.members.find(c=>c.state==='alive'&&c.utilities.frag>0); if(!owner)return {hits:[],displacement:0};
    owner.utilities.frag--; const rng=stream(this.seed,'FRAG',attacker.id,target.id,tick); const hits=[];
    for(const victim of target.members.filter(c=>c.state==='alive')) { if(rng()<0.68) hits.push({victim,damage:range(rng,24,52)}); }
    const displacement=hits.length?range(rng,65,135):0;return {hits,displacement};
  }
  smokeFactorAt(x,tick) { return this.smokes.some(s=>s.expiresTick>tick&&Math.abs(s.x-x)<s.radius)?0.38:1; }
  barrierFor(squad,tick) { return this.barriers.find(b=>b.squadId===squad.id&&b.expiresTick>tick&&b.hp>0)||null; }
}
