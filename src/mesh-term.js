import {allTerms,matches} from './data.js';

export function wholeStructureLabel(term,quiz){return !quiz&&term.feature?term.name:null;}

// An edited bone remains a bone when clicked. Its individual landmark pins are
// selected explicitly from the explorer rather than through the entire surface.
export function refinementForMesh(mesh){
 if(mesh.userData.replacementAnatomy)return undefined;
 return allTerms.find(t=>t.representation?.refinement&&t.representation.parentPattern===mesh.userData.zname);
}

export function termForMesh(mesh){
 const reconstructed=refinementForMesh(mesh);if(reconstructed)return reconstructed;
 const base=mesh.userData.zname.replace(/\.[lr]$/,'');
 return allTerms.find(t=>t.exact&&t.pattern===base)||allTerms.find(t=>t.exact&&matches(t.pattern,mesh.userData.zname))||{
  id:'specimen-'+base.toLowerCase().replace(/[^a-z0-9]+/g,'-'),name:base,region:mesh.userData.region,
  type:mesh.userData.nonbone?'tissue':'bone',pattern:base,exact:true,aliases:[],source:'Full specimen · supplementary structure',
  cue:'Named anatomical geometry from the Z-Anatomy reference specimen. Use the surrounding bones to orient yourself.',
  representation:{kind:'mesh',reference:({Skull:'7.2',Spine:'7.3',Thorax:'7.4','Upper limb':'8.2',Pelvis:'8.3','Lower limb':'8.4',Joints:'9.6'})[mesh.userData.region]}
 };
}
