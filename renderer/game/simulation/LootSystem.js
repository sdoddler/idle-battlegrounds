import { CONFIG } from '../config.js';
import { POI_NAMES, POI_TYPES, WEAPON_WEIGHTS, UTILITY_WEIGHTS } from '../data/lootTables.js';
import { stream, range, weighted, chance } from './PRNG.js';

export class LootSystem {
  constructor(seed) { this.seed=seed; this.pois=this.generateWorld(); }
  generateWorld() {
    const pois=[]; const count=48; const spacing=(CONFIG.WORLD_LENGTH-700)/(count-1);
    for (let i=0;i<count;i++) {
      const rng=stream(this.seed,'WORLD','POI',i);
      const type=POI_TYPES[i%POI_TYPES.length];
      const x=Math.max(250, Math.min(CONFIG.WORLD_LENGTH-250, 350+i*spacing+range(rng,-120,120)));
      const hasVehicle=(type==='garage'||type==='fuel') && chance(rng,0.72);
      pois.push({id:i,name:`${POI_NAMES[i%POI_NAMES.length]} ${i+1}`,type,x,hasVehicle,cover:chance(rng,0.7)});
    }
    return pois.sort((a,b)=>a.x-b.x);
  }
  nearestPOI(x) { return this.pois.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best,this.pois[0]); }
  lootFor(poiId, squadId, visit=0) {
    const rng=stream(this.seed,'LOOT',poiId,squadId,visit);
    let a=weighted(rng,WEAPON_WEIGHTS), b=weighted(rng,WEAPON_WEIGHTS);
    if (a===b) b=weighted(rng,WEAPON_WEIGHTS);
    return { weapons:[a,b], utility:weighted(rng,UTILITY_WEIGHTS), armour:chance(rng,0.24)?15:0 };
  }
}
