import { BASE_TRANSFORMS, RIG_LAYERS, blankRigOverrides } from '../rig/RigDefinition.js';
import { AnimationController } from '../rig/AnimationController.js';
import { itemById } from '../data/cosmetics.js';

function hex(value,fallback=0xffffff){if(typeof value==='number')return value;const s=(value||'').replace('#','');return /^[0-9a-fA-F]{6}$/.test(s)?parseInt(s,16):fallback;}
function item(selection,slot){return itemById(selection?.[slot]);}

export class RigRenderer {
  constructor(cosmetics={}, overrides=null) {
    this.root=new PIXI.Container(); this.root.sortableChildren=true; this.cosmetics={...cosmetics}; this.cosmeticKey=JSON.stringify(this.cosmetics); this.controller=new AnimationController();
    this.overrides=overrides||blankRigOverrides(); this.parts={}; this.build();
  }
  build(){for(let i=0;i<RIG_LAYERS.length;i++){const layer=RIG_LAYERS[i],c=new PIXI.Container();c.zIndex=i;this.root.addChild(c);this.parts[layer]=c;}this.redraw();}
  setCosmetics(c){const key=JSON.stringify(c||{});if(key===this.cosmeticKey)return;this.cosmetics={...c};this.cosmeticKey=key;this.redraw();}
  setOverrides(o){this.overrides=o||blankRigOverrides();}
  redraw(){for(const p of Object.values(this.parts))p.removeChildren();
    const skin=hex(item(this.cosmetics,'head')?.color,0xd7aa84), torso=hex(item(this.cosmetics,'torso')?.color,0x657248), arms=hex(item(this.cosmetics,'arms')?.color,torso), hands=hex(item(this.cosmetics,'hands')?.color,0x30343a), legs=hex(item(this.cosmetics,'legs')?.color,0x596345), boots=hex(item(this.cosmetics,'legs')?.boot,0x34383c), hair=hex(item(this.cosmetics,'hair')?.color,0x4b2f22);
    const limb=(color)=>new PIXI.Graphics().roundRect(-8,-22,16,44,7).fill(color).stroke({color:0x1a2026,width:2});
    const leg=(side)=>{const g=new PIXI.Graphics();g.roundRect(-9,-20,18,37,6).fill(legs).stroke({color:0x1a2026,width:2});g.roundRect(side==='front'?-8:-10,13,27,13,5).fill(boots).stroke({color:0x1a2026,width:2});return g;};
    this.parts.rearLeg.addChild(leg('rear'));this.parts.frontLeg.addChild(leg('front'));
    this.parts.torso.addChild(new PIXI.Graphics().roundRect(-22,-24,44,48,12).fill(torso).stroke({color:0x192027,width:2}));
    this.parts.rearArm.addChild(limb(arms));this.parts.frontArm.addChild(limb(arms));
    this.parts.head.addChild(new PIXI.Graphics().circle(0,0,24).fill(skin).stroke({color:0x192027,width:2}));
    const face=new PIXI.Graphics();face.circle(9,-4,3.5).fill(0x20242a);if(item(this.cosmetics,'face')?.assetId==='face_soft')face.circle(15,7,2).fill(0xc98176);else face.moveTo(9,8).lineTo(16,7).stroke({color:0x4b3329,width:2});this.parts.face.addChild(face);
    const hg=new PIXI.Graphics();const hairAsset=item(this.cosmetics,'hair')?.assetId||'hair_messy';if(hairAsset==='hair_bob')hg.ellipse(-5,-8,25,20).fill(hair);else if(hairAsset==='hair_ponytail'){hg.ellipse(-4,-12,24,16).fill(hair);hg.circle(-27,-3,10).fill(hair);}else if(hairAsset==='hair_sweep'){hg.moveTo(-22,-13).lineTo(12,-25).lineTo(22,-5).lineTo(-18,-1).closePath().fill(hair);}else{hg.moveTo(-22,-8).lineTo(-15,-28).lineTo(-5,-20).lineTo(4,-30).lineTo(12,-19).lineTo(23,-10).lineTo(15,0).lineTo(-20,0).closePath().fill(hair);}this.parts.hair.addChild(hg);
    const glove=()=>new PIXI.Graphics().roundRect(-7,-7,14,14,5).fill(hands).stroke({color:0x192027,width:2});this.parts.hands.addChild(glove());
    const weapon=new PIXI.Graphics();weapon.roundRect(-20,-4,48,8,3).fill(0x39424b).stroke({color:0x161a1e,width:2});weapon.rect(5,4,7,15).fill(0x2d343a);weapon.rect(23,-2,20,4).fill(0x2d343a);this.parts.weapon.addChild(weapon);
    if(item(this.cosmetics,'helmet')?.assetId!=='none')this.parts.helmet.addChild(new PIXI.Graphics().arc(0,2,27,Math.PI,Math.PI*2).stroke({color:hex(item(this.cosmetics,'helmet')?.color,0x66704d),width:12}));
    if(item(this.cosmetics,'vest')?.assetId!=='none')this.parts.vest.addChild(new PIXI.Graphics().roundRect(-20,-21,40,34,7).fill({color:hex(item(this.cosmetics,'vest')?.color,0x806c4d),alpha:.8}).stroke({color:0x24282b,width:2}));
    if(item(this.cosmetics,'backpack')?.assetId!=='none')this.parts.backpack.addChild(new PIXI.Graphics().roundRect(-18,-22,27,42,8).fill(hex(item(this.cosmetics,'backpack')?.color,0x596348)).stroke({color:0x202529,width:2}));
  }
  update(dt,animation=null,normalized=null){if(animation)this.controller.setAnimation(animation);this.controller.update(dt);const pose=this.controller.sample(this.controller.animation,normalized??this.controller.normalizedTime());for(const layer of RIG_LAYERS){const p=this.parts[layer],base=BASE_TRANSFORMS[layer],anim=pose[layer]||{},o=this.overrides?.[layer]||{};p.position.set(base.x+(anim.x||0)+(o.x||0),base.y+(anim.y||0)+(o.y||0));p.rotation=base.r+(anim.r||0)+(o.r||0);p.scale.set((base.sx||1)*(anim.sx||1)*(o.sx??1),(base.sy||1)*(anim.sy||1)*(o.sy??1));p.pivot.set(base.px+(anim.px||0)+(o.px||0),base.py+(anim.py||0)+(o.py||0));}}
  destroy(){this.root.destroy({children:true});}
}
