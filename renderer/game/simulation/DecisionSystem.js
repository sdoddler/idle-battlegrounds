export class DecisionSystem {
  constructor(timeoutTicks=70) { this.timeoutTicks=timeoutTicks; this.queue=[]; this.active=null; this.history=[]; }
  offer(decision, tick) {
    const normalized={...decision, createdTick:tick, expiresTick:tick+(decision.timeoutTicks||this.timeoutTicks)};
    if (!this.active) this.active=normalized; else this.queue.push(normalized);
    return normalized.id;
  }
  hasType(type) { return this.active?.type===type || this.queue.some(d=>d.type===type); }
  choose(optionId, tick) {
    if (!this.active) return null;
    const option=this.active.options.find(o=>o.id===optionId && !o.disabled) || this.active.options.find(o=>o.id===this.active.defaultOption) || this.active.options.find(o=>!o.disabled);
    const result={decision:this.active, option, tick, timedOut:false};
    this.history.push({id:this.active.id, option:option?.id, tick, timedOut:false});
    this.active=this.queue.shift()||null;
    return result;
  }
  update(tick) {
    if (!this.active || tick < this.active.expiresTick) return null;
    const option=this.active.options.find(o=>o.id===this.active.defaultOption && !o.disabled) || this.active.options.find(o=>!o.disabled);
    const result={decision:this.active, option, tick, timedOut:true};
    this.history.push({id:this.active.id, option:option?.id, tick, timedOut:true});
    this.active=this.queue.shift()||null;
    return result;
  }
}
