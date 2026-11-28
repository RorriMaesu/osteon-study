// Per-preparation, in-memory state. Filtering or leaving the body map does
// not alter the order in which its anatomical groups were removed.
export function createBodyDissection(map){
  const targets=new Map(map.organs.map(row=>[row.id,new Set(row.targets)]));
  const hasBones=Boolean(map.skeletonAsset||map.boneNames?.length);
  const removed=new Map();
  const partKey=(id,raw)=>JSON.stringify([id,raw]);
  let skin=false;
  let skeleton=hasBones&&map.key!=='body'?'xray':'off';
  return {
    get hiddenEntries(){return [...removed.values()].map(entry=>({...entry}));},
    get hiddenIds(){return [...removed.values()].filter(entry=>!entry.raw).map(entry=>entry.id);},
    get skinVisible(){return skin;},
    get skeletonMode(){return skeleton;},
    isHidden:id=>removed.has(id),
    isPartHidden:(id,raw)=>removed.has(id)||removed.has(partKey(id,raw)),
    hide(id){
      if(!targets.has(id)||removed.has(id)||(id==='skin'&&!skin))return null;
      removed.set(id,{id});
      if(id==='skin')skin=false;
      return id;
    },
    hidePart(id,raw){
      if(!targets.get(id)?.has(raw)||this.isPartHidden(id,raw))return null;
      if(targets.get(id).size===1)return null;
      removed.set(partKey(id,raw),{id,raw});
      return raw;
    },
    show(id){
      if(!removed.delete(id))return false;
      if(id==='skin')skin=true;
      return true;
    },
    showPart(id,raw){return removed.delete(partKey(id,raw));},
    undo(){
      const last=[...removed.values()].at(-1);
      if(!last)return null;
      if(last.raw)this.showPart(last.id,last.raw);
      else this.show(last.id);
      return last.id;
    },
    restore(){
      const count=removed.size;
      if(removed.has('skin'))skin=true;
      removed.clear();return count;
    },
    setSkin(on){
      if(!targets.has('skin')||skin===on)return false;
      if(on){removed.delete('skin');skin=true;}
      else this.hide('skin');
      return true;
    },
    setSkeleton(mode){
      if(!hasBones||!['off','solid','xray'].includes(mode)||mode===skeleton)return false;
      skeleton=mode;return true;
    }
  };
}
