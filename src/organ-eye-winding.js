import {Vector3} from 'three';

// The registered donor's five mirrored left-eye meshes have reversed winding
// and inward shading normals. The registration and vertex positions are valid.
export function correctEyeWinding(mesh,rawName){
  if(!/^(cornea|iris|sclera|lens|retina)_left$/.test(rawName))return;
  const source=mesh.geometry,position=source.getAttribute('position'),faces=source.index;
  if(!position||!faces)return;
  if(!source.boundingBox)source.computeBoundingBox();
  const origin=source.boundingBox.getCenter(new Vector3());
  const a=new Vector3(),b=new Vector3(),c=new Vector3();
  let volume6=0;
  for(let i=0;i<faces.count;i+=3){
    a.fromBufferAttribute(position,faces.getX(i)).sub(origin);
    b.fromBufferAttribute(position,faces.getX(i+1)).sub(origin);
    c.fromBufferAttribute(position,faces.getX(i+2)).sub(origin);
    volume6+=a.dot(b.cross(c));
  }
  if(volume6>=0)return;
  const fixed=source.clone(),index=fixed.index,normal=fixed.getAttribute('normal');
  for(let i=0;i<index.count;i+=3){
    const middle=index.getX(i+1);
    index.setX(i+1,index.getX(i+2));index.setX(i+2,middle);
  }
  if(normal)for(let i=0;i<normal.count;i++)normal.setXYZ(i,-normal.getX(i),-normal.getY(i),-normal.getZ(i));
  else fixed.computeVertexNormals();
  mesh.geometry=fixed;
  return ()=>{mesh.geometry=source;fixed.dispose();};
}
