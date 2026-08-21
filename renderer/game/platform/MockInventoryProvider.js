import { InventoryProvider } from './InventoryProvider.js';
import { COSMETIC_CATALOG } from '../data/cosmetics.js';

const STARTER_IDS=['head_001','head_002','face_001','face_002','face_003','hair_001','hair_002','hair_003','torso_001','torso_002','torso_003','arms_001','arms_002','hands_001','hands_002','hands_003','legs_001','legs_002','legs_003','helmet_none','helmet_001','vest_none','vest_001','backpack_none','backpack_001'];

export class MockInventoryProvider extends InventoryProvider {
  constructor(savedIds=STARTER_IDS){super();this.owned=new Set(savedIds?.length?savedIds:STARTER_IDS);}
  async listOwned(){return COSMETIC_CATALOG.filter(i=>this.owned.has(i.itemDefId));}
  async grant(itemDefId){if(COSMETIC_CATALOG.some(i=>i.itemDefId===itemDefId))this.owned.add(itemDefId);return this.listOwned();}
  async simulateDrop(){
    const locked=COSMETIC_CATALOG.filter(i=>!this.owned.has(i.itemDefId)); const source=locked.length?locked:COSMETIC_CATALOG;
    const buf=new Uint32Array(1); crypto.getRandomValues(buf); const item=source[buf[0]%source.length]; this.owned.add(item.itemDefId); return item;
  }
  ids(){return [...this.owned];}
}
