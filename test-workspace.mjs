import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {materialResult,operationCapacity,operationWeeks} from './src/workspace-model.ts';
import {analyzeImport} from './src/workspace-import.ts';
import {displayNumber,parseNumberInput} from './src/number-display.ts';
const plan=JSON.parse(fs.readFileSync('src/data/production-source.json','utf8'));
const blank={projects:[],components:[],machines:[],costings:[],plans:[],method:'excel'};
test('three source workbooks are routed to their own interface',()=>{
 const files=[['../Project management MAJ KIKO 28-04-2026_650K Pieces.xlsx','production'],['../YZA067A- Injection molding material requirements worksheet.xlsx','materials'],['YZA089A Product Costing Analysis Sheet v1.xlsx','costing']];
 for(const [file,area] of files){const workbook=XLSX.read(fs.readFileSync(file),{cellDates:true});const result=analyzeImport(workbook,file,blank);assert.equal(result.area,area);if(area==='production'){assert.equal(result.next.plans[0].operations.length,9);assert.equal(result.next.plans[0].weeks.reduce((s,w)=>s+w.demand,0),650000);}if(area==='materials')assert.equal(result.next.components.length,3);}
});
test('weekly stock carries forward once without duplicating preceding production',()=>{
 const rows=operationWeeks(plan,plan.operations[0]);
 assert.equal(rows[1].stock,25000);
 assert.ok(Math.abs(rows[2].stock-109738.46153846152)<1e-7);
 const total=plan.operations[0].planned.reduce((a,b)=>a+b,0)-650000;
 assert.ok(Math.abs(rows.at(-1).stock-total)<1e-7);
});
test('metallization efficiency is applied once and difference to Excel remains visible',()=>{
 const op=plan.operations.find(o=>o.id==='op-59');
 assert.ok(Math.abs(operationCapacity(op)*op.efficiency-op.originalCapacity)<1e-7);
 assert.ok(operationCapacity(op)>op.originalCapacity);
});
test('unavailable machine hours reduce capacity without creating negative output',()=>{
 const op=plan.operations[0];
 assert.ok(operationCapacity(op,10)<operationCapacity(op));
 assert.equal(operationCapacity(op,1000),0);
});
test('material interface reconciles historical CBN consumption',()=>{
 const workbook=XLSX.read(fs.readFileSync('../YZA067A- Injection molding material requirements worksheet.xlsx'));
 const parsed=analyzeImport(workbook,'CBN.xlsx',blank).next;
 const c=parsed.components[0];
 assert.ok(Math.abs(materialResult(c,'excel').kg-3952.60992)<1e-8);
 assert.ok(materialResult(c,'yield').quantity>materialResult(c,'excel').quantity);
 assert.throws(()=>materialResult({...c,cavities:0},'excel'));
});
test('readable French number display preserves precision and accepts decimal commas',()=>{
 const value=75806.52418447693;
 assert.equal(displayNumber(value,0).replace(/[\s\u202f]/g,''),'75807');
 assert.equal(value,75806.52418447693);
 assert.equal(parseNumberInput('75\u202f806,52'),75806.52);
 assert.equal(parseNumberInput('650 000'),650000);
 assert.equal(parseNumberInput(''),null);
 assert.equal(parseNumberInput('abc'),undefined);
});
