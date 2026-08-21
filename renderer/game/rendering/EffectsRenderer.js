export class EffectsRenderer {
  constructor(container){this.container=container;this.g=new PIXI.Graphics();container.addChild(this.g);}
  render(sim,camera,w,groundY){const g=this.g;g.clear();for(const smoke of sim.utilitySystem.smokes){const x=camera.worldToScreenX(smoke.x,w);if(x<-300||x>w+300)continue;g.circle(x,groundY-30,100).fill({color:0xc4cbd0,alpha:.22});g.circle(x-45,groundY-55,65).fill({color:0xd5dadd,alpha:.18});}
    for(const barrier of sim.utilitySystem.barriers){const x=camera.worldToScreenX(barrier.x,w);if(x<0||x>w)continue;g.roundRect(x-35,groundY-48,70,48,8).fill({color:0x58717b,alpha:.85}).stroke({color:0xc6e1e8,width:2});}}
}
