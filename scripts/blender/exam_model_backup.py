"""Snapshot model files before any model save/export. Never overwrites a snapshot."""
import hashlib,json,shutil,sys
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(sys.argv[sys.argv.index('--')+1]).resolve() if '--' in sys.argv else Path(__file__).resolve().parents[4]
DEST=ROOT/'outputs/model-backups'
DEFAULTS=[ROOT/'outputs/osteon-study/assets/skeleton.glb',ROOT/'outputs/osteon-study/assets/course-tissues.glb',ROOT/'outputs/osteon-models/landmark-details.blend',ROOT/'outputs/osteon-study/assets/landmark-details.glb']
def backup(reason,paths=None):
 DEST.mkdir(parents=True,exist_ok=True)
 n=max([int(p.name.split('-')[0]) for p in DEST.iterdir() if p.is_dir() and p.name[:3].isdigit()]+[0])+1
 folder=DEST/f'{n:03d}-{datetime.now(timezone.utc):%Y%m%d-%H%M%S}'
 folder.mkdir()
 records=[]
 for p in paths or DEFAULTS:
  p=Path(p).resolve();rec={'original':str(p),'existed':p.exists()}
  if p.exists():
   out=folder/p.name
   if out.exists():raise ValueError('Duplicate snapshot filename: '+p.name)
   shutil.copy2(p,out);rec.update(file=out.name,bytes=p.stat().st_size,sha256=hashlib.file_digest(out.open('rb'),'sha256').hexdigest())
   assert hashlib.file_digest(p.open('rb'),'sha256').hexdigest()==rec['sha256']
  records.append(rec)
 manifest={'created':datetime.now(timezone.utc).isoformat(),'reason':reason,'files':records}
 (folder/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
 log=DEST/'history.json';history=json.loads(log.read_text()) if log.exists() else []
 history.append({'snapshot':folder.name,**manifest});log.write_text(json.dumps(history,indent=2),encoding='utf-8')
 print(str(folder));return folder
if __name__=='__main__':backup(sys.argv[1], [Path(x) for x in sys.argv[2:]] or None)
