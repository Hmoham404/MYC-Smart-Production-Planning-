import type {Operation,OperationMetadata,ProductionPlan,StaffDetail} from './workspace-model';
export const projectSheets=[
 {id:'nomenclature',name:'Nomenclature et phases',description:'Articles, procédés, équipements et capacités de fabrication.'},
 {id:'capacity',name:'Production Capacity',description:'Programme hebdomadaire détaillé, quantités et stocks par opération.'},
 {id:'summary',name:'Capacity Planning Summary',description:'Vue croisée des opérations et des semaines du planning.'},
 {id:'gantt',name:'Gantt Chart',description:'Calendrier des phases, dates et avancement du projet.'},
 {id:'workforce',name:'MOD&MOI',description:'Besoins et disponibilités du personnel direct et indirect.'},
 {id:'holidays',name:'JF',description:'Jours fériés de référence pour le calendrier de production.'},
] as const;
export type ProjectSheet=typeof projectSheets[number]['id'];
export const staffRoles=[{label:'MOD · Opérateurs',required:'direct',available:'availableDirect'},{label:'MOI · Qualité',required:'quality',available:'availableQuality'},{label:'MOI · Régleurs',required:'adjuster',available:'availableAdjuster'},{label:'MOI · Magasiniers',required:'handler',available:'availableHandler'}] as const;
export function metadataFor(op:Operation,plan:ProductionPlan):OperationMetadata{return op.metadata||{projectType:'',sourceProject:plan.project,tnProject:'',process:op.name,component:'',equipment:'',availability:'',delivery:'',operators:null,sharedWorkforce:false,target:null,scrapRate:null};}
export function totalStaff(detail:StaffDetail,available=false):number|null{
 const values=staffRoles.map(r=>detail[available?r.available:r.required]);
 return values.some(v=>v===null||v===undefined)?null:values.reduce((s,v)=>s+(v??0),0);
}
export function emptyStaff():StaffDetail{return {direct:null,quality:null,adjuster:null,handler:null,availableDirect:null,availableQuality:null,availableAdjuster:null,availableHandler:null};}
export function hydrateProjectSheets(plan:ProductionPlan,source:ProductionPlan):ProductionPlan{
 if(plan.project!==source.project&&plan.sourceFile!==source.sourceFile)return plan;
 return {...plan,operations:plan.operations.map(op=>({...op,metadata:op.metadata??source.operations.find(o=>o.id===op.id)?.metadata})),weeks:plan.weeks.map(w=>({...w,staffDetail:w.staffDetail??source.weeks.find(x=>x.id===w.id)?.staffDetail}))};
}
export function timelinePosition(start:string,end:string,periodStart:string,periodEnd:string){
 const from=Date.parse(periodStart+'T00:00:00Z'),to=Date.parse(periodEnd+'T00:00:00Z')+86400000,a=Date.parse(start+'T00:00:00Z'),b=Date.parse(end+'T00:00:00Z')+86400000;
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a||to<=from||b<=from||a>=to)return null;
 return {left:Math.max(0,(a-from)/(to-from))*100,width:(Math.min(b,to)-Math.max(a,from))/(to-from)*100};
}
