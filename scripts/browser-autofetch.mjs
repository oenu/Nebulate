// Public live acceptance: no credentials, inspect/observe prewarming or refresh clicks.
import assert from 'node:assert/strict';
import {rm} from 'node:fs/promises';
import {openBrowser} from './browser-driver.mjs';
const target=process.argv[2];
if(!['chrome','firefox'].includes(target) || process.argv[3]!=='--public')throw new Error('Use chrome|firefox --public explicitly.');
let browser;let stage='launch';
const report=details=>console.log(JSON.stringify({target,stage,...details}));
try{
 await rm(`.local/${target}-autofetch`,{recursive:true,force:true});
 browser=await openBrowser(target,{profileName:'autofetch'});
 await browser.goto(`${browser.origin}/options.html`);
 let status=await browser.message({type:'status'});
 assert.equal(status.jobs.length,0);assert.equal(status.videos,0);
 assert.ok(status.creators.some(c=>c.slug==='samonella'));
 for(const [slug,handle] of [['wendover','@Wendoverproductions'],['samonella','@SamONellaAcademy']]){
  stage=`automatic-${slug}`;
  await browser.goto(`https://www.youtube.com/${handle}/videos`);
  await browser.wait(()=>document.querySelector('yt-lockup-view-model[data-nebulate-state]:not([data-nebulate-state="checking"])'));
  if(slug==='wendover')assert.ok(await browser.evaluate(()=>document.querySelector('.nebulate-card-link')));
  await browser.goto(`${browser.origin}/options.html`);
  status=await browser.message({type:'status'});
  assert.ok(status.jobs.some(job=>job.slug===slug&&job.pages>0));
  report({result:'ok',fetchedAutomatically:true});
 }
 stage='cached-encounter-refresh';
 // Age only the persisted creator timestamp. Keep the video decisions fresh.
 const previous=await browser.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('nebulate-local');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('db-unavailable'));});
  const result=await new Promise((resolve,reject)=>{
   const tx=db.transaction(['jobs','decisions'],'readwrite');
   const jobs=tx.objectStore('jobs');const get=jobs.get('wendover');
   const original=[];
   get.onsuccess=()=>{jobs.put({...get.result,updatedAtMs:Date.now()-5*3600000});};
   const all=tx.objectStore('decisions').getAll();all.onsuccess=()=>{original.push(...all.result.filter(d=>d.creatorSlug==='wendover'&&d.state==='confirmed').map(d=>({videoId:d.videoId,checkedAtMs:d.checkedAtMs})));};
   tx.oncomplete=()=>resolve(original);tx.onerror=()=>reject(new Error('db-unavailable'));
  });db.close();return result;
 });
 assert.ok(previous.length>0);
 await browser.goto('https://www.youtube.com/@Wendoverproductions/videos');
 await browser.wait(()=>document.querySelector('.nebulate-card-link'));
 // Poll status in an extension page without ever requesting a refresh.
 await browser.goto(`${browser.origin}/options.html`);
 const deadline=Date.now()+30000;
 let refreshed=false;
 while(Date.now()<deadline){
  status=await browser.message({type:'status'});
  if(status.jobs.some(job=>job.slug==='wendover'&&job.status==='idle'&&job.updatedAtMs>Date.now()-60000)){refreshed=true;break;}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 assert.equal(refreshed,true);
 report({result:'ok',cachedMatchesTriggeredRefresh:true});
}catch{report({result:'failed'});process.exitCode=1;}
finally{await browser?.close();}
