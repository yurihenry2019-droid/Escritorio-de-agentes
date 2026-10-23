import test from 'node:test';
import assert from 'node:assert/strict';
await import('./public/operations-model.js');
const M=globalThis.ConnectOperations;
test('a reunião respeita Brasília, passa para amanhã após 15h e cruza o ano',()=>{
  assert.equal(M.nextMeeting(new Date('2026-10-23T17:59:00Z')).toISOString(),'2026-10-23T18:00:00.000Z');
  assert.equal(M.nextMeeting(new Date('2026-10-23T18:01:00Z')).toISOString(),'2026-10-24T18:00:00.000Z');
  assert.equal(M.nextMeeting(new Date('2026-12-31T19:00:00Z')).toISOString(),'2027-01-01T18:00:00.000Z');
});
test('função pausada não recebe novas tarefas, mas mantém as existentes',()=>{
  const task={id:'t1',agentId:'marketing',title:'Campanha',status:'planejado',priority:'alta',due:'2026-10-22'};
  let data=M.saveTask(M.normalize(null),task);data.paused=['marketing'];
  assert.throws(()=>M.saveTask(data,{...task,id:'t2'}),/Reative/);
  assert.equal(M.saveTask(data,{...task,status:'bloqueado'}).tasks[0].status,'bloqueado');
  assert.equal(M.stats(data,new Date('2026-10-23T16:00:00Z')).overdue,1);
});
test('conclusão exige resultado e não duplica a tarefa',()=>{
  const task={id:'t1',agentId:'site',title:'Revisar contato',status:'planejado',priority:'media'};
  const data=M.saveTask(M.normalize(null),task);
  assert.throws(()=>M.saveTask(data,{...task,status:'concluido'}),/resultado/);
  const next=M.saveTask(data,{...task,status:'concluido',result:'Verificado no celular e computador'});
  assert.equal(next.tasks.length,1);assert.equal(M.stats(next).done,1);
});
test('importação ignora funções desconhecidas e relatório não fabrica métricas',()=>{
  const data=M.normalize({paused:['x','site','site'],tasks:[{id:'x',agentId:'nao-contratado',title:'Teste'}]});
  assert.deepEqual(data.paused,['site']);assert.equal(data.tasks.length,0);
  assert.match(M.report(data),/não é uma análise gerada por IA/);
  assert.match(M.calendar(new Date('2026-10-23T19:00:00Z')),/DTSTART;TZID=America\/Sao_Paulo:20261024T150000/);
});
