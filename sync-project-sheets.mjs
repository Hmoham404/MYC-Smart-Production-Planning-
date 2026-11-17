import fs from 'node:fs';
import {hydrateProjectSheets} from './src/project-sheets.ts';
const source=JSON.parse(fs.readFileSync('src/data/production-source.json','utf8'));
const endpoint=process.env.VITE_SUPABASE_URL?.replace(/\/$/,'')+'/rest/v1/myc_workspace';
const headers={apikey:process.env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json',Prefer:'return=representation'};
const response=await fetch(endpoint+'?id=eq.main&select=data,revision',{headers,signal:AbortSignal.timeout(10000)});
if(!response.ok)throw new Error('Read failed: '+response.status);
const row=(await response.json())[0];if(!row)throw new Error('Workspace absent.');
const data={...row.data,plans:(row.data.plans||[]).map(p=>hydrateProjectSheets(p,source))};
if(JSON.stringify(data)===JSON.stringify(row.data)){console.log(JSON.stringify({status:'already-current',revision:row.revision}));process.exit(0);}
const write=await fetch(endpoint+`?id=eq.main&revision=eq.${row.revision}`,{method:'PATCH',headers,body:JSON.stringify({data,revision:row.revision+1,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(10000)});
if(!write.ok)throw new Error('Save failed: '+write.status);
if(!(await write.json())[0])throw new Error('Concurrent update detected. No data overwritten.');
const check=await fetch(endpoint+'?id=eq.main&select=data,revision',{headers,signal:AbortSignal.timeout(10000)});
if(!check.ok)throw new Error('Readback failed.');
const saved=(await check.json())[0];
console.log(JSON.stringify({status:'saved-and-verified',revision:saved.revision,phasesWithMetadata:saved.data.plans.flatMap(p=>p.operations).filter(o=>o.metadata).length,weeksWithStaff:saved.data.plans.flatMap(p=>p.weeks).filter(w=>w.staffDetail).length}));
