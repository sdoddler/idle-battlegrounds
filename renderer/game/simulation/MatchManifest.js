import { CONFIG } from '../config.js';
import { stream, pick, range } from './PRNG.js';

const PROFILES = ['aggressive','balanced','survival','loot'];

export function createMatchManifest(seed, playerName='PLAYER') {
  const cleanSeed = String(seed || '123901830981');
  const squads = [];
  for (let s=0; s<CONFIG.SQUAD_COUNT; s++) {
    const rng = stream(cleanSeed, 'SQUAD', s);
    squads.push({
      id:s,
      name:s===0 ? `${playerName} SQUAD` : `GHOST SQUAD ${String(s).padStart(2,'0')}`,
      profile:s===0 ? 'balanced' : pick(rng, PROFILES),
      spawnX:range(rng, 500, CONFIG.WORLD_LENGTH-500),
      members:Array.from({length:CONFIG.MEMBERS_PER_SQUAD}, (_,m)=>({
        id:`${s}:${m}`,
        name:s===0 ? ['Alpha','Bravo','Charlie','Delta'][m] : `G${s}-${m+1}`,
        skill:0.72 + rng()*0.55
      }))
    });
  }
  return {
    matchId:`M-${cleanSeed}-${CONFIG.SIMULATION_VERSION}`,
    seed:cleanSeed,
    simulationVersion:CONFIG.SIMULATION_VERSION,
    mapVersion:CONFIG.MAP_VERSION,
    lootVersion:CONFIG.LOOT_VERSION,
    rulesVersion:CONFIG.RULES_VERSION,
    squads
  };
}
