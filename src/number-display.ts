/** Formatting affects the input's resting view only; stored precision is preserved. */
export function displayNumber(value:number,precision=6){
 return new Intl.NumberFormat('fr-FR',{maximumFractionDigits:precision}).format(value);
}
export function parseNumberInput(value:string){
 const cleaned=value.replace(/[\s\u00a0\u202f]/g,'').replace(',','.');
 if(!cleaned)return null;
 const number=Number(cleaned);
 return Number.isFinite(number)?number:undefined;
}
