import { CONFIG } from '../config.js';
import { stream, range } from './PRNG.js';

function smoothstep(t){ return t*t*(3-2*t); }
function lerp(a,b,t){ return a+(b-a)*t; }

export class RedZone {
  constructor(seed) {
    this.seed = seed;
    this.phaseDuration = CONFIG.MATCH_SECONDS / 6;
    this.keyframes = [{ center:CONFIG.WORLD_LENGTH/2, radius:CONFIG.WORLD_LENGTH/2 }];
    let prevCenter = CONFIG.WORLD_LENGTH/2;
    let radius = CONFIG.WORLD_LENGTH/2;
    for (let phase=1; phase<=6; phase++) {
      const rng = stream(seed, 'ZONE', phase);
      radius = Math.max(650, radius * (phase < 3 ? 0.72 : 0.63));
      const min = radius, max = CONFIG.WORLD_LENGTH-radius;
      const proposed = prevCenter + range(rng, -radius*0.7, radius*0.7);
      prevCenter = Math.max(min, Math.min(max, proposed));
      this.keyframes.push({ center:prevCenter, radius });
    }
  }
  stateAt(timeSeconds) {
    const openingSeconds=CONFIG.COMBAT_GRACE_TICKS*CONFIG.TICK_SECONDS;
    const raw = Math.max(0, Math.min(5.9999, (timeSeconds-openingSeconds) / this.phaseDuration));
    const phase = Math.floor(raw);
    const t = smoothstep(raw-phase);
    const a=this.keyframes[phase], b=this.keyframes[phase+1];
    const center=lerp(a.center,b.center,t), radius=lerp(a.radius,b.radius,t);
    return { phase, center, radius, left:Math.max(0,center-radius), right:Math.min(CONFIG.WORLD_LENGTH,center+radius), width:radius*2, damagePerSecond:0.8+phase*0.55 };
  }
}
