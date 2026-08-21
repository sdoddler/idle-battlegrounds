import { CONFIG } from '../config.js';
export class Camera {
  constructor(){this.centerX=CONFIG.WORLD_LENGTH/2;this.viewWidth=CONFIG.VIEW_WORLD_WIDTH;}
  follow(x,dt=1/60){this.centerX += (x-this.centerX)*Math.min(1,dt*5.5);}
  scale(screenWidth){return screenWidth/this.viewWidth;}
  worldToScreenX(x,screenWidth){return screenWidth/2+(x-this.centerX)*this.scale(screenWidth);}
  visible(x,screenWidth,pad=220){const sx=this.worldToScreenX(x,screenWidth);return sx>-pad&&sx<screenWidth+pad;}
}
