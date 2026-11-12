// Points and label masks were inspected on the extracted OpenStax artwork.
// Crops retain anatomical context. These are study pins, not muscle segmentations.
const target=(figure,name,orientation,panel,point,cover,description,aliases=[],extra={})=>
 ({figure,name,orientation,panel,point,cover,description,aliases,...extra});

export const axialMusclePanels={
 '11.22':[{name:'Scapular positioners, anterior lateral dissection',bounds:[0,0,1180,920]},{name:'Scapular positioners, posterior with one side exposed',bounds:[975,0,1217,920]}],
 '11.7':[{name:'Face, anterior',bounds:[0,100,1320,1360]}],
 '11.9':[{name:'Right eye, lateral anatomical view',bounds:[0,0,1145,1100]}],
 '11.10':[{name:'Left jaw, superficial lateral',bounds:[0,0,1000,1067]},{name:'Left jaw, deep lateral dissection',bounds:[1210,0,965,1067]}],
 '11.11':[{name:'Extrinsic tongue muscles, lateral dissection',bounds:[0,0,1264,1213]}],
 '11.13':[{name:'Hyoid and anterior neck',bounds:[0,0,1683,1406]}],
 '11.14':[{name:'Left neck, lateral',bounds:[0,0,950,850]},{name:'Deep posterior neck',bounds:[1540,0,935,850]}],
 '11.15':[{name:'Deep back, posterior',bounds:[300,900,850,1717]}],
 '11.16':[{name:'Anterior abdominal wall layers, inset',bounds:[650,45,396,540]},{name:'Posterior abdominal wall, anterior view',bounds:[0,620,1046,731]}],
 '11.17':[{name:'Diaphragm, inferior view',bounds:[0,0,1863,1363]}],
 '11.19':[{name:'Female pelvic floor, superior view',bounds:[0,100,1917,1296]}],
 '11.20':[{name:'Male perineum, inferior view',bounds:[0,0,1210,1305]},{name:'Female perineum, inferior view',bounds:[780,100,1338,1205]}],
};

