const storageKey = 'osteon-motion-reveal-v1';

// Enable after verifying the selected-muscle control across the three modes.
export const revealGroup = false;

export function createMotionRevealPreference() {
 let enabled = null;
 let bones = false;
 try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (typeof saved?.enabled === 'boolean') enabled = saved.enabled;
  bones = saved?.bones === true;
 } catch {
  // Keep the controls usable if storage is blocked or the preference is stale.
 }
 function save() {
  try {
   localStorage.setItem(storageKey,JSON.stringify({enabled,bones}));
  } catch {
   // Retain preference for this visit when storage is unavailable.
  }
 }
 return {
  enabled: mode => enabled ?? (mode === 'actions'),
  setEnabled(value) { enabled = value; save(); },
  fadeBones: () => bones,
  setFadeBones(value) { bones = value; save(); },
 };
}

export function observeMotionReveal(stage) {
 const status = stage.querySelector('.motion-reveal-status');
 stage.addEventListener('motionrevealchange', ({detail}) => {
  const {count,boneCount,boneBlocked,contributorCount,target} = detail;
  const text = [
   count ? `${count} ${count === 1 ? 'muscle' : 'muscles'} faded` : '',
   contributorCount ? 'Includes a contributor' : '',
   boneCount ? `${boneCount} ${boneCount === 1 ? 'bone' : 'bones'} faded` : '',
   boneBlocked ? 'Bone covers this view' : '',
  ].filter(Boolean).join(' · ');
  if (status.textContent !== text) status.textContent = text;
  status.title = target && text ? `Revealing ${target}. ${text}` : text;
  status.hidden = !text;
 });
}
