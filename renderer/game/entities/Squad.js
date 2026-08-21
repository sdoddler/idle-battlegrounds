export class Squad {
  constructor({ id, name, profile, x, members }) {
    this.id = id; this.name = name; this.profile = profile; this.x = x; this.targetX = x;
    this.members = members; this.vehicle = null; this.visitedPOIs = new Set();
    this.lastDecisionTick = -9999; this.lastContactDecisionTick = -9999;
    this.smokeUntil = 0; this.boostUntil = 0; this.barrierUntil = 0;
  }
  get aliveMembers() { return this.members.filter(m => m.state === 'alive'); }
  get existingMembers() { return this.members.filter(m => m.state !== 'dead'); }
  get isEliminated() { return this.existingMembers.length === 0; }
  get speedMultiplier() { return this.vehicle ? this.vehicle.speedMultiplier : 1; }
  serialize() { return { id:this.id, x:+this.x.toFixed(2), targetX:+this.targetX.toFixed(2), profile:this.profile, vehicle:this.vehicle?.type || null, members:this.members.map(m=>m.serialize()) }; }
}
