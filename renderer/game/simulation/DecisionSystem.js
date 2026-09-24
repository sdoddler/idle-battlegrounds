export class DecisionSystem {
  constructor(timeoutTicks=70) { this.timeoutTicks=timeoutTicks; this.queue=[]; this.active=null; this.history=[]; }
  activate(decision,tick) { return {...decision,createdTick:tick,expiresTick:tick+(decision.timeoutTicks||this.timeoutTicks)}; }
  offer(decision, tick) {
    if (!this.active) this.active=this.activate(decision,tick); else this.queue.push({...decision});
    return decision.id;
  }
  hasType(type) { return this.active?.type===type || this.queue.some(d=>d.type===type); }
  choose(optionId, tick) {
    if (!this.active) return null;
    const option=this.active.options.find(o=>o.id===optionId && !o.disabled) || this.active.options.find(o=>o.id===this.active.defaultOption) || this.active.options.find(o=>!o.disabled);
    const result={decision:this.active, option, tick, timedOut:false};
    this.history.push({id:this.active.id, option:option?.id, tick, timedOut:false});
    const next=this.queue.shift();this.active=next?this.activate(next,tick):null;
    return result;
  }
  update(tick) {
    if (!this.active || tick < this.active.expiresTick) return null;
    const option=this.active.options.find(o=>o.id===this.active.defaultOption && !o.disabled) || this.active.options.find(o=>!o.disabled);
    const result={decision:this.active, option, tick, timedOut:true};
    this.history.push({id:this.active.id, option:option?.id, tick, timedOut:true});
    const next=this.queue.shift();this.active=next?this.activate(next,tick):null;
    return result;
  }
}
