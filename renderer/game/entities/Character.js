import { defaultCosmetics } from '../data/cosmetics.js';

export class Character {
  constructor({ id, name, skill = 1, cosmetics = defaultCosmetics() }) {
    this.id = id; this.name = name; this.skill = skill;
    this.hp = 100; this.maxHp = 100; this.armour = 25;
    this.state = 'alive'; this.downedAtTick = null; this.reviveProgress = 0;
    this.weapon = 'pistol'; this.secondary = null; this.ammo = 48;
    this.utilities = { frag:0, smoke:0, barrier:0, medkit:1, boost:0 };
    this.weaponCooldown = 0; this.kills = 0; this.damage = 0;
    this.stance = 'run'; this.order = 'follow'; this.cosmetics = { ...cosmetics };
    // A local simulation position lets squad members move, fight, and fall without
    // being welded to the same point as the rest of their team.
    this.offsetX = 0;
  }
  get combatReady() { return this.state === 'alive' && this.hp > 0; }
  get exists() { return this.state !== 'dead'; }
  knock(tick) { if (this.state !== 'alive') return; this.state = 'downed'; this.hp = 1; this.downedAtTick = tick; this.stance = 'knocked'; }
  revive() { if (this.state !== 'downed') return; this.state = 'alive'; this.hp = 35; this.downedAtTick = null; this.reviveProgress = 0; this.stance = 'crouchShoot'; }
  kill() { this.state = 'dead'; this.hp = 0; this.stance = 'dead'; }
  serialize() { return { id:this.id, hp:+this.hp.toFixed(2), state:this.state, weapon:this.weapon, ammo:this.ammo, offsetX:+this.offsetX.toFixed(2), kills:this.kills, utilities:{...this.utilities} }; }
}
