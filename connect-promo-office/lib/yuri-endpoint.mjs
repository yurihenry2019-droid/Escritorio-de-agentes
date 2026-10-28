import {planSupervision,supervisionKeys,tickKey,queueKey} from './yuri-supervision.mjs';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
export async function supervisionFetch(request,env,{authorized,now=()=>Date.now()}={}) {
  const url=new URL(request.url);
  if(url.pathname!=='/api/office/supervision/run')return null;
  if(request.method!=='POST')return json({error:'method_not_allowed'},405);
  if(!await authorized(request,env.YURI_SUPERVISION_TOKEN))return json({error:'unauthorized'},401);
  if(request.headers.has('origin')&&request.headers.get('origin')!==url.origin)return json({error:'origin_not_allowed'},403);
  if(env.YURI_SUPERVISION_ENABLED!=='true')return json({error:'disabled'},503);
  if(!env.DB)return json({error:'storage_unavailable'},503);
  const db=env.DB,runId=crypto.randomUUID();let claimed=false;
  try {
    const control=await db.prepare("SELECT value FROM office_documents WHERE key='system/control'").first();
    if(!control||JSON.parse(control.value).executors?.briefing!=='cloud')return json({error:'cloud_executor_required'},409);
    if(url.searchParams.get('probe')==='1')return json({ok:true,probe:true,scheduledExecution:false});
    const time=now();
    await db.prepare('INSERT INTO office_leases(task,run_id,expires_at) VALUES(?,?,?) ON CONFLICT(task) DO UPDATE SET run_id=excluded.run_id,expires_at=excluded.expires_at WHERE office_leases.expires_at<=?').bind('briefing',runId,time+25*60000,time).run();
    const lease=await db.prepare('SELECT run_id FROM office_leases WHERE task=?').bind('briefing').first();
    if(lease?.run_id!==runId)return json({ok:true,skipped:'briefing_busy',scheduledExecution:false});
    claimed=true;
    const [documents,leases]=await Promise.all([db.prepare('SELECT key,value,revision,updated_at AS updatedAt FROM office_documents WHERE key IN ('+supervisionKeys.map(()=>'?').join(',')+')').bind(...supervisionKeys).all(),db.prepare('SELECT task,expires_at FROM office_leases').all()]);
    const rows=documents.results,old=rows.find(r=>r.key===tickKey);
    if(old&&JSON.parse(old.value).slot>=Math.floor(time/600000))return json({ok:true,skipped:'already_checked',scheduledExecution:false});
    const plan=planSupervision(rows,leases.results,new Date(time));
    const operations=[[queueKey,plan.queue],[tickKey,plan.tick]].map(([key,value])=>{
      const revision=rows.find(r=>r.key===key)?.revision||0;
      return db.prepare('INSERT INTO office_documents(key,value,revision,updated_at,operation_id) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM office_leases WHERE task=? AND run_id=? AND expires_at>?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,revision=excluded.revision,updated_at=excluded.updated_at,operation_id=excluded.operation_id WHERE office_documents.revision=?').bind(key,JSON.stringify(value),revision+1,time,runId,'briefing',runId,now(),revision);
    });
    const results=await db.batch(operations);
    if(results.some(r=>r.meta.changes!==1))return json({error:'write_conflict'},409);
    await db.prepare('INSERT INTO office_events(id,run_id,agent,code,state,count,created_at,payload_hash) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(runId,runId,'gerencia','supervision_check','succeeded',1,time,'supervision-'+plan.tick.slot).run();
    return json({ok:true,scheduledExecution:true,checkedAt:plan.tick.checkedAt,pendingDemands:plan.tick.pendingDemands,newDemands:plan.tick.newDemands,mailsSent:0});
  }catch{return json({error:'supervision_failed'},503);}
  finally {if(claimed)await db.prepare('DELETE FROM office_leases WHERE task=? AND run_id=?').bind('briefing',runId).run();}
}
