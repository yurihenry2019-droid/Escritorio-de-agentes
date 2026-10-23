import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEvent,validateLease,publicEvent,todayStart} from './lib/office-policy.mjs';
const event={id:'78af9e20-a1b3-44dd-8ed4-9914795cb499',runId:'2b8463dc-4052-41f5-9433-e00464527b0b',agent:'atendimento',code:'inbox_review',state:'succeeded',count:15};
test('histórico recusa dados privados, texto arbitrário e ações inexistentes',()=>{
  assert.deepEqual(validateEvent(event),event);
  assert.throws(()=>validateEvent({...event,recipient:'private@example.com'}));
  assert.throws(()=>validateEvent({...event,code:'inventado'}));
  assert.throws(()=>validateEvent({...event,count:-1}));
});
test('execução sem confirmação expira e não continua aparecendo como trabalho ativo',()=>{
  const row={...event,createdAt:1000,state:'running'};
  assert.equal(publicEvent(row,1100).state,'running');
  assert.equal(publicEvent(row,26*60*1000).state,'stale');
});
test('janela diária usa Brasília, e reserva só aceita rotinas conhecidas',()=>{
  assert.equal(todayStart(new Date('2026-10-24T02:59:00Z')),Date.parse('2026-10-23T03:00:00Z'));
  assert.deepEqual(validateLease({runId:event.runId,task:'mail'}),{runId:event.runId,task:'mail'});
  assert.throws(()=>validateLease({runId:event.runId,task:'qualquer-coisa'}));
});
