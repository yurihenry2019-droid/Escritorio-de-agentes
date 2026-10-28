import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {planSupervision,publicSupervision,tickKey,queueKey} from '../lib/yuri-supervision.mjs';
import {supervisionFetch} from '../lib/yuri-endpoint.mjs';
const fixed=Date.parse('2026-10-28T21:20:00Z');
function database(){
  const sql=new DatabaseSync(':memory:');
  sql.exec('CREATE TABLE office_documents(key TEXT PRIMARY KEY,value TEXT,revision INTEGER,updated_at INTEGER,operation_id TEXT); CREATE TABLE office_leases(task TEXT PRIMARY KEY,run_id TEXT,expires_at INTEGER); CREATE TABLE office_events(id TEXT PRIMARY KEY,run_id TEXT,agent TEXT,code TEXT,state TEXT,count INTEGER,created_at INTEGER,payload_hash TEXT)');
  sql.prepare('INSERT INTO office_documents VALUES(?,?,?,?,?)').run('system/control',JSON.stringify({executors:{briefing:'cloud',mail:'cloud'}}),1,fixed,'setup');
  const adapter={prepare(query){const statement=sql.prepare(query);let args=[];return {bind(...values){args=values;return this;},async first(){return statement.get(...args)||null;},async all(){return {results:statement.all(...args)};},async run(){return {meta:{changes:Number(statement.run(...args).changes)}};}};},async batch(statements){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};
  return {sql,adapter};
}
const request=(suffix='',token='valid')=>new Request('https://office.test/api/office/supervision/run'+suffix,{method:'POST',headers:{Authorization:token}});
const auth=async(req,token)=>token==='scoped'&&req.headers.get('authorization')==='valid';
test('scope, disabled state and probe fail closed without writing business evidence',async()=>{
  const {sql,adapter}=database(),env={DB:adapter,YURI_SUPERVISION_TOKEN:'scoped',YURI_SUPERVISION_ENABLED:'true'},options={authorized:auth,now:()=>fixed};
  assert.equal((await supervisionFetch(request('','wrong'),env,options)).status,401);
  assert.equal((await supervisionFetch(request(),{...env,YURI_SUPERVISION_ENABLED:'false'},options)).status,503);
  assert.deepEqual(await (await supervisionFetch(request('?probe=1'),env,options)).json(),{ok:true,probe:true,scheduledExecution:false});
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM office_events').get().n,0);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM office_leases').get().n,0);sql.close();
});
test('exclusive lease, idempotency and release protect daily briefing and repeated cron calls',async()=>{
  const {sql,adapter}=database(),env={DB:adapter,YURI_SUPERVISION_TOKEN:'scoped',YURI_SUPERVISION_ENABLED:'true'};let time=fixed;
  const options={authorized:auth,now:()=>time};
  sql.prepare('INSERT INTO office_leases VALUES(?,?,?)').run('briefing','someone-else',fixed+60000);
  assert.equal((await (await supervisionFetch(request(),env,options)).json()).skipped,'briefing_busy');
  assert.equal(sql.prepare('SELECT run_id FROM office_leases').get().run_id,'someone-else');
  time+=120000;
  assert.equal((await (await supervisionFetch(request(),env,options)).json()).scheduledExecution,true);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM office_leases').get().n,0);
  assert.equal((await (await supervisionFetch(request(),env,options)).json()).skipped,'already_checked');
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM office_events').get().n,1);
  assert.equal(sql.prepare('SELECT revision FROM office_documents WHERE key=?').get(tickKey).revision,1);
  time+=600000;
  const next=await (await supervisionFetch(request(),env,options)).json();assert.equal(next.newDemands,0);
  assert.equal(sql.prepare('SELECT COUNT(*) n FROM office_events').get().n,2);
  sql.close();
});
test('missing reports stay unknown, stale evidence is challenged and public projection omits private fields',()=>{
  const first=planSupervision([],[],new Date(fixed));
  assert.equal(first.tick.presentations,null);assert.equal(first.tick.remainingToGoal,null);
  assert.ok(first.queue.actions.some(a=>a.id==='mail-count'));
  const second=planSupervision([{key:queueKey,value:first.queue}],[],new Date(fixed+600000));assert.equal(second.queue.newDemands,0);
  const pub=publicSupervision({value:{...first.tick,client:'PRIVATE',financialValue:123}},true,fixed+60000);
  assert.equal(pub.recentExecution,true);assert.ok(!JSON.stringify(pub).includes('PRIVATE'));
  assert.equal(publicSupervision({value:first.tick},true,fixed+21*60000).recentExecution,false);
  assert.equal(publicSupervision({value:first.tick},false,fixed+60000).recentExecution,false);
});
test('daily counts require coherent, paginated evidence; next day never inherits yesterday’s count',()=>{
  const mail={key:'mail/cloud-last-run.json',value:{checkedAt:new Date(fixed).toISOString(),quota:{date:'2026-10-28',checkedAt:new Date(fixed).toISOString(),allPagesCovered:true,todayOutgoingTotal:6,confirmedDailyPresentations:5,otherOutgoingToday:1}}};
  const plan=planSupervision([mail],[],new Date(fixed));assert.equal(plan.tick.remainingToGoal,95);
  assert.ok(plan.queue.actions.some(a=>a.id==='prospecting-goal'));
  assert.equal(planSupervision([mail],[],new Date(fixed+86400000)).tick.presentations,null);
  mail.value.quota.otherOutgoingToday=2;assert.equal(planSupervision([mail],[],new Date(fixed)).tick.presentations,null);
});
