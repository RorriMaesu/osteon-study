import {Vector3} from 'three';

export function addSideGuide(viewport,api){
  const guide=document.createElement('span');
  guide.className='ap2-practical-side';viewport.append(guide);
  // These registered HRA, Z-Anatomy and BodyParts3D specimens use negative X for subject right.
  function update(){
    api.camera.updateMatrixWorld();
    const right=new Vector3(-1,0,0).transformDirection(api.camera.matrixWorldInverse);
    const directions=['→','↗','↑','↖','←','↙','↓','↘'];
    const text=Math.abs(right.z)>.88?(right.z>0?'toward you':'away from you'):directions[(Math.round(Math.atan2(right.y,right.x)/(Math.PI/4))+8)%8];
    guide.textContent='Subject’s right '+text;
  }
  api.controls.addEventListener('change',update);api.addCleanup(()=>api.controls.removeEventListener('change',update));update();
}
