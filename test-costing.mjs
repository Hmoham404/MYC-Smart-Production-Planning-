import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateCostLine,calculateCostSheet} from './src/costing-engine.ts';
import * as XLSX from 'xlsx';
import {parseCostingWorkbook} from './src/import-costing.ts';
const sheet=JSON.parse(fs.readFileSync(new URL('./src/data/yza089a.json',import.meta.url),'utf8'));
test('all 18 source lines reconcile to cached Excel values',()=>{
  for(const line of sheet.lines)assert.ok(Math.abs(calculateCostLine(line)-line.historical)<1e-12,line.id);
  assert.ok(Math.abs(calculateCostSheet(sheet).total-0.22599846666666668)<1e-12);
});
test('quantity is not invented; order total changes without changing unit cost',()=>{
  assert.equal(calculateCostSheet(sheet).orderCost,null);
  const changed=calculateCostSheet({...sheet,quantity:10000});
  assert.ok(Math.abs(changed.orderCost-2259.984666666667)<1e-9);
});
test('runner is distributed per cavity and grams convert to kilograms once',()=>{
  const line={...sheet.lines[0],price:1,ratio:1,reject:0,assemblyReject:0};
  assert.equal(calculateCostLine(line),0.007);
});
test('process cost responds to cycle change and staffing',()=>{
  const base=sheet.lines.find(x=>x.id==='inj-11');
  assert.ok(Math.abs(calculateCostLine({...base,cycle:base.cycle*2})-calculateCostLine(base)*2)<1e-12);
  assert.ok(calculateCostLine({...base,workers:3})>calculateCostLine(base));
});
test('invalid denominators and nonfinite inputs are rejected',()=>{
  assert.throws(()=>calculateCostLine({...sheet.lines[0],cavities:0}));
  assert.throws(()=>calculateCostLine({...sheet.lines[0],price:NaN}));
  assert.throws(()=>calculateCostLine({...sheet.lines.find(l=>l.kind==='process'),cycle:0}));
});
test('new workbook is recognized, checked and imported without inventing a quantity',()=>{
  const workbook=XLSX.read(fs.readFileSync(new URL('./YZA089A Product Costing Analysis Sheet v1.xlsx',import.meta.url)));
  const imported=parseCostingWorkbook(workbook,'YZA089A Product Costing Analysis Sheet v1.xlsx');
  assert.equal(imported.project,'YZA089A');
  assert.equal(imported.quantity,0);
  assert.equal(imported.lines.length,18);
  assert.ok(Math.abs(calculateCostSheet(imported).difference)<1e-12);
  workbook.Sheets[' CAP 1'].R43.v=0.5;
  assert.throws(()=>parseCostingWorkbook(workbook,'changed.xlsx'),/diffère/);
});
test('Excel errors in numeric inputs are rejected before data integration',()=>{
  const workbook=XLSX.read(fs.readFileSync(new URL('./YZA089A Product Costing Analysis Sheet v1.xlsx',import.meta.url)));
  workbook.Sheets[' CAP 1'].F4={t:'e',v:7};
  assert.throws(()=>parseCostingWorkbook(workbook,'invalid.xlsx'),/F4/);
});