export const axialMuscleFigureTargets={
 'orbicularis-oculi':target('11.7','Orbicularis oculi','Face, anterior',[0,100,1320,1360],[716,749],[995,613,282,48],'The marker lies in the circular muscle around the eyelids, below the orbital opening.'),
 'orbicularis-oris':target('11.7','Orbicularis oris','Face, anterior',[0,100,1320,1360],[572,1112],[1000,987,269,49],'The marker lies in the muscle surrounding the mouth, below the lower lip.'),
 'temporalis':target('11.10','Temporalis','Left jaw, superficial lateral',[0,0,1000,1067],[631,287],[10,61,189,48],'The marker is on the broad fan-shaped muscle above the zygomatic arch.'),
 'masseter':target('11.10','Masseter','Left jaw, superficial lateral',[0,0,1000,1067],[520,718],[9,817,170,51],'The marker is on the broad jaw-closing muscle over the lateral mandibular ramus.'),
 'medial-pterygoid':target('11.10','Medial pterygoid','Left jaw, deep lateral dissection',[1210,0,965,1067],[1653,723],[1980,657,195,112],'The marker is on the predominantly vertical deep muscle on the medial side of the mandibular ramus.'),
 'lateral-pterygoid':target('11.10','Lateral pterygoid','Left jaw, deep lateral dissection',[1210,0,965,1067],[1691,530],[1990,19,185,90],'The marker is on the upper, more horizontal deep muscle approaching the mandibular neck and joint region.'),
 'levator-palpebrae-superioris':target('11.9','Levator palpebrae superioris','Right eye, lateral anatomical view',[0,0,1145,1100],[700,349],[159,46,492,50],'The marker lies on the superior muscle passing toward the upper eyelid, above the muscles attaching to the globe.'),
 'superior-rectus':target('11.9','Superior rectus','Right eye, lateral anatomical view',[0,0,1145,1100],[625,458],[20,238,157,88],'The marker is on the muscle running over the globe to attach to its superior surface.'),
 'hyoglossus':target('11.11','Hyoglossus','Extrinsic tongue muscles, lateral dissection',[0,0,1264,1213],[638,605],[1023,418,205,47],'The marker lies on the broad sheet ascending from the hyoid to the side of the tongue.'),
 'styloglossus':target('11.11','Styloglossus','Extrinsic tongue muscles, lateral dissection',[0,0,1264,1213],[742,386],[340,32,224,47],'The marker lies on the band passing from the styloid region toward the side of the tongue.'),
 'genioglossus':target('11.11','Genioglossus','Extrinsic tongue muscles, lateral dissection',[0,0,1264,1213],[405,700],[200,973,243,52],'The marker lies on the broad fan radiating from the inner anterior mandible into the tongue.'),
 'sternohyoid':target('11.13','Sternohyoid','Anterior neck, superficial strap muscle',[0,0,1683,1406],[851,814],[1436,814,217,46],'The marker lies on the long anterior neck strap rising from the sternal region toward the hyoid.'),
 'mylohyoid':target('11.13','Mylohyoid','Anterior neck, floor of mouth exposed',[0,0,1683,1406],[850,476],[1437,366,207,47],'The marker lies on the broad muscular floor of the mouth above the hyoid, rather than on a narrow strap.'),
 'sternocleidomastoid':target('11.14','Sternocleidomastoid','Left neck, lateral',[0,0,950,850],[262,379],[562,184,353,48],'The marker lies on the large oblique neck strap descending from behind the ear toward the sternum and clavicle.',['SCM']),
 'semispinalis-capitis':target('11.14','Semispinalis capitis','Deep neck, posterior; opposite side removed',[1740,80,735,610],[2071,420],[2245,446,229,88],'The marker lies on the broad vertical deep neck muscle beside the midline, extending toward the occipital bone.'),
 'multifidus':target('11.15','Multifidus','Deep back, posterior',[300,900,850,1717],[814,1932],[331,1850,178,47],'The marker lies on the deep muscle close to the vertebral spinous processes, with short oblique fiber bundles.',['Multifidus muscles']),
 'rectus-abdominis':target('11.16','Rectus abdominis','Anterior abdominal wall, enlarged layer inset',[650,45,396,540],[811,375],[660,466,161,27],'The marker lies on the vertical muscle exposed within the sheath, medial to the flat lateral-wall layers.'),
 'transversus-abdominis':target('11.16','Transversus abdominis','Anterior abdominal wall, enlarged layer inset',[650,45,396,540],[908,271],[829,118,117,48],'The marker lies on the deepest flat abdominal layer, whose fibers run mainly across the body.',['Transverse abdominal muscle']),
 'internal-oblique':target('11.16','Internal oblique','Anterior abdominal wall, enlarged layer inset',[650,45,396,540],[950,355],[910,552,136,29],'The marker lies on the oblique middle flat layer, between the reflected superficial layer and the transverse-fiber layer.',['Internal abdominal oblique'],{extraCovers:[[793,493,149,49]]}),
 'quadratus-lumborum':target('11.16','Quadratus lumborum','Posterior abdominal wall, anterior view',[0,620,1046,731],[363,840],[0,748,191,32],'The marker lies on the broad posterior abdominal muscle lateral to the lumbar vertebrae, above the iliac crest.'),
 'central-tendon-of-diaphragm':target('11.17','Central tendon of diaphragm','Diaphragm, inferior view',[0,0,1863,1260],[1006,289],[204,14,264,92],'The marker lies on the pale noncontractile central sheet receiving the surrounding muscle fibers.',['Central tendon']),
 'pubococcygeus':target('11.19','Pubococcygeus','Female pelvic floor, superior view',[0,100,1917,1296],[854,478],[1346,523,275,48],'The marker lies in the more medial levator-ani component alongside the pelvic openings.'),
 'iliococcygeus':target('11.19','Iliococcygeus','Female pelvic floor, superior view',[0,100,1917,1296],[882,691],[1346,758,246,49],'The marker lies on the more lateral fan of levator ani, anterior to the sacral region.'),
 'external-anal-sphincter':target('11.20','External anal sphincter','Male perineum, inferior view',[0,0,1210,1305],[433,713],[777,873,398,48],'The marker lies on the muscle encircling the anal opening, distinct from the broader pelvic-floor muscle beside it.'),
};

export const axialMuscleFigureNotes={
 '11.9':'Use the lateral anatomy panel for identification. The original anterior-view action arrows are not used for movement assessment; interpret rectus and oblique actions in a stated gaze position.',
 '11.13':'This is a dissection view with the inferior mandible cut away and muscles exposed at different depths. The hyoid separates the suprahyoid and infrahyoid groups.',
 '11.15':'The source uses “medial scalene”; the conventional name is middle scalene. Individual back-muscle columns have different attachments. The lower right inset removes multifidus.',
 '11.16':'The vertical anterior abdominal muscle is rectus abdominis. The upper inset exposes selected lateral-wall layers; the lower panel shows the posterior abdominal wall from the front.',
 '11.17':'The central tendon is connective tissue; the peripheral red tissue is muscle. This inferior view shows openings for major structures without simulating their movement.',
 '11.19':'This superior view depicts a female pelvic floor. Pubococcygeus and iliococcygeus are components of levator ani; the simplified plate does not display every pelvic-floor component separately.',
 '11.20':'These are inferior views of the perineum. The male and female panels show different arrangements and should retain their explicit orientation labels.',
};
