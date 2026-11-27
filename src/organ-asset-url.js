import organVersions from './organ-model-versions.json' with {type:'json'};
export function organAssetUrl(asset,base=document.baseURI){
  const url=new URL(asset,base);
  if(organVersions[asset])url.searchParams.set('v',organVersions[asset]);
  return url.href;
}
