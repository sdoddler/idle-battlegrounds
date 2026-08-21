export const WEAPONS = Object.freeze({
  pistol: { id:'pistol', name:'Pistol', damage:13, fireInterval:0.75, range:430, accuracy:0.72, preferred:260, ammo:48 },
  smg: { id:'smg', name:'SMG', damage:8, fireInterval:0.28, range:500, accuracy:0.62, preferred:280, ammo:120 },
  rifle: { id:'rifle', name:'Assault Rifle', damage:15, fireInterval:0.46, range:720, accuracy:0.72, preferred:480, ammo:100 },
  shotgun: { id:'shotgun', name:'Shotgun', damage:38, fireInterval:1.05, range:280, accuracy:0.78, preferred:150, ammo:30 },
  dmr: { id:'dmr', name:'DMR', damage:26, fireInterval:0.92, range:920, accuracy:0.84, preferred:700, ammo:55 },
  lmg: { id:'lmg', name:'LMG', damage:12, fireInterval:0.34, range:650, accuracy:0.64, preferred:420, ammo:160 }
});

export function weaponScore(id, distance = 450) {
  const w = WEAPONS[id] || WEAPONS.pistol;
  const distanceFactor = distance <= w.range ? 1 : Math.max(0.1, w.range / distance);
  return (w.damage / w.fireInterval) * w.accuracy * distanceFactor;
}
