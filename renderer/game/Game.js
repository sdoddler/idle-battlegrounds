import { CONFIG } from './config.js';
import { MatchSimulation } from './simulation/MatchSimulation.js';
import { WorldRenderer } from './rendering/WorldRenderer.js';

export class Game {
  constructor({host,onState,onDecision}){this.host=host;this.onState=onState;this.onDecision=onDecision;this.renderer=new WorldRenderer(host);this.sim=null;this.accumulator=0;this.lastTime=0;this.raf=0;this.running=false;}
  async init(){await this.renderer.init();}
  start(manifest,playerCosmetics){this.sim=new MatchSimulation(manifest,{playerCosmetics});this.accumulator=0;this.lastTime=performance.now();this.running=true;cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(t=>this.frame(t));}
  frame(now){if(!this.running)return;let delta=Math.min(.25,(now-this.lastTime)/1000);this.lastTime=now;this.accumulator+=delta;let steps=0;while(this.accumulator>=CONFIG.TICK_SECONDS&&steps<12){this.sim.step();this.accumulator-=CONFIG.TICK_SECONDS;steps++;}this.renderer.render(this.sim,delta);this.onState?.(this.sim);this.onDecision?.(this.sim.decisions.active);if(this.sim.running)this.raf=requestAnimationFrame(t=>this.frame(t));else{this.running=false;this.onState?.(this.sim);}}
  choose(optionId){this.sim?.chooseDecision(optionId);}
  setViewScale(value){this.renderer.setViewScale(value);}
  setDesktopVisuals(settings){this.renderer.setDesktopVisuals(settings);}
  stop(){this.running=false;cancelAnimationFrame(this.raf);}
}
