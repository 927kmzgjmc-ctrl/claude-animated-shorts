const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:3300}});
await p.goto('file://'+process.cwd()+'/logos.html');await p.evaluate(()=>document.fonts.ready);
for(const id of ['a','b','c']) await (await p.$('#'+id)).screenshot({path:`pp_${id}.png`});
await b.close();})();
