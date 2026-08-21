import { RigRenderer } from './RigRenderer.js';
export class CharacterRenderer {
  constructor(container){this.container=container;this.rigs=new Map();}
  ensure(member){let r=this.rigs.get(member.id);if(!r){r=new RigRenderer(member.cosmetics);this.rigs.set(member.id,r);this.container.addChild(r.root);}return r;}
  render(renderEntries,dt,groundY,scale=1){const visible=new Set();for(const e of renderEntries){visible.add(e.member.id);const rig=this.ensure(e.member);rig.setCosmetics(e.member.cosmetics);rig.root.visible=true;rig.root.position.set(e.x,groundY);rig.root.scale.set(scale*(e.enemy ? .88 : 1));rig.root.alpha=e.member.state==='downed' ? .75 : e.member.state==='dead' ? .45 : 1;rig.update(dt,e.member.stance==='alive'?'idle':e.member.stance);}
    for(const [id,rig] of this.rigs)if(!visible.has(id))rig.root.visible=false;
  }
  destroy(){for(const r of this.rigs.values())r.destroy();this.rigs.clear();}
}
