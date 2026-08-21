import { WEAPONS } from '../data/weapons.js';
export class Weapon {
  constructor(id='pistol') { Object.assign(this, WEAPONS[id] || WEAPONS.pistol); }
}
