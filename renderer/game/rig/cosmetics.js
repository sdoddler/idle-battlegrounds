import { itemById } from '../data/cosmetics.js';
export function resolvedCosmetics(selection={}) { const out={}; for(const [slot,id] of Object.entries(selection))out[slot]=itemById(id); return out; }
export function cosmeticColor(selection,slot,fallback){return itemById(selection?.[slot])?.color||fallback;}
