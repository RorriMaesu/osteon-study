"""Fetch named BodyParts3D source OBJ data, preserving provenance and hashes.

Run against the task workspace. Metadata indexes are read from the research
folder; all geometry is downloaded from the original Anatomography endpoint.
No downloaded scripts are executed. No installed application settings change.
"""
from pathlib import Path
import urllib.request,urllib.parse,http.cookiejar,json,zipfile,io,csv,hashlib,sys,re
root=Path(sys.argv[1]).resolve();wanted=set(sys.argv[2:]);folder=root/'work/muscle-reconstruction';dest=folder/'primary-obj';dest.mkdir(parents=True,exist_ok=True)
rows=list(csv.DictReader((folder/'MANIFEST.csv').open(encoding='utf-8-sig')))
have={p.name.split('_')[0]for p in dest.glob('*.obj')};items=[r for r in rows if r['fj_id']in wanted-have]
assert {r['fj_id']for r in rows}>=wanted,'An unknown source ID was requested'
if items:
 session=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 session.addheaders=[('User-Agent','Mozilla/5.0'),('Referer','https://lifesciencedb.jp/bp3d/?lng=en')]
 with session.open('https://lifesciencedb.jp/bp3d/?lng=en',timeout=30)as r:r.read()
 body=urllib.parse.urlencode({'ids':json.dumps([r['fj_id']for r in items]),'rep_id':json.dumps(sorted({r['bp_id']for r in items})),'type':'art_file','all_downloads':'1'}).encode()
 with session.open(urllib.request.Request('https://lifesciencedb.jp/bp3d/download.cgi',data=body),timeout=55)as r:raw=r.read()
 with zipfile.ZipFile(io.BytesIO(raw))as z:
  for member in z.infolist():
   name=Path(member.filename).name
   if name.endswith('.obj')and name.split('_')[0]in wanted:(dest/name).write_bytes(z.read(member))
 print('DOWNLOADED',len(items),'requested meshes;',len(raw),'zip bytes',flush=True)
assert wanted<={p.name.split('_')[0]for p in dest.glob('*.obj')},'A requested mesh is missing'
records=[]
for p in sorted(dest.glob('*.obj')):
 raw=p.read_bytes();assert b'\nv 'in raw or raw.startswith(b'v '),p.name
 records.append({'file':p.name,'fj':p.name.split('_')[0],'fma':re.search(r'_FMA(\d+)_',p.name).group(1),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
(dest/'source-manifest.json').write_text(json.dumps({'source':'BodyParts3D / Anatomography 4.3','sourceURL':'https://lifesciencedb.jp/bp3d/','downloadEndpoint':'https://lifesciencedb.jp/bp3d/download.cgi','license':'CC BY 4.0','licenseURL':'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html','attribution':'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International','files':records},indent=2)+'\n',encoding='utf-8')
print('VERIFIED',len(records),'source OBJ files',flush=True)
