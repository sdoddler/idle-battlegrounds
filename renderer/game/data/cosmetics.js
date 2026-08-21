export const COSMETIC_CATALOG = Object.freeze([
  { itemDefId:'head_001', slot:'head', rarity:'common', name:'Round Head', assetId:'head_round', color:'#d7aa84' },
  { itemDefId:'head_002', slot:'head', rarity:'uncommon', name:'Soft Head', assetId:'head_soft', color:'#c88f72' },
  { itemDefId:'face_001', slot:'face', rarity:'common', name:'Classic Face', assetId:'face_classic' },
  { itemDefId:'face_002', slot:'face', rarity:'uncommon', name:'Soft Face', assetId:'face_soft' },
  { itemDefId:'face_003', slot:'face', rarity:'rare', name:'Tough Face', assetId:'face_tough' },
  { itemDefId:'hair_001', slot:'hair', rarity:'common', name:'Messy Brown', assetId:'hair_messy', color:'#4b2f22' },
  { itemDefId:'hair_002', slot:'hair', rarity:'uncommon', name:'Black Bob', assetId:'hair_bob', color:'#20242a' },
  { itemDefId:'hair_003', slot:'hair', rarity:'rare', name:'Red Ponytail', assetId:'hair_ponytail', color:'#8e3c37' },
  { itemDefId:'hair_004', slot:'hair', rarity:'rare', name:'Blond Sweep', assetId:'hair_sweep', color:'#c79c52' },
  { itemDefId:'torso_001', slot:'torso', rarity:'common', name:'Olive Shirt', assetId:'shirt_olive', color:'#657248' },
  { itemDefId:'torso_002', slot:'torso', rarity:'common', name:'Tan Shirt', assetId:'shirt_tan', color:'#9a805e' },
  { itemDefId:'torso_003', slot:'torso', rarity:'uncommon', name:'Black Shirt', assetId:'shirt_black', color:'#30353a' },
  { itemDefId:'torso_004', slot:'torso', rarity:'rare', name:'Blue Jacket', assetId:'jacket_blue', color:'#3f607b' },
  { itemDefId:'arms_001', slot:'arms', rarity:'common', name:'Olive Sleeves', assetId:'arms_olive', color:'#657248' },
  { itemDefId:'arms_002', slot:'arms', rarity:'uncommon', name:'Tan Sleeves', assetId:'arms_tan', color:'#9a805e' },
  { itemDefId:'hands_001', slot:'hands', rarity:'common', name:'Black Gloves', assetId:'gloves_black', color:'#30343a' },
  { itemDefId:'hands_002', slot:'hands', rarity:'uncommon', name:'Tan Gloves', assetId:'gloves_tan', color:'#7c6750' },
  { itemDefId:'hands_003', slot:'hands', rarity:'rare', name:'Bare Hands', assetId:'hands_bare', color:'#d7aa84' },
  { itemDefId:'legs_001', slot:'legs', rarity:'common', name:'Olive Tactical', assetId:'legs_olive', color:'#596345', boot:'#35383b' },
  { itemDefId:'legs_002', slot:'legs', rarity:'uncommon', name:'Tan Cargo', assetId:'legs_tan', color:'#8f795a', boot:'#443d36' },
  { itemDefId:'legs_003', slot:'legs', rarity:'rare', name:'Dark Cargo', assetId:'legs_dark', color:'#34383d', boot:'#1d2024' },
  { itemDefId:'helmet_001', slot:'helmet', rarity:'uncommon', name:'Field Helmet', assetId:'helmet_field', color:'#66704d' },
  { itemDefId:'helmet_none', slot:'helmet', rarity:'common', name:'No Helmet', assetId:'none' },
  { itemDefId:'vest_001', slot:'vest', rarity:'uncommon', name:'Chest Rig', assetId:'vest_rig', color:'#806c4d' },
  { itemDefId:'vest_none', slot:'vest', rarity:'common', name:'No Vest', assetId:'none' },
  { itemDefId:'backpack_001', slot:'backpack', rarity:'uncommon', name:'Day Pack', assetId:'backpack_day', color:'#596348' },
  { itemDefId:'backpack_none', slot:'backpack', rarity:'common', name:'No Backpack', assetId:'none' }
]);

export const COSMETIC_SLOTS = ['head','face','hair','torso','arms','hands','legs','helmet','vest','backpack'];
export function catalogBySlot(slot) { return COSMETIC_CATALOG.filter(item => item.slot === slot); }
export function itemById(id) { return COSMETIC_CATALOG.find(item => item.itemDefId === id) || null; }
export function defaultCosmetics() {
  const result = {};
  for (const slot of COSMETIC_SLOTS) result[slot] = catalogBySlot(slot)[0]?.itemDefId || null;
  result.helmet = 'helmet_none'; result.vest = 'vest_none'; result.backpack = 'backpack_none';
  return result;
}
