import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
const origin=process.argv[2];
if(!origin||new URL(origin).hostname!=='127.0.0.1')throw Error('Somente banco local de teste.');
const token='local-preview-test-token-for-office-only-2026',runId=randomUUID();
async function call(name,args={},auth=true){const r=await fetch(origin+'/api/office/private',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({name,arguments:args})});return {status:r.status,data:await r.json()};}
assert.equal((await call('office_read',{area:'finance'},false)).status,403);
assert.equal((await call('office_overview',{},false)).status,403);
const overview=await call('office_overview');assert.equal(overview.status,200);assert.equal(overview.data.privateOnly,true);
assert.equal(overview.data.mail.today.presentations,null);
const anonymousMcp=await fetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})});assert.equal(anonymousMcp.status,403);
const key='finance/test-'+randomUUID()+'.json',op=randomUUID();
assert.equal((await call('office_write',{key,value:{privateAmount:123},runId,operationId:op,expectedRevision:0})).status,409);
assert.equal((await call('office_lease',{action:'claim',task:'finance',runId})).status,200);
try{
  const args={key,value:{privateAmount:123},runId,operationId:op,expectedRevision:0};
  assert.equal((await call('office_write',args)).data.revision,1);
  assert.equal((await call('office_write',args)).data.idempotent,true);
  assert.equal((await call('office_write',{...args,value:{privateAmount:124}})).status,409);
  assert.equal((await call('office_write',{...args,operationId:randomUUID(),expectedRevision:0})).status,409);
  const read=await call('office_read',{key});assert.equal(read.data.value.privateAmount,123);
  assert.equal((await call('office_write',{...args,operationId:randomUUID(),expectedRevision:1,value:{privateAmount:125}})).data.revision,2);
  const publicStatus=await(await fetch(origin+'/api/office/status')).text();assert.ok(!publicStatus.includes('privateAmount'));assert.ok(!publicStatus.includes(key));
  const privateOverview=await call('office_overview');assert.ok(!JSON.stringify(privateOverview.data).includes('privateAmount'));assert.ok(!JSON.stringify(privateOverview.data).includes(key));
}finally{await call('office_lease',{action:'release',task:'finance',runId});}
assert.equal((await call('office_write',{key,value:{},runId,operationId:randomUUID(),expectedRevision:2})).status,409);
const maintenanceId=randomUUID();
assert.equal((await call('office_lease',{action:'claim',task:'maintenance',runId:maintenanceId})).status,200);
async function mcp(name,args,owner=true){const r=await fetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'local-test-owner','oai-authenticated-user-email':owner?'owner@example.invalid':'other@example.invalid'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})});return {status:r.status,data:await r.json()};}
let cloudRun;
try{
  const current=await call('office_read',{key:'system/control'});
  const changed=await call('office_write',{key:'system/control',value:{executors:{finance:'cloud'}},runId:maintenanceId,operationId:randomUUID(),expectedRevision:current.data.revision});assert.equal(changed.status,200);
  assert.equal((await call('office_lease',{action:'claim',task:'finance',runId:randomUUID()})).status,409);
  assert.equal((await mcp('office_read',{key},false)).status,403);
  const reserved=await mcp('office_lease',{action:'claim',task:'finance'});assert.equal(reserved.data.result.isError,false);cloudRun=JSON.parse(reserved.data.result.content[0].text).runId;
  const write=await mcp('office_write',{key,value:{privateAmount:126},runId:cloudRun,operationId:randomUUID(),expectedRevision:2});assert.equal(write.data.result.isError,false);
  const blocked=await mcp('office_write',{key:'system/control',value:{executors:{finance:'local'}},runId:maintenanceId,operationId:randomUUID(),expectedRevision:changed.data.revision});assert.equal(blocked.data.result.isError,true);
  const reset=await call('office_write',{key:'system/control',value:{executors:{finance:'local'}},runId:maintenanceId,operationId:randomUUID(),expectedRevision:changed.data.revision});assert.equal(reset.status,200);
}finally{
  if(cloudRun)await mcp('office_lease',{action:'release',task:'finance',runId:cloudRun});
  await call('office_lease',{action:'release',task:'maintenance',runId:maintenanceId});
}
console.log('OK: acesso privado, negação anônima, reserva, controle de versão, idempotência e ausência de dados privados no painel.');
