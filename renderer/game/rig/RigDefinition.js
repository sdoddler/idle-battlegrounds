export const RIG_LAYERS=['backpack','rearLeg','frontLeg','torso','vest','rearArm','head','face','hair','helmet','weapon','frontArm','hands'];
export const BASE_TRANSFORMS=Object.freeze({
  backpack:{x:-16,y:-38,r:0,sx:1,sy:1,px:0,py:0}, rearLeg:{x:-12,y:5,r:0,sx:1,sy:1,px:0,py:-18}, frontLeg:{x:12,y:5,r:0,sx:1,sy:1,px:0,py:-18},
  torso:{x:0,y:-38,r:0,sx:1,sy:1,px:0,py:0}, vest:{x:0,y:-38,r:0,sx:1,sy:1,px:0,py:0}, rearArm:{x:-16,y:-36,r:0,sx:1,sy:1,px:0,py:-12},
  head:{x:0,y:-82,r:0,sx:1,sy:1,px:0,py:0}, face:{x:0,y:-82,r:0,sx:1,sy:1,px:0,py:0}, hair:{x:0,y:-82,r:0,sx:1,sy:1,px:0,py:0}, helmet:{x:0,y:-84,r:0,sx:1,sy:1,px:0,py:0},
  weapon:{x:29,y:-43,r:0,sx:1,sy:1,px:-20,py:0}, frontArm:{x:17,y:-36,r:0,sx:1,sy:1,px:0,py:-12}, hands:{x:27,y:-42,r:0,sx:1,sy:1,px:0,py:0}
});
export function blankRigOverrides(){return Object.fromEntries(RIG_LAYERS.map(k=>[k,{x:0,y:0,r:0,sx:1,sy:1,px:0,py:0}]));}
