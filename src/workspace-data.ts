import type {Workspace,ProductionPlan} from './workspace-model';
import type {CostSheet} from './costing-engine';
import productionSource from './data/production-source.json';
import costSource from './data/yza089a.json';
import {hydrateProjectSheets} from './project-sheets';
const legacySeed:Workspace={projects:[{id:'p1',client:'KIKO',code:'YZA037',quantity:650000,status:'Planifié',due:''},{id:'p2',client:'À confirmer',code:'YZA067A',quantity:225000,status:'Planifié',due:''}],components:[{id:'c1',project:'YZA067A',name:'COVER',ref:'YZA067AA',quantity:225000,weight:11.08,cavities:8,runner:32.32,start:100,material:92,injection:3,screen:3,paint:6,assembly:3},{id:'c2',project:'YZA067A',name:'INSERT',ref:'YZA067FA',quantity:225000,weight:6.17,cavities:8,runner:0,start:100,material:92,injection:3,screen:0,paint:0,assembly:3},{id:'c3',project:'YZA067A',name:'BASE',ref:'YZA067BA',quantity:225000,weight:11.04,cavities:8,runner:0,start:100,material:92,injection:3,screen:0,paint:6,assembly:3}],machines:[{id:'m1',name:'Presse injection · Cover',department:'Injection',cycle:39,cavities:8,efficiency:85,hours:7.5,shifts:3,days:6}],method:'excel'};
export function prepareWorkspace(value:Workspace):Workspace {
 if(!Array.isArray(value.projects)||!Array.isArray(value.components)||!Array.isArray(value.machines))throw new Error('Format des données non reconnu.');
 const source=structuredClone(productionSource) as ProductionPlan;
 const machine=value.machines.find(m=>m.id==='m1');
 if(machine&&machine.cycle>0&&machine.cavities>0){const cover=source.operations[0];cover.secondsPerPiece=machine.cycle/machine.cavities;cover.efficiency=machine.efficiency/100;cover.hours=machine.hours;cover.shifts=machine.shifts;cover.days=machine.days;}
 return {...value,costings:value.costings??[costSource as CostSheet],plans:(value.plans??[source]).map(p=>hydrateProjectSheets(p,source)),materialStock:value.materialStock??{}};
}
export const initialWorkspace=prepareWorkspace(legacySeed);
