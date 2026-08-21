import test from 'node:test';
import assert from 'node:assert/strict';

class PointLike { constructor(){this.x=0;this.y=0;} set(x=0,y=x){this.x=x;this.y=y;} }
class Container {
  constructor(){this.children=[];this.position=new PointLike();this.scale=new PointLike();this.pivot=new PointLike();this.visible=true;this.alpha=1;this.rotation=0;this.zIndex=0;this.sortableChildren=false;}
  addChild(...items){this.children.push(...items);return items.at(-1);}
  removeChildren(){const out=[...this.children];this.children.length=0;return out;}
  destroy(){this.children.length=0;}
}
class Graphics extends Container {
  roundRect(){return this;} fill(){return this;} stroke(){return this;} circle(){return this;} ellipse(){return this;}
  moveTo(){return this;} lineTo(){return this;} closePath(){return this;} arc(){return this;} rect(){return this;} clear(){return this;}
}
globalThis.PIXI={Container,Graphics};

test('layered rig builds and samples every required animation without baked sprite dependencies', async()=>{
  const { RigRenderer }=await import('../renderer/game/rendering/RigRenderer.js');
  const { ANIMATIONS }=await import('../renderer/game/rig/AnimationController.js');
  const { RIG_LAYERS }=await import('../renderer/game/rig/RigDefinition.js');
  const { defaultCosmetics }=await import('../renderer/game/data/cosmetics.js');
  const rig=new RigRenderer(defaultCosmetics());
  assert.equal(Object.keys(rig.parts).length,RIG_LAYERS.length);
  assert.ok(rig.parts.weapon,'weapon remains an independent rig layer');
  for(const animation of ['idle','walk','run','shoot','crouchShoot','proneShoot','knocked','dead']){
    assert.ok(ANIMATIONS[animation]);
    rig.update(0.1,animation,0.5);
  }
  rig.destroy();
});
