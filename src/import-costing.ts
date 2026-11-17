import type {WorkBook} from 'xlsx';
import {calculateCostSheet,type CostLine,type CostSheet} from './costing-engine.ts';

export function parseCostingWorkbook(wb:WorkBook,fileName:string):CostSheet {
  const sheetName=wb.SheetNames.find(n=>n.trim()==='CAP 1');
  if(!sheetName||!wb.Sheets.Data)throw new Error('Le format de chiffrage attendu contient CAP 1 et Data.');
  const sheet=wb.Sheets[sheetName];
  const text=(address:string)=>String(sheet[address]?.v||'').trim();
  const n=(address:string,optional=false)=>{const c=sheet[address];if(!c&&optional)return 0;if(c?.t==='e'||typeof c?.v!=='number'||!Number.isFinite(c.v)||c.v<0)throw new Error(`Valeur numérique absente ou invalide en ${sheetName}!${address}. Corrigez le fichier avant import.`);return c.v as number};
  const title=text('C2'),project=title.match(/YZA[0-9]+[A-Z]*/i)?.[0].toUpperCase();
  if(!project)throw new Error('Code projet YZA introuvable en C2.');
  if(!text('A1').toLowerCase().includes('costing'))throw new Error('Le titre de la feuille ne correspond pas au modèle de chiffrage.');
  const make=(id:string,section:string,name:string,kind:CostLine['kind'],source:string,historical:number,fields:Partial<CostLine>):CostLine=>({id,section,name,kind,source,historical,netWeight:0,runner:0,cavities:1,ratio:1,price:0,cycle:1,workers:0,labor:0,machine:0,consumableWeight:0,consumablePrice:0,quantity:1,perBox:1,reject:0,assemblyReject:0,...fields});
  const lines:CostLine[]=[];
  for(const [r,inj] of [[4,11],[6,12]])lines.push(make('mat-'+r,'Matière',text('C'+r)+' · '+text('D'+r),'material',`F${r}:Q${r}`,n('Q'+r),{netWeight:n('F'+r),runner:n('I'+r),cavities:n('E'+inj),ratio:n('J'+r),price:n('L'+r),reject:n('M'+r)*100,assemblyReject:n('P'+r,true)*100}));
  for(const r of [11,12])lines.push(make('inj-'+r,'Injection',text('C'+r)+' · '+text('K'+r),'process',`D${r}:Q${r}`,n('Q'+r),{cycle:n('D'+r),cavities:n('E'+r),workers:n('I'+r),labor:n('J'+r),machine:n('L'+r),reject:n('M'+r)*100,assemblyReject:n('P'+r)*100}));
  lines.push(make('ss-21','Sérigraphie',text('C21')+' · '+text('D21'),'process','E21:Q21',n('Q21'),{cycle:n('E21'),workers:n('I21'),labor:n('J21'),machine:n('L21'),consumableWeight:n('M21'),consumablePrice:n('N21'),reject:n('P21')*100}));
  lines.push(make('pin-24','Composants',text('C24')+' · '+text('F24'),'purchase','M24:Q24',n('Q24'),{quantity:n('M24'),price:n('N24'),reject:n('P24')*100}));
  for(let r=27;r<=32;r++)lines.push(make('ass-'+r,'Assemblage',text('C'+r),'process',`E${r}:Q${r}`,n('Q'+r),{cycle:n('E'+r),workers:n('I'+r),labor:n('J'+r),machine:n('L'+r),reject:n('P'+r)*100}));
  for(let r=35;r<=39;r++)lines.push(make('pack-'+r,'Emballage',text('C'+r),'packing',`K${r}:N${r}; I35`,n('N'+r)/n('I35'),{quantity:n('K'+r),price:n('L'+r),perBox:n('I35')}));
  lines.push(make('transport','Transport','Transport par produit','transport','R42',n('R42'),{price:n('R42')}));
  const warnings=['Import du modèle CAP 1 : contrôler les paramètres avant validation. Les formules Excel ne sont pas exécutées.','Aucune quantité commandée ou date de livraison n’est déduite de ce fichier.','Méthode historique : majoration des coûts par (1 + taux de rebut).','Data 2 est une feuille de support : ses coûts ne remplacent pas automatiquement les tarifs horaires de Data.'];
  let formulas=0,errors=0;for(const sh of Object.values(wb.Sheets))for(const [key,c] of Object.entries(sh)){if(key.startsWith('!'))continue;if(c?.f)formulas++;if(c?.t==='e')errors++;}
  warnings.push(`${formulas} formules reconnues ; ${errors} erreurs Excel détectées dans le classeur.`);
  const result:CostSheet={id:'cost-'+project.toLowerCase(),project,title,currency:'USD',sourceFile:fileName,sheet:sheetName,historicalTotal:n('R43'),quantity:0,lines,warnings};
  const diff=calculateCostSheet(result).difference;
  if(Math.abs(diff)>1e-8)throw new Error(`Le recalcul diffère du total Excel de ${diff.toFixed(6)} USD. Ce fichier doit être contrôlé avant import.`);
  const catalogs:Record<string,unknown[]>={};const data=wb.Sheets.Data;
  for(const [name,cols] of Object.entries({resins:['C','D'],masterbatches:['F','G'],machines:['I','J','K'],packaging:['M','N'],inks:['P','Q'],purchased:['S','T'],assembly:['V','W','X']}))catalogs[name]=Array.from({length:12},(_,i)=>i+3).filter(r=>String(data[cols[0]+r]?.v||'').trim()).map(r=>({source:'Data!'+cols[0]+r,values:cols.map(col=>data[col+r]?.v??null)}));
  result.catalogs=catalogs;
  return result;
}
