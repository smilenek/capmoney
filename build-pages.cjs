const fs=require('node:fs');
const path=require('node:path');
const root=__dirname,out=path.join(root,'dist');
const files=['index.html','style.css','pro.css','ui.css','app.js','pro.js','profile.js','location.js','finance.js','media.js','sharing.js','backup-schedule.js','scheduled-backup.js','pwa.js','sw.js','manifest.json','README-GITHUB-PAGES.md','.nojekyll'];
fs.mkdirSync(out,{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const folder of ['icons','vendor'])fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
console.log('Static website ready: '+out);
