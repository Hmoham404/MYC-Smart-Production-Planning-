import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as XLSX from 'xlsx';
import {projectSheets,hydrateProjectSheets,totalStaff,timelinePosition} from './src/project-sheets.ts';
import {analyzeImport} from './src/workspace-import.ts';
const source=JSON.parse(fs.readFileSync('src/data/production-source.json','utf8'));
test('project workbook has exactly six dedicated page definitions',()=>{
 assert.deepEqual(projectSheets.map(s=>s.name),['Nomenclature et phases','Production Capacity','Capacity Planning Summary','Gantt Chart','MOD&MOI','JF']);
});
test('sheet enrichment keeps edited production, staffing and metadata',()=>{
 const previous=structuredClone(source);
 previous.operations[0].planned[0]=12345;
 previous.operations[0].metadata.equipment='Équipement utilisateur';
 delete previous.operations[1].metadata;
 previous.weeks[0].staffDetail.direct=99;
 delete previous.weeks[1].staffDetail;
 const hydrated=hydrateProjectSheets(previous,source);
 assert.equal(hydrated.operations[0].planned[0],12345);
 assert.equal(hydrated.operations[0].metadata.equipment,'Équipement utilisateur');
 assert.ok(hydrated.operations[1].metadata);
 assert.equal(hydrated.weeks[0].staffDetail.direct,99);
 assert.ok(hydrated.weeks[1].staffDetail);
 assert.deepEqual(hydrateProjectSheets(hydrated,source),hydrated);
});
test('workforce totals do not turn missing categories into zeros',()=>{
 const detail=source.weeks[2].staffDetail;
 assert.equal(totalStaff(detail),88);
 assert.equal(totalStaff(detail,true),26);
 assert.equal(totalStaff({...detail,quality:null}),null);
});
test('Gantt bars include the final day, clip at the horizon and reject reversed dates',()=>{
 assert.deepEqual(timelinePosition('2026-05-04','2026-05-10','2026-05-04','2026-05-10'),{left:0,width:100});
 assert.deepEqual(timelinePosition('2026-05-01','2026-05-10','2026-05-04','2026-05-10'),{left:0,width:100});
 assert.equal(timelinePosition('2026-05-10','2026-05-04','2026-05-04','2026-05-10'),null);
 assert.equal(timelinePosition('2026-06-01','2026-06-05','2026-05-04','2026-05-10'),null);
});
test('Excel reimport retains nomenclature fields and workforce breakdown',()=>{
 const wb=XLSX.read(fs.readFileSync('../Project management MAJ KIKO 28-04-2026_650K Pieces.xlsx'),{cellDates:true});
 const result=analyzeImport(wb,'Planning.xlsx',{projects:[],components:[],machines:[],method:'excel'}).next.plans[0];
 assert.equal(result.operations[0].metadata.target,90000);
 assert.equal(result.operations[0].metadata.process,'Injection');
 assert.equal(result.operations.find(o=>o.id==='op-114').metadata.sourceProject,'YZA038');
 assert.equal(totalStaff(result.weeks[2].staffDetail),88);
});
