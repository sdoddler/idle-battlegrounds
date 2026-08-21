export class Vehicle {
  constructor({ id, type='car', x=0 }) { this.id=id; this.type=type; this.x=x; this.hp=220; this.maxHp=220; this.speedMultiplier=2.35; this.destroyed=false; }
  damage(amount) { this.hp = Math.max(0, this.hp - amount); if (this.hp <= 0) this.destroyed = true; }
}
