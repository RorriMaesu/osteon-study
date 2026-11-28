// Gross tooth surfaces in the atlas do not distinguish crown, root or enamel layers.
export const TOOTH_COLOR=0xf1eee6;
export const TOOTH_ROUGHNESS=.32;

const toothName=/^(?:upper_teeth|lower_teeth|(?:PoseBone_)?(?:Upper|Lower) (?:(?:medial|lateral|central) incisor|canine|(?:first|second|third) (?:premolar|molar)(?: tooth)?)\.[lr](?:\.\d+)?)$/i;

export function isToothName(name){return typeof name==='string'&&toothName.test(name);}

export function isToothMesh(mesh){
  return mesh.userData?.zmat==='Teeth'||isToothName(mesh.userData?.zname)||isToothName(mesh.userData?.name)||isToothName(mesh.name);
}
