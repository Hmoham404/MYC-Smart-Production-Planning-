import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('src/data/production-source.json','utf8'));
const endpoint=process.env.VITE_SUPABASE_URL?.replace(/\/$/,'')+'/rest/v1/myc_workspace';
const headers={apikey:process.env.VITE_SUPABASE_ANON_KEY,'Content-Type':'application/json',Prefer:'return=representation'};
const response=await fetch(endpoint+'?id=eq.main&select=data,revision',{headers,signal:AbortSignal.timeout(10000)});
if(!response.ok)throw new Error('Read failed: '+response.status);
const row=(await response.json())[0];if(!row)throw new Error('Workspace absent.');
if(row.data.plans!==undefined){console.log(JSON.stringify({status:'existing-plans-preserved',revision:row.revision}));process.exit(0);}
const machine=row.data.machines?.find(m=>m.id==='m1');
if(machine&&machine.cycle>0&&machine.cavities>0){Object.assign(source.operations[0],{secondsPerPiece:machine.cycle/machine.cavities,efficiency:machine.efficiency/100,hours:machine.hours,shifts:machine.shifts,days:machine.days});}
const data={...row.data,plans:[source],materialStock:row.data.materialStock||{}};
const saved=await fetch(endpoint+`?id=eq.main&revision=eq.${row.revision}`,{method:'PATCH',headers,body:JSON.stringify({data,revision:row.revision+1,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(10000)});
if(!saved.ok)throw new Error('Save failed: '+saved.status);
const rows=await saved.json();if(!rows[0])throw new Error('Concurrent change detected; no data overwritten.');
const check=await fetch(endpoint+'?id=eq.main&select=data,revision',{headers,signal:AbortSignal.timeout(10000)});
if(!check.ok)throw new Error('Readback failed.');
const verified=(await check.json())[0];
if(verified.data.plans?.[0]?.operations?.length!==9)throw new Error('Imported plan not found.');
console.log(JSON.stringify({status:'saved-and-verified',revision:verified.revision,operations:verified.data.plans[0].operations.length,weeks:verified.data.plans[0].weeks.length,costings:verified.data.costings?.length,components:verified.data.components.length}));
