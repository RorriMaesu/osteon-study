// Each station follows one representative blood stream in normal adult anatomy.
const leftHeart=['Left ventricle','chamber','Blood crosses the aortic valve as the ventricle ejects.'];
const arch=['Aortic arch','artery','Blood reaches the arch through the ascending aorta. Branch origin differs between the two sides.'];
const lowerOrigin=[
  leftHeart,['Descending aorta','artery','Follow the aortic arch into the descending thoracic and abdominal aorta.'],
  ['Common iliac artery','artery','Near the L4 vertebral level the abdominal aorta usually bifurcates. Follow one side toward the leg.'],
  ['External iliac artery','artery','The external iliac artery runs toward the inguinal ligament. The internal iliac branch supplies the pelvis.'],
  ['Femoral artery','artery','Crossing deep to the inguinal ligament changes the vessel name to femoral artery.'],
  ['Popliteal artery','artery','After the adductor hiatus the artery lies behind the knee in the popliteal fossa.']
];
const returnFromKnee=[
  ['Femoral vein','vein','Deep blood ascends through the thigh. The great saphenous vein joins the femoral vein near the groin.'],
  ['External iliac vein','vein','The femoral vein becomes the external iliac vein deep to the inguinal ligament.'],
  ['Common iliac vein','vein','Internal and external iliac veins join on each side.'],
  ['Inferior vena cava','vein','The common iliac veins unite. Their blood ascends through the abdomen.'],
  ['Right atrium','chamber','The inferior vena cava empties into the right atrium.']
];
export const limbRoutes={
  rightArm:{label:'Arterial supply to the right hand',steps:[
    leftHeart,arch,['Brachiocephalic trunk','artery','The usual right-sided route enters the first arch branch. The left subclavian arises directly from the arch.'],
    ['Right subclavian artery','artery','The trunk divides into the right common carotid and right subclavian arteries. Follow the latter toward the first rib.'],
    ['Axillary artery','artery','The subclavian becomes axillary at the lateral border of the first rib.'],
    ['Brachial artery','artery','At the inferior edge of teres major the artery becomes the brachial artery.'],
    ['Radial artery','artery','Follow the radial branch on the thumb side of the forearm.'],
    ['Deep palmar arch','artery','The radial artery contributes most of the deep palmar arch in the usual pattern.']
  ]},
  footArtery:{label:'Aorta to the dorsum of the foot',steps:[
    ...lowerOrigin,['Anterior tibial artery','artery','This branch passes into the anterior compartment of the leg and descends toward the ankle.'],
    ['Dorsalis pedis artery','artery','At the front of the ankle the anterior tibial continues onto the dorsum of the foot as dorsalis pedis.']
  ]},
  footDeep:{label:'Deep return from the foot',steps:[
    ['Plantar venous arches','vein','Begin in the veins draining the sole of the foot.'],
    ['Posterior tibial veins','vein','Deep paired veins accompany the posterior tibial artery up the leg.'],
    ['Popliteal vein','vein','Deep venous pathways converge near the posterior knee.'],
    ...returnFromKnee
  ]},
  footSuperficial:{label:'Superficial return from the foot',steps:[
    ['Dorsal venous arch','vein','Choose the medial side of the superficial venous network on the dorsum of the foot.'],
    ['Great saphenous vein','vein','The medial marginal vein continues into the great saphenous vein, anterior to the medial malleolus. Follow it up the medial leg and thigh.'],
    ...returnFromKnee
  ]}
};

