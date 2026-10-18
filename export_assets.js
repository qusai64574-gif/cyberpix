// node export_assets.js  -> writes assets/ (sprite sheets, atlas json, individual PNGs)
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
(async()=>{const out=path.join(__dirname,'assets');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out+'/sprites',{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});const p=await b.newPage();
await p.goto('file://'+__dirname+'/cyberpix.html');await p.waitForTimeout(500);
const data=await p.evaluate(()=>{const A=window.ASSETS,res={cats:{}};const iconColors={};
 for(const cat of A.categories()){const s=A.sheet(cat);const sheet=s.canvas||s.sheet||s; const atlas=s.atlas||s.pos||null;
  const sp={};for(const n in A.cats[cat])sp[n]=A.cats[cat][n].toDataURL();
  res.cats[cat]={sheet:(sheet.toDataURL?sheet:s.c||sheet).toDataURL(),atlas,sprites:sp};}
 return res;});
let total=0;
for(const cat in data.cats){const c=data.cats[cat];fs.writeFileSync(`${out}/${cat}_sheet.png`,Buffer.from(c.sheet.split(',')[1],'base64'));
 if(c.atlas)fs.writeFileSync(`${out}/${cat}_atlas.json`,JSON.stringify(c.atlas,null,1));
 fs.mkdirSync(`${out}/sprites/${cat}`,{recursive:true});
 for(const n in c.sprites){fs.writeFileSync(`${out}/sprites/${cat}/${n}.png`,Buffer.from(c.sprites[n].split(',')[1],'base64'));total++}}
console.log('cats',Object.keys(data.cats).join(','),'sprites',total);await b.close()})();
