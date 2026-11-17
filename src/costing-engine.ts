export type CostLine = {
  id: string; section: string; name: string; kind: 'material'|'process'|'purchase'|'packing'|'transport';
  netWeight: number; runner: number; cavities: number; ratio: number; price: number;
  cycle: number; workers: number; labor: number; machine: number;
  consumableWeight: number; consumablePrice: number; quantity: number; perBox: number;
  reject: number; assemblyReject: number; source: string; historical: number;
};
export type CostSheet = {
  id: string; project: string; title: string; currency: string; sourceFile: string;
  sheet: string; historicalTotal: number; quantity: number; lines: CostLine[];
  warnings: string[]; catalogs?: Record<string, unknown[]>;
};
export function calculateCostLine(line: CostLine): number {
  const values = Object.entries(line).filter(([,v])=>typeof v==='number');
  if(values.some(([,v])=>!Number.isFinite(v as number)||(v as number)<0)) throw new Error('Les paramètres doivent être des nombres positifs ou nuls.');
  let base=0;
  if(line.kind==='material') {
    if(line.cavities<1) throw new Error('Le nombre d’empreintes doit être supérieur à zéro.');
    base=(line.netWeight+line.runner/line.cavities)/1000*line.price*line.ratio;
  } else if(line.kind==='process') {
    if(line.cycle<=0||line.cavities<1) throw new Error('Le cycle et les empreintes doivent être supérieurs à zéro.');
    base=(line.machine+line.workers*line.labor)/(3600/line.cycle*line.cavities)+line.consumableWeight*line.consumablePrice/1000;
  } else if(line.kind==='packing') {
    if(line.perBox<1) throw new Error('Le nombre de produits par carton doit être supérieur à zéro.');
    base=line.quantity*line.price/line.perBox;
  } else base=line.quantity*line.price;
  return base*(1+line.reject/100)*(1+line.assemblyReject/100);
}
export function calculateCostSheet(sheet:CostSheet) {
  const sections:Record<string,number>={};
  for(const line of sheet.lines) sections[line.section]=(sections[line.section]||0)+calculateCostLine(line);
  const total=Object.values(sections).reduce((a,b)=>a+b,0);
  return {sections,total,orderCost:sheet.quantity>0?sheet.quantity*total:null,difference:total-sheet.historicalTotal};
}
