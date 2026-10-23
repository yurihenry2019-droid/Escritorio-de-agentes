import { agents, publicEvent, todayStart, validateEvent, validateLease } from '../lib/office-policy.mjs';
const json = (data: unknown, status=200) => new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function digest(value:string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join(''); }
async function authorized(request:Request, secret?:string) {
  if (!secret || secret.length<40) return false;
  const a=await digest(request.headers.get('authorization')||''),b=await digest('Bearer '+secret);
  let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);
  return difference===0;
}
async function body(request:Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('Envie JSON.');
  if(Number(request.headers.get('content-length')||0)>2048)throw new Error('Registro muito grande.');
  const reader=request.body?.getReader();if(!reader)throw new Error('Registro vazio.');
  const chunks:Uint8Array[]=[];let size=0;
  while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>2048){await reader.cancel();throw new Error('Registro muito grande.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function officeFetch(request:Request,env:Cloudflare.Env):Promise<Response|null> {
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/api/office/'))return null;
  try {
    if(!env.DB)return json({error:'Histórico temporariamente indisponível.'},503);
    if(path==='/api/office/status' && request.method==='GET') {
      const [recent,latest,totals]=await env.DB.batch([
        env.DB.prepare('SELECT id,agent,code,state,count,created_at AS createdAt FROM office_events ORDER BY created_at DESC,id DESC LIMIT 30'),
        env.DB.prepare('SELECT id,agent,code,state,count,created_at AS createdAt FROM (SELECT *,ROW_NUMBER() OVER(PARTITION BY agent ORDER BY created_at DESC,id DESC) AS position FROM office_events) WHERE position=1'),
        env.DB.prepare("SELECT code,SUM(count) AS total FROM office_events WHERE state='succeeded' AND created_at>=? GROUP BY code").bind(todayStart()),
      ]);
      const now=Date.now(),rows=latest.results as any[];
      return json({serverTime:new Date(now).toISOString(),agents:agents.map((agent:string)=>({agent,last:rows.find(r=>r.agent===agent)?publicEvent(rows.find(r=>r.agent===agent),now):null})),events:(recent.results as any[]).map(row=>publicEvent(row,now)),today:Object.fromEntries((totals.results as any[]).map(row=>[row.code,row.total]))});
    }
    if(!['/api/office/events','/api/office/claim','/api/office/release'].includes(path))return json({error:'Operação desconhecida.'},404);
    if(request.method!=='POST')return json({error:'Método não permitido.'},405);
    // Consume the bounded body before returning an authorization response so a
    // persistent HTTP connection cannot carry an unread request into the next call.
    let input,invalid=false;try{input=await body(request);}catch{invalid=true;}
    if(!await authorized(request,env.OFFICE_RUNNER_TOKEN))return json({error:'Somente a rotina autorizada pode registrar atividades.'},401);
    const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Origem não permitida.'},403);
    if(invalid)return json({error:'Registro inválido ou muito grande.'},400);
    if(path==='/api/office/events') {
      let event;try{event=validateEvent(input);}catch(error){return json({error:(error as Error).message},400);}
      const hash=await digest(JSON.stringify(event));
      await env.DB.prepare('INSERT INTO office_events (id,run_id,agent,code,state,count,created_at,payload_hash) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(event.id,event.runId,event.agent,event.code,event.state,event.count,Date.now(),hash).run();
      const saved=await env.DB.prepare('SELECT payload_hash FROM office_events WHERE id=?').bind(event.id).first<{payload_hash:string}>();
      return saved?.payload_hash===hash?json({ok:true,id:event.id}):json({error:'O identificador já pertence a outro registro.'},409);
    }
    let lease;try{lease=validateLease(input);}catch{return json({error:'Reserva inválida.'},400);}
    if(path==='/api/office/release') {
      await env.DB.prepare('DELETE FROM office_leases WHERE task=? AND run_id=?').bind(lease.task,lease.runId).run();return json({ok:true});
    }
    const now=Date.now(),expires=now+25*60*1000;
    await env.DB.prepare('INSERT INTO office_leases (task,run_id,expires_at) VALUES (?,?,?) ON CONFLICT(task) DO UPDATE SET run_id=excluded.run_id,expires_at=excluded.expires_at WHERE office_leases.expires_at<=? OR office_leases.run_id=excluded.run_id').bind(lease.task,lease.runId,expires,now).run();
    const held=await env.DB.prepare('SELECT run_id,expires_at FROM office_leases WHERE task=?').bind(lease.task).first<{run_id:string,expires_at:number}>();
    return held?.run_id===lease.runId?json({ok:true,expiresAt:held.expires_at}):json({error:'Outra execução está cuidando desta rotina.'},409);
  } catch {return json({error:'Não foi possível acessar o histórico. Tente novamente mais tarde.'},503);}
}
