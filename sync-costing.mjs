import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync(new URL('./src/data/yza089a.json',import.meta.url),'utf8'));
const url=process.env.VITE_SUPABASE_URL?.replace(/\/$/,'');
const key=process.env.VITE_SUPABASE_ANON_KEY;
if(!url||!key)throw new Error('Missing Supabase environment.');
const endpoint=url+'/rest/v1/myc_workspace';
const headers={apikey:key,'Content-Type':'application/json',Prefer:'return=representation'};
const get=await fetch(endpoint+'?id=eq.main&select=id,data,revision',{headers,signal:AbortSignal.timeout(10000)});
if(!get.ok)throw new Error('Supabase read failed: '+get.status);
const row=(await get.json())[0];
if(!row)throw new Error('Workspace main is missing. Open the app to initialize it.');
const data=structuredClone(row.data);
if(!Array.isArray(data.projects)||!Array.isArray(data.components)||!Array.isArray(data.machines))throw new Error('Workspace data format is not recognized.');
let changed=false;
if(!Array.isArray(data.costings))data.costings=[];
if(!data.costings.some(s=>s.project==='YZA089A')){data.costings.push(source);changed=true;}
if(!data.projects.some(p=>p.code==='YZA089A')){data.projects.push({id:'p-yza089a',client:'SEPHORA',code:'YZA089A',quantity:0,status:'À compléter',due:''});changed=true;}
if(changed){
  const response=await fetch(endpoint+`?id=eq.main&revision=eq.${row.revision}`,{method:'PATCH',headers,body:JSON.stringify({data,revision:row.revision+1,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Supabase save failed: '+response.status);
  const updated=await response.json();
  if(!updated[0])throw new Error('Concurrent change detected. Nothing overwritten.');
  const verify=await fetch(endpoint+'?id=eq.main&select=data,revision',{headers,signal:AbortSignal.timeout(10000)});
  if(!verify.ok)throw new Error('Saved but verification failed: '+verify.status);
  const saved=(await verify.json())[0];
  const sheet=saved.data.costings.find(s=>s.project==='YZA089A');
  if(!sheet||sheet.lines.length!==18)throw new Error('Verification did not find the imported source lines.');
  console.log(JSON.stringify({status:'saved-and-verified',revision:saved.revision,projects:saved.data.projects.length,costLines:sheet.lines.length,historicalTotal:sheet.historicalTotal}));
}else console.log(JSON.stringify({status:'already-present-preserved',revision:row.revision}));
