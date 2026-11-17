import json
from pathlib import Path
import openpyxl

path=Path('YZA089A Product Costing Analysis Sheet v1.xlsx')
wb=openpyxl.load_workbook(path,data_only=True)
ws=wb[' CAP 1']
def v(cell,default=0):
    val=ws[cell].value
    return default if val is None else val
def line(id,section,name,kind,source,historical,**kwargs):
    result=dict(id=id,section=section,name=name,kind=kind,netWeight=0,runner=0,cavities=1,ratio=1,price=0,cycle=1,workers=0,labor=0,machine=0,consumableWeight=0,consumablePrice=0,quantity=1,perBox=1,reject=0,assemblyReject=0,source=source,historical=historical)
    result.update(kwargs)
    return result
lines=[]
for r,inj in [(4,11),(6,12)]:
    lines.append(line(f'mat-{r}','Matière',f'{v("C"+str(r))} · {v("D"+str(r))}','material',f'F{r}:Q{r}',v(f'Q{r}'),netWeight=v(f'F{r}'),runner=v(f'I{r}'),cavities=v(f'E{inj}'),ratio=v(f'J{r}'),price=v(f'L{r}'),reject=v(f'M{r}')*100,assemblyReject=v(f'P{r}')*100))
for r in [11,12]:
    lines.append(line(f'inj-{r}','Injection',str(v(f'C{r}'))+' · '+str(v(f'K{r}')),'process',f'D{r}:Q{r}',v(f'Q{r}'),cycle=v(f'D{r}'),cavities=v(f'E{r}'),workers=v(f'I{r}'),labor=v(f'J{r}'),machine=v(f'L{r}'),reject=v(f'M{r}')*100,assemblyReject=v(f'P{r}')*100))
lines.append(line('ss-21','Sérigraphie','cap · Black UV ink','process','E21:Q21',v('Q21'),cycle=v('E21'),workers=v('I21'),labor=v('J21'),machine=v('L21'),consumableWeight=v('M21'),consumablePrice=v('N21'),reject=v('P21')*100))
lines.append(line('pin-24','Composants','Pin · Plastic pin','purchase','M24:Q24',v('Q24'),quantity=v('M24'),price=v('N24'),reject=v('P24')*100))
for r in range(27,33):
    lines.append(line(f'ass-{r}','Assemblage',str(v(f'C{r}')),'process',f'E{r}:Q{r}',v(f'Q{r}'),cycle=v(f'E{r}'),workers=v(f'I{r}'),labor=v(f'J{r}'),machine=v(f'L{r}'),reject=v(f'P{r}')*100))
for r in range(35,40):
    lines.append(line(f'pack-{r}','Emballage',str(v(f'C{r}')),'packing',f'K{r}:N{r}; I35',v(f'N{r}')/v('I35'),quantity=v(f'K{r}'),price=v(f'L{r}'),perBox=v('I35')))
lines.append(line('transport','Transport','Transport par produit','transport','R42',v('R42'),price=v('R42')))
data=wb['Data']
catalogs={}
for name,cols in [('resins',[3,4]),('masterbatches',[6,7]),('machines',[9,10,11]),('packaging',[13,14]),('inks',[16,17]),('purchased',[19,20]),('assembly',[22,23,24])]:
    catalogs[name]=[{'source':f'Data!{openpyxl.utils.get_column_letter(cols[0])}{r}', 'values':[data.cell(r,c).value for c in cols]} for r in range(3,15) if str(data.cell(r,cols[0]).value or '').strip()]
sheet=dict(id='cost-yza089a',project='YZA089A',title=v('C2'),currency='USD',sourceFile=path.name,sheet=' CAP 1',historicalTotal=v('R43'),quantity=0,lines=lines,catalogs=catalogs,warnings=[
    'Aucune quantité commandée, date de livraison ou référence article détaillée n’est fournie. La quantité du chiffrage reste à renseigner.',
    'Méthode historique Excel : les majorations de rebut multiplient les coûts par (1 + taux). Il ne s’agit pas d’un calcul par rendement.',
    'Les recherches de résine et certaines recherches machine utilisent VLOOKUP sans correspondance exacte explicite. Les prix retrouvés et enregistrés ont été conservés pour rapprochement.',
    'Les tarifs horaires de Data sont utilisés par le chiffrage ; ils ne sont pas liés aux calculs d’amortissement de Data 2. Aucune mise à jour automatique entre ces feuilles n’est supposée.',
    'Les prix de Data sont libellés taxes comprises ; le chiffrage indique USD. Les conventions fiscales et la date de validité des prix sont à confirmer.',
    'Les lignes de masterbatch transparent à ratio nul n’ont aucun impact sur le total historique. Elles figurent dans le catalogue de référence.'
])
Path('src/data').mkdir(exist_ok=True)
Path('src/data/yza089a.json').write_text(json.dumps(sheet,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'lines':len(lines),'total':sheet['historicalTotal'],'catalogs':{k:len(v) for k,v in catalogs.items()}},ensure_ascii=False))
