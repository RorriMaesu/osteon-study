// Move the original controls so an expanded specimen uses the same classroom
// selection, quiz state and playback clock. Restore their exact positions on exit.
const stations=[
  ['[data-ap3-view]','[data-ap3-specimen]',':scope > .ac-row, :scope > [data-ap3-selection], :scope > [data-ap3-route-state], :scope > [data-ap3-breath-state], :scope > [data-ap3-node-context], :scope > [data-ap3-handoff], :scope > [data-ap3-described]'],
  ['[data-specimen-host]','[data-specimen-content]', ':scope > .course-actions, :scope > [data-spot-open], :scope > [data-spot], :scope > [data-region-reading], :scope > [data-specimen-reading]'],
  ['[data-organ-host]','[data-organ-kind]',':scope > .ac-row, :scope > [data-junction-settings], :scope > [data-conduct-settings], :scope > [data-target-name], :scope > [data-spot-area]'],
  ['[data-micro-stage]','[data-tissue-station]',':scope > .course-actions, :scope > [data-tissue-note]'],
  ['[data-fetal-view]','[data-fetal-flow]',':scope > .course-actions, :scope > label, :scope > [data-fetal-segment]'],
  ['[data-body-model]','[data-body-systems]','.ap2-body-controls, .ap2-body-pick, [data-body-info]'],
  ['[data-vessel-stage]',null,':scope > .course-actions, :scope > [data-wall-note]'],
  ['[data-fetal-view]','[data-fetal-flow]',':scope > .course-actions, label:has(> [data-fetal-position]), [data-fetal-segment]'],
  ['[data-region-canvas]',null,':scope > label:has([data-region-target], [data-region-isolate]), :scope > [data-region-focus], :scope > [data-region-detail]'],
  ['[data-organ]','[data-gland-station]','label:has(> [data-part]), label:has(> [data-region])'],
  ['[data-micro-model]','[data-gland-station]','[data-secretion], [data-path-label], label:has(> [data-cell]), label:has(> [data-follicle-step])']
];

export function winterExpandedControls(host){
  const config=stations.find(([selector])=>host.matches(selector));
  if(!config)return {};
  const [,selector,controls]=config;
  let tray,positions=[];
  return {onExpand(active){
    if(active&&!tray){
      const station=selector?host.closest(selector):host.parentElement;
      const items=[...(station?.querySelectorAll(controls)||[])].filter(el=>!host.contains(el));
      if(!items.length)return;
      tray=document.createElement('div');tray.className='winter-expanded-controls';
      tray.setAttribute('role','group');tray.setAttribute('aria-label','Specimen controls');
      for(const el of items){
        const place=document.createComment('specimen control');
        el.replaceWith(place);tray.append(el);positions.push([el,place]);
      }
      host.append(tray);
      // Course cards can be transformed or clipped. The browser's top layer
      // escapes that containing block without moving the live WebGL canvas.
      if(host.showPopover){host.popover='manual';host.showPopover();}
    }else if(!active&&tray){
      if(host.hasAttribute('popover')){if(host.matches(':popover-open'))host.hidePopover();host.removeAttribute('popover');}
      for(const [el,place] of positions)place.replaceWith(el);
      tray.remove();tray=null;positions=[];
    }
  }};
}
