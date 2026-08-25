export class EffectsRenderer {
  constructor(container){this.container=container;this.g=new PIXI.Graphics();container.addChild(this.g);}
  render(sim,camera,w,groundY,scale=1){const g=this.g;g.clear();for(const smoke of sim.utilitySystem.smokes){const x=camera.worldToScreenX(smoke.x,w);if(x<-300||x>w+300)continue;g.circle(x,groundY-30*scale,100*scale).fill({color:0xc4cbd0,alpha:.22});g.circle(x-45*scale,groundY-55*scale,65*scale).fill({color:0xd5dadd,alpha:.18});}
    for(const barrier of sim.utilitySystem.barriers){const x=camera.worldToScreenX(barrier.x,w);if(x<0||x>w)continue;g.roundRect(x-35*scale,groundY-48*scale,70*scale,48*scale,8*scale).fill({color:0x58717b,alpha:.85}).stroke({color:0xc6e1e8,width:Math.max(1,2*scale)});}}
}
