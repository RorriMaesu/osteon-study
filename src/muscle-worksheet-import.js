// Only image bytes are read. Imported documents are never rendered as HTML,
// uploaded, or written to persistent browser storage.
export const worksheetImageSignatures={
 '5c5632d294de1732402d451574e08fc6fbe371de458abe8b087d0a4e5d6e41d3':{id:'body',type:'image/jpeg',width:500,height:500},
 'e3626d77bacf2d2e168a8fc5ccde4b50a65a6e096a28e2a5a2720942784387fd':{id:'arms',type:'image/png',width:527,height:657},
 'fcbea903e0ff8b7e3b6a3a327139c8c3bad22d0db124087f99d5fdaeffea7a12':{id:'leg',type:'image/png',width:700,height:550},
 'e7ae2e1a765d97d9564ef956c15076e594fd25d74737debee791c19880f8c9cd':{id:'limbs',type:'image/png',width:700,height:550},
};
const MAX_FILE=20*1024*1024,MAX_IMAGE=4*1024*1024,MAX_TOTAL=16*1024*1024;
const fail=message=>{throw new Error(message);};
const decoder=new TextDecoder('utf-8',{fatal:true});
export function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}

export function worksheetZipEntries(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length>MAX_FILE||bytes.length<22)fail('Choose the original worksheet DOCX, up to 20 MB.');
 let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
 if(end<0)fail('This file is not a readable DOCX archive.');
 const count=view.getUint16(end+10,true),size=view.getUint32(end+12,true),offset=view.getUint32(end+16,true);
 if(view.getUint16(end+4,true)||view.getUint16(end+6,true)||count!==view.getUint16(end+8,true)||count>500||offset+size>end)fail('This DOCX archive format is not supported.');
 let p=offset,total=0;const entries=[],names=new Set();
 for(let i=0;i<count;i++){
  if(p+46>offset+size||view.getUint32(p,true)!==0x02014b50)fail('The DOCX directory is damaged.');
  const flags=view.getUint16(p+8,true),method=view.getUint16(p+10,true),crc=view.getUint32(p+16,true),compressed=view.getUint32(p+20,true),length=view.getUint32(p+24,true),nameLength=view.getUint16(p+28,true),extra=view.getUint16(p+30,true),comment=view.getUint16(p+32,true),local=view.getUint32(p+42,true);
  if(p+46+nameLength+extra+comment>offset+size)fail('The DOCX directory is incomplete.');
  let name;try{name=decoder.decode(bytes.subarray(p+46,p+46+nameLength));}catch{fail('The DOCX contains an unreadable filename.');}
  if(names.has(name)||name.includes('\\')||name.startsWith('/')||name.split('/').includes('..'))fail('The DOCX contains an invalid or duplicate entry.');names.add(name);
  if(/^word\/media\/[^/]+\.(png|jpe?g)$/i.test(name)){
   if((flags&1)||![0,8].includes(method)||length>MAX_IMAGE||compressed>MAX_FILE||(total+=length)>MAX_TOTAL)fail('The embedded images are encrypted, too large, or use an unsupported format.');
   if(local+30>offset||view.getUint32(local,true)!==0x04034b50)fail('An embedded image is incomplete.');
   const localName=view.getUint16(local+26,true),localExtra=view.getUint16(local+28,true),start=local+30+localName+localExtra;
   if(start+compressed>offset||view.getUint16(local+8,true)!==method||view.getUint16(local+6,true)!==flags||decoder.decode(bytes.subarray(local+30,local+30+localName))!==name)fail('An embedded image does not match its directory entry.');
   entries.push({name,method,crc,length,compressed:bytes.subarray(start,start+compressed)});
  }
  p+=46+nameLength+extra+comment;
 }
 if(p!==offset+size||!names.has('word/document.xml')||!names.has('[Content_Types].xml'))fail('Choose a Word DOCX worksheet.');
 return entries;
}

export async function inflateWorksheetEntry(entry){
 let bytes;
 if(entry.method===0)bytes=entry.compressed;
 else{
  let decompressor;try{decompressor=new DecompressionStream('deflate-raw');}catch{fail('This browser cannot open DOCX images. Update the browser or choose the original PNG/JPEG images instead.');}
  const reader=new Blob([entry.compressed]).stream().pipeThrough(decompressor).getReader(),chunks=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>entry.length||length>MAX_IMAGE){await reader.cancel();fail('An embedded image is larger than declared.');}chunks.push(value);}}catch(error){try{await reader.cancel();}catch{}throw error;}finally{reader.releaseLock();}
  bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 }
 if(bytes.length!==entry.length||crc32(bytes)!==entry.crc)fail('An embedded image failed its integrity check. Choose the original worksheet again.');
 return bytes;
}
export async function identifyWorksheetImage(bytes){
 const digest=await crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 return worksheetImageSignatures[hash]||null;
}
export async function readMuscleWorksheetFile(file){
 if(!file||file.size>MAX_FILE)fail('Choose a DOCX or original image up to 20 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const payloads=/\.docx$/i.test(file.name)?await Promise.all(worksheetZipEntries(bytes).map(inflateWorksheetEntry)):[bytes];
 const result=[];
 for(const data of payloads){const image=await identifyWorksheetImage(data);if(image&&!result.some(item=>item.id===image.id))result.push({...image,blob:new Blob([data],{type:image.type})});}
 if(!result.length)fail('No matching worksheet images were found. Choose the original “Muscle Diagrams for Studying.docx” or its unchanged images. Other pictures cannot share these answer coordinates.');
 return result;
}
