import type {CostSheet} from './costing-engine';
export type Project={id:string;client:string;code:string;quantity:number;status:string;due:string};
export type Component={id:string;project:string;name:string;ref:string;quantity:number;weight:number;cavities:number;runner:number;start:number;material:number;injection:number;screen:number;paint:number;assembly:number;mainMaterial?:string;masterbatch?:string};
export type Machine={id:string;name:string;department:string;cycle:number;cavities:number;efficiency:number;hours:number;shifts:number;days:number};
export type StaffDetail={direct:number|null;quality:number|null;adjuster:number|null;handler:number|null;availableDirect:number|null;availableQuality:number|null;availableAdjuster:number|null;availableHandler:number|null};
export type PlanWeek={id:string;label:string;start:string;demand:number;staffRequired:number|null;staffAvailable:number|null;staffDetail?:StaffDetail};
export type OperationMetadata={projectType:string;sourceProject:string;tnProject:string;process:string;component:string;equipment:string;availability:string;delivery:string;operators:number|null;sharedWorkforce:boolean;target:number|null;scrapRate:number|null};
export type Operation={id:string;name:string;reference:string;secondsPerPiece:number;hours:number;shifts:number;days:number;machines:number;efficiency:number;initialStock:number;planned:number[];actual:(number|null)[];unavailableHours:number[];originalCapacity:number;originalStock:(number|null)[];source:string;manualDemand:number[]|null;metadata?:OperationMetadata};
export type ProductionPlan={id:string;project:string;client:string;title:string;sourceFile:string;weeks:PlanWeek[];operations:Operation[];milestones:{id:string;name:string;start:string;end:string;progress:number}[];holidays:{date:string;name:string}[];warnings:string[]};
export type Workspace={projects:Project[];components:Component[];machines:Machine[];method:'excel'|'yield';costings?:CostSheet[];plans?:ProductionPlan[];materialStock?:Record<string,number|null>};
export function materialResult(c:Component,method:Workspace['method']){
  const required=[c.quantity,c.weight,c.cavities,c.runner,c.start,c.material,c.injection,c.screen,c.paint,c.assembly];
  if(required.some(n=>!Number.isFinite(n)||n<0)||c.cavities<1||c.material>100||[c.injection,c.screen,c.paint,c.assembly].some(n=>n>=100))throw new Error('Paramètres matière invalides : vérifiez les quantités, les empreintes et les pourcentages.');
  if(!['excel','yield'].includes(method))throw new Error('Méthode de calcul matière inconnue.');
  let quantity=c.quantity;
  const rates=[c.injection,c.screen,c.paint,c.assembly];
  for(const rate of method==='yield'?[...rates].reverse():rates)quantity=method==='excel'?quantity*(1+rate/100):Math.ceil(quantity/(1-rate/100));
  const cycles=Math.ceil(quantity/c.cavities)+c.start;
  const kg=cycles*(c.weight*c.cavities+c.runner)/1000;
  return {quantity,cycles,kg,main:kg*c.material/100,mb:kg*(1-c.material/100)};
}
export function operationCapacity(op:Operation,unavailable=0){
  if([op.secondsPerPiece,op.efficiency,op.machines,op.hours,op.shifts,op.days,unavailable].some(n=>!Number.isFinite(n)||n<0)||op.secondsPerPiece<=0||op.efficiency>1||op.days>7)throw new Error('Paramètres de capacité invalides.');
  return 3600/op.secondsPerPiece*op.efficiency*op.machines*Math.max(0,op.hours*op.shifts*op.days-unavailable);
}
export function operationWeeks(plan:ProductionPlan,op:Operation){
  let stock=op.initialStock;
  return plan.weeks.map((week,i)=>{const demand=op.manualDemand?.[i]??week.demand;stock+=(op.planned[i]||0)-demand;return {...week,demand,stock,planned:op.planned[i]||0,actual:op.actual[i]??null,capacity:operationCapacity(op,op.unavailableHours[i]||0)};});
}
