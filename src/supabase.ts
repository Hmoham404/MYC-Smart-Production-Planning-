// Client REST PostgREST. La clé publiable ne donne jamais les droits administrateur.
const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const endpoint = `${url}/rest/v1/myc_workspace`;

type RecordRow<T> = {id: string; data: T; revision: number; updated_at: string};
function headers(extra: Record<string,string> = {}) {
  if (!url || !key) throw new Error('Configuration Supabase manquante : vérifiez le fichier .env.local.');
  return {apikey: key, 'Content-Type': 'application/json', ...extra};
}
async function request(input: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try { return await fetch(input, {...init, signal: controller.signal}); }
  catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error('Supabase ne r?pond pas. V?rifiez votre connexion Internet et que le projet Supabase est actif.');
    throw new Error('Connexion ? Supabase impossible. V?rifiez Internet, l?URL du projet et son ?tat.');
  } finally { clearTimeout(timer); }
}
async function response<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = '';
    try { const body = await res.json(); detail = body.message || body.details || ''; } catch { /* réseau ou réponse non JSON */ }
    throw new Error(`Supabase (${res.status}) : ${detail || 'accès ou configuration à vérifier'}`);
  }
  return await res.json() as T;
}
export async function readWorkspace<T>(): Promise<RecordRow<T> | null> {
  const rows = await response<RecordRow<T>[]>(await request(`${endpoint}?id=eq.main&select=id,data,revision,updated_at`, {headers:headers()}));
  return rows[0] || null;
}
export async function createWorkspace<T>(data:T):Promise<RecordRow<T>> {
  const rows = await response<RecordRow<T>[]>(await request(endpoint, {method:'POST', headers:headers({Prefer:'return=representation'}), body:JSON.stringify({id:'main',data,revision:1})}));
  if(!rows[0]) throw new Error('Création refusée : vérifiez la politique RLS Supabase.');
  return rows[0];
}
export async function updateWorkspace<T>(data:T, revision:number):Promise<RecordRow<T>> {
  const rows = await response<RecordRow<T>[]>(await request(`${endpoint}?id=eq.main&revision=eq.${revision}`, {method:'PATCH',headers:headers({Prefer:'return=representation'}),body:JSON.stringify({data,revision:revision+1,updated_at:new Date().toISOString()})}));
  if(!rows[0]) throw new Error('Conflit : les données ont été modifiées ailleurs ou l’accès est refusé. Rechargez la page après avoir sauvegardé votre travail en JSON.');
  return rows[0];
}
