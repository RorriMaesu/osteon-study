// Visually checked on both sides of the atlas: supported fist angles, not a
// claim of clinical full range of motion or simulated hand contact.
// The 60/70-degree MCP/PIP limits previously stopped this rig at a loose grip.
// Finger ranges are now 80/90 after reviewing the actual rendered surfaces.
// Reference: https://sportsmedref.amssm.org/physical-examination/wrist-hand/
// The wrist stays straight; pronation belongs to the forearm.
export function boxingHandPose(side,{pronation=0}={}){
 if(side!=='left'&&side!=='right')throw new TypeError('Choose left or right for a boxing hand.');
 const pose={
  [side+'-forearm']:{pronation:Math.max(0,Math.min(60,Number(pronation)||0))},
  [side+'-wrist']:{flexion:0,deviation:0},
  // CMC flexion brings the thumb across the outside of the folded fingers.
  // The rig's full opposition adds axial rotation that instead points its
  // distal thumb upward; it is not the desired closed-fist orientation.
  [side+'-thumb-cmc']:{opposition:0,flexion:25,abduction:15},
  [side+'-thumb-mcp']:{flexion:20},
  [side+'-thumb-ip']:{flexion:60},
 };
 for(const digit of ['index','middle','ring','little']){
  pose[side+'-'+digit+'-mcp']={flexion:80,abduction:0};
  pose[side+'-'+digit+'-pip']={flexion:90};
  pose[side+'-'+digit+'-dip']={flexion:45};
 }
 return pose;
}
