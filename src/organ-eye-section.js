// Illustrative optical finishes for the sagittal HRA eye. The transparent
// media keep enough contrast to reveal their cut profile during accommodation.
const tissues={
  sclera:      {color:'#dfdcd4',opacity:1,roughness:.42},
  choroid:     {color:'#4c302c',opacity:1,roughness:.69},
  retina:      {color:'#cd9e90',opacity:1,roughness:.58},
  cornea:      {color:'#dce9e6',opacity:.20,roughness:.13},
  lens:        {color:'#e6e3cf',opacity:.52,roughness:.18},
  iris:        {color:'#826043',opacity:1,roughness:.63},
  ciliarymuscle:{color:'#885348',opacity:1,roughness:.64},
  zonules:     {color:'#dddad0',opacity:.82,roughness:.46},
  maculalutea: {color:'#be955e',opacity:1,roughness:.57},
  fovea:       {color:'#926552',opacity:1,roughness:.55},
  opticdisc:   {color:'#eac2ad',opacity:1,roughness:.59}
};

export function eyeSectionTissue(rawName){
  return tissues[String(rawName).replace(/[_. ]/g,'').toLowerCase()];
}
