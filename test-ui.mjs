import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {transform} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as XLSX from 'xlsx';
import {analyzeImport} from './src/workspace-import.ts';

await fs.mkdir('.qa',{recursive:true});
async function load(name){
  let source=await fs.readFile(`src/${name}.tsx`,'utf8');
  source=source.replace("from './costing-engine'","from '../src/costing-engine.ts'");
  source=source.replace("from './WorkspaceUI'","from './WorkspaceUI.mjs'");
  source=source.replace("from './number-display'","from '../src/number-display.ts'");
  source=source.replace("from './workspace-model'","from '../src/workspace-model.ts'");
  source=source.replace("from './project-sheets'","from '../src/project-sheets.ts'");
  source=source.replace("from './ProductionView'","from './ProductionView.mjs'");
  const result=await transform(source,{loader:'tsx',format:'esm',jsx:'automatic'});
  const target=path.resolve('.qa',name+'.mjs');await fs.writeFile(target,result.code);
  return (await import(pathToFileURL(target).href)).default;
}
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
await load('WorkspaceUI');
const StyleGuide=await load('StyleGuide');
const CostingView=await load('CostingView');
const ProductionView=await load('ProductionView');
const ProjectManagementView=await load('ProjectManagementView');
const MaterialsView=await load('MaterialsView');
const {WorkspaceNavigation}=await import(pathToFileURL(path.resolve('.qa/WorkspaceUI.mjs')).href);
const source=JSON.parse(await fs.readFile('src/data/yza089a.json','utf8'));
const plan=JSON.parse(await fs.readFile('src/data/production-source.json','utf8'));

test('guide renders its complete section navigation and downloadable token controls',()=>{
  const html=renderToStaticMarkup(React.createElement(StyleGuide));
  for(const section of ['brand','colors','typography','spacing','buttons','inputs','surfaces','feedback','grid','templates','tokens','integration'])assert.ok(html.includes('id="sg-'+section+'"'),section);
  assert.ok(html.includes('aria-label="Rechercher dans le guide"'));
  assert.ok(html.includes('data-dark="false"'));
  assert.ok(html.includes('JSON'));
});
test('saved dark mode has an accessible lighter accent',()=>{
  globalThis.localStorage.getItem=()=>'dark';
  const html=renderToStaticMarkup(React.createElement(StyleGuide));
  assert.ok(html.includes('data-dark="true"'));
  assert.ok(html.includes('--sg-accent:#93B9ED'));
  globalThis.localStorage.getItem=()=>null;
});
test('costing renders source total and missing order quantity without a fabricated amount',()=>{
  const html=renderToStaticMarkup(React.createElement(CostingView,{sheets:[source],onChange:()=>{}}));
  assert.ok(html.includes('0,225998'));
  assert.ok(html.includes('À renseigner'));
  assert.ok(html.includes('USD au total'));
  assert.ok(html.includes('CAP 1!'));
});
test('business navigation has exactly three workspaces and no scattered modules',()=>{
  const html=renderToStaticMarkup(React.createElement(WorkspaceNavigation,{value:'production',onChange:()=>{}}));
  assert.equal((html.match(/<button/g)||[]).length,3);
  assert.ok(html.includes('Project Management'));
  assert.ok(html.includes('aria-haspopup="menu"'));
  assert.ok(html.includes('aria-expanded="false"'));
  assert.ok(html.includes('Calcul des besoins nets'));
  assert.ok(html.includes('Chiffrage'));
  assert.ok(html.indexOf('Chiffrage')<html.indexOf('Calcul des besoins nets'));
  assert.ok(html.indexOf('Calcul des besoins nets')<html.indexOf('Project Management'));
  assert.ok(!html.includes('Guide de styles'));
});
test('production combines planning, capacities, staffing and source dates in one interface',()=>{
  const html=renderToStaticMarkup(React.createElement(ProductionView,{plans:[plan],onChange:()=>{}}));
  for(const text of ['Du besoin au planning','Capacité de l’opération','Personnel &amp; disponibilité','Calendrier des phases'])assert.ok(html.includes(text),text);
  assert.equal((html.match(/aria-label="Production réalisée W/g)||[]).length,15);
  assert.ok(!html.includes('84738.46153846152'));
});
test('materials interface keeps three components together and leaves unprovided stock blank',async()=>{
 const buffer=await fs.readFile('../YZA067A- Injection molding material requirements worksheet.xlsx');
 const parsed=analyzeImport(XLSX.read(buffer),'CBN.xlsx',{projects:[],components:[],machines:[],method:'excel'});
 const html=renderToStaticMarkup(React.createElement(MaterialsView,{components:parsed.next.components,method:'excel',onMethod:()=>{},onChange:()=>{},stock:{},onStock:()=>{}}));
 assert.equal((html.match(/aria-label="Quantité finale /g)||[]).length,3);
 for(const text of ['Historique Excel','Par rendement','À renseigner','COVER','INSERT','BASE'])assert.ok(html.includes(text),text);
});
test('Project Management page leaves sheet selection in the top navigation',()=>{
 const html=renderToStaticMarkup(React.createElement(ProjectManagementView,{plans:[plan],onChange:()=>{}}));
 assert.ok(!html.includes('aria-label="Feuille du classeur Project Management"'));
 assert.ok(html.includes('Nomenclature et phases'));
 assert.ok(html.includes('nomenclature-table'));
 assert.ok(!html.includes('planning-table'));
});
test('each Project Management sheet displays its own page',()=>{
 for(const [sheet,marker] of [['nomenclature','nomenclature-table'],['capacity','planning-table'],['summary','summary-matrix'],['gantt','project-gantt'],['workforce','workforce-matrix'],['holidays','holiday-sheet']]){
  const html=renderToStaticMarkup(React.createElement(ProjectManagementView,{plans:[plan],onChange:()=>{},initialSheet:sheet}));
  assert.ok(html.includes(marker),sheet);
  if(sheet!=='nomenclature')assert.ok(!html.includes('nomenclature-table'),sheet);
 }
});
