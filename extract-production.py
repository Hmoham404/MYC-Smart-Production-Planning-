import json,datetime
from pathlib import Path
import openpyxl
w=openpyxl.load_workbook('../Project management MAJ KIKO 28-04-2026_650K Pieces.xlsx',data_only=True)
p=w['Production Capacity '];n=w['Nomenclature et phases '];staff=w['MOD&MOI '];g=w['Gantt Chart  ']
ops=[]
for row,phase,name in [(6,7,'Injection · Cover'),(10,9,'Injection · Insert'),(14,10,'Injection · Base'),(29,11,'Soudure ultrasons'),(59,8,'Métallisation · Cover'),(63,12,'Métallisation · Insert & Base'),(83,13,'Sérigraphie'),(97,14,'Assemblage automatique'),(114,15,'Assemblage manuel')]:
    ops.append(dict(id=f'op-{row}',name=name,reference=str(n.cell(phase,5).value).strip(),secondsPerPiece=n.cell(phase,12).value,hours=n.cell(phase,13).value,shifts=n.cell(phase,14).value,days=n.cell(phase,15).value,machines=n.cell(phase,9).value,efficiency=n.cell(phase,16).value,initialStock=0,planned=[p.cell(row,c).value if isinstance(p.cell(row,c).value,(int,float)) else 0 for c in range(11,26)],actual=[None]*15,unavailableHours=[0]*15,originalCapacity=n.cell(phase,22).value,originalStock=[p.cell(row+1,c).value for c in range(11,26)],source=f'Production Capacity !K{row}:Y{row}',manualDemand=[p.cell(112,c).value or 0 for c in range(11,26)] if row==114 else None))
for op in ops:
    mapping={6:7,10:9,14:10,29:11,59:8,63:12,83:13,97:14,114:15}
    r=mapping[int(op['id'].split('-')[1])]
    def nv(col): return n.cell(r,col).value
    op['metadata']=dict(projectType=str(nv(2) or '').strip(),sourceProject=str(nv(3) or '').strip(),tnProject=str(nv(4) or '').strip(),process=str(nv(6) or '').strip(),component=str(nv(7) or '').strip(),equipment=str(nv(8) or '').strip(),availability=str(nv(10) or '').strip(),delivery=str(nv(11) or '').strip(),operators=nv(18),sharedWorkforce=nv(19)==0 and bool(nv(18)),target=nv(23),scrapRate=nv(17))
weeks=[]
for i in range(15):
    day=datetime.date.fromisocalendar(2026,19+i,1)
    weeks.append(dict(id=f'2026-W{19+i}',label=f'W{19+i}',start=day.isoformat(),demand=p.cell(4,11+i).value,staffRequired=staff.cell(43,5+i).value,staffAvailable=staff.cell(48,5+i).value))
for i,week in enumerate(weeks):
    week['staffDetail']={key:staff.cell(row,5+i).value for key,row in [('direct',39),('quality',40),('adjuster',41),('handler',42),('availableDirect',44),('availableQuality',45),('availableAdjuster',46),('availableHandler',47)]}
dates=[]
for r in [8,9,10,12,14,15,17,19]:
    dates.append(dict(id=f'date-{r}',name=str(g.cell(r,1).value).strip(),start=g.cell(r,4).value.date().isoformat(),end=g.cell(r,5).value.date().isoformat(),progress=g.cell(r,3).value or 0))
holidays=[{'date':row[0].date().isoformat(),'name':row[1]} for row in w['JF'].iter_rows(min_row=3,values_only=True) if isinstance(row[0],datetime.datetime)]
data=dict(id='plan-yza037',project='YZA037',client='KIKO',title='Plan industriel KIKO',sourceFile='Project management MAJ KIKO 28-04-2026_650K Pieces.xlsx',weeks=weeks,operations=ops,milestones=dates,holidays=holidays,warnings=['La métallisation applique deux fois le rendement dans le fichier Excel (T8 puis U8 ; T12 puis U12). La capacité présentée ici applique ce rendement une seule fois.','Les stocks sont calculés séparément par opération face à la demande. Ils ne constituent pas une simulation des flux entre opérations.','La ligne d’assemblage manuel utilise une demande distincte et porte YZA038 dans la nomenclature. Elle reste identifiée séparément.','Le calendrier historique et les besoins de personnel proviennent de feuilles distinctes. Ils ne se mettent pas automatiquement à jour à partir de la charge.','La capacité reste indicative hors calendrier détaillé des équipes et ressources partagées. Les heures indisponibles sont déduites lorsqu’elles sont renseignées.'])
Path('src/data/production-source.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('Extracted',len(ops),'operations,',len(weeks),'weeks')
