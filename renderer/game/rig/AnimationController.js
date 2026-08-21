const PI=Math.PI;
const k=(t,v)=>({t,...v});
export const ANIMATIONS={
  idle:{duration:1.4,tracks:{torso:[k(0,{y:0}),k(.5,{y:-1}),k(1,{y:0})],head:[k(0,{r:0}),k(.5,{r:.02}),k(1,{r:0})]}},
  walk:{duration:.72,tracks:{rearLeg:[k(0,{r:.45}),k(.5,{r:-.45}),k(1,{r:.45})],frontLeg:[k(0,{r:-.45}),k(.5,{r:.45}),k(1,{r:-.45})],rearArm:[k(0,{r:-.32}),k(.5,{r:.32}),k(1,{r:-.32})],frontArm:[k(0,{r:.32}),k(.5,{r:-.32}),k(1,{r:.32})],torso:[k(0,{y:0}),k(.25,{y:-2}),k(.5,{y:0}),k(.75,{y:-2}),k(1,{y:0})]}},
  run:{duration:.48,tracks:{rearLeg:[k(0,{r:.7}),k(.5,{r:-.68}),k(1,{r:.7})],frontLeg:[k(0,{r:-.68}),k(.5,{r:.7}),k(1,{r:-.68})],rearArm:[k(0,{r:-.55}),k(.5,{r:.55}),k(1,{r:-.55})],frontArm:[k(0,{r:.55}),k(.5,{r:-.55}),k(1,{r:.55})],torso:[k(0,{r:.05,y:0}),k(.5,{r:.05,y:-3}),k(1,{r:.05,y:0})]}},
  shoot:{duration:.44,tracks:{rearArm:[k(0,{r:-PI/2.7}),k(.5,{r:-PI/2.5}),k(1,{r:-PI/2.7})],frontArm:[k(0,{r:-PI/2.2}),k(.5,{r:-PI/2}),k(1,{r:-PI/2.2})],weapon:[k(0,{r:0,x:0}),k(.5,{r:-.04,x:-2}),k(1,{r:0,x:0})]}},
  crouchShoot:{duration:.5,tracks:{torso:[k(0,{y:15}),k(1,{y:15})],head:[k(0,{y:12}),k(1,{y:12})],rearLeg:[k(0,{r:1.02,y:10}),k(1,{r:1.02,y:10})],frontLeg:[k(0,{r:-.78,y:10}),k(1,{r:-.78,y:10})],rearArm:[k(0,{r:-1.1}),k(1,{r:-1.1})],frontArm:[k(0,{r:-1.2}),k(1,{r:-1.2})]}},
  proneShoot:{duration:.55,tracks:{torso:[k(0,{r:PI/2,y:38,x:8}),k(1,{r:PI/2,y:38,x:8})],head:[k(0,{y:36,x:32}),k(1,{y:36,x:32})],rearLeg:[k(0,{r:PI/2,y:34,x:-25}),k(1,{r:PI/2,y:34,x:-25})],frontLeg:[k(0,{r:PI/2,y:39,x:-18}),k(1,{r:PI/2,y:39,x:-18})],rearArm:[k(0,{r:-1.15,y:20,x:18}),k(1,{r:-1.15,y:20,x:18})],frontArm:[k(0,{r:-1.25,y:20,x:18}),k(1,{r:-1.25,y:20,x:18})],weapon:[k(0,{y:26,x:22}),k(1,{y:26,x:22})]}},
  knocked:{duration:1,tracks:{torso:[k(0,{r:0}),k(1,{r:1.25,y:32})],head:[k(0,{r:0}),k(1,{r:.35,y:28,x:18})],rearLeg:[k(0,{r:0}),k(1,{r:.9,y:18})],frontLeg:[k(0,{r:0}),k(1,{r:-.75,y:26})]}},
  dead:{duration:1,tracks:{torso:[k(0,{r:1.5,y:45}),k(1,{r:1.5,y:45})],head:[k(0,{y:40,x:35,r:.25}),k(1,{y:40,x:35,r:.25})],rearLeg:[k(0,{r:1.35,y:45,x:-25}),k(1,{r:1.35,y:45,x:-25})],frontLeg:[k(0,{r:1.5,y:48,x:-18}),k(1,{r:1.5,y:48,x:-18})]}}
};
function lerp(a,b,t){return a+(b-a)*t;}
function sampleTrack(frames,t){if(!frames?.length)return{};if(t<=frames[0].t)return frames[0];for(let i=1;i<frames.length;i++){if(t<=frames[i].t){const a=frames[i-1],b=frames[i],p=(t-a.t)/(b.t-a.t||1);const out={};for(const key of ['x','y','r','sx','sy','px','py']){if(a[key]!=null||b[key]!=null)out[key]=lerp(a[key]??b[key]??0,b[key]??a[key]??0,p);}return out;}}return frames.at(-1);}
export class AnimationController {
  constructor(){this.animation='idle';this.time=0;this.playing=true;}
  setAnimation(name){if(ANIMATIONS[name]&&name!==this.animation){this.animation=name;this.time=0;}}
  update(dt){if(this.playing)this.time+=dt;}
  normalizedTime(){const a=ANIMATIONS[this.animation];return ((this.time%a.duration)/a.duration);}
  sample(name=this.animation, normalized=this.normalizedTime()){const a=ANIMATIONS[name]||ANIMATIONS.idle;const pose={};for(const [layer,frames] of Object.entries(a.tracks||{}))pose[layer]=sampleTrack(frames,normalized);return pose;}
}
