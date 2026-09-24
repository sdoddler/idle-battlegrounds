import { Vehicle } from '../entities/Vehicle.js';

export class VehicleSystem {
  constructor(lootSystem) {
    this.vehicles=lootSystem.pois.filter(p=>p.hasVehicle).map(p=>new Vehicle({id:`car-${p.id}`,x:p.x}));
  }
  availableNear(x, radius=120) { return this.vehicles.find(v=>!v.destroyed && v.claimedBy==null && Math.abs(v.x-x)<=radius) || null; }
  claim(vehicle, squad) { if (!vehicle || vehicle.destroyed || vehicle.claimedBy!=null) return false; vehicle.claimedBy=squad.id; squad.vehicle=vehicle; return true; }
  abandon(squad) { if (!squad.vehicle) return; squad.vehicle.x=squad.x; squad.vehicle.claimedBy=null; squad.vehicle=null; }
  updateSquadVehicle(squad) { if (!squad.vehicle) return; squad.vehicle.x=squad.x; if (squad.vehicle.destroyed) squad.vehicle=null; }
}
