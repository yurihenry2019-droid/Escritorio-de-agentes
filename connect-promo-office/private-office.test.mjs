import test from 'node:test';
import assert from 'node:assert/strict';
import {isOfficeOwner,documentRole,validatePrivateWrite} from './lib/private-office-policy.mjs';
import {roleEventAgents,validateEvent} from './lib/office-policy.mjs';
test('funções da nuvem anunciam agentes aceitos pelo histórico público',()=>{
  const codes={mail:'inbox_review',marketing:'marketing_ready',finance:'finance_review',maintenance:'site_check',briefing:'briefing_ready'};
  for(const [role,code] of Object.entries(codes)){
    assert.ok(roleEventAgents[role]?.length);
    for(const agent of roleEventAgents[role])assert.doesNotThrow(()=>validateEvent({id:'2b8463dc-4052-41f5-9433-e00464527b0b',runId:'78af9e20-a1b3-44dd-8ed4-9914795cb499',agent,code,state:'succeeded',count:1}));
  }
  assert.equal(roleEventAgents.finance[0],'financeiro');
});
test('área privada recusa anônimo e outro visitante, mesmo com site público',()=>{
  const h=new Headers();assert.equal(isOfficeOwner(h,'owner@example.invalid'),false);
  h.set('oai-authenticated-user-email','owner@example.invalid');assert.equal(isOfficeOwner(h,'owner@example.invalid'),false);
  h.set('oai-authenticated-user-id','site-user');assert.equal(isOfficeOwner(h,'owner@example.invalid'),true);
  assert.equal(isOfficeOwner(h,'other@example.invalid'),false);assert.equal(isOfficeOwner(h,undefined),false);
});
test('documentos não aceitam caminhos, segredos nem áreas arbitrárias',()=>{
  for(const key of ['mail/../config.json','mail/.env','mail/token.txt','mail//file','private/data','finance/../../secret','mail/config.json'])assert.throws(()=>documentRole(key));
  assert.equal(documentRole('finance/records.json'),'finance');assert.equal(documentRole('system/control'),'maintenance');
});
test('gravação exige UUID, revisão válida e tamanho limitado',()=>{
  const input={key:'mail/checkpoint.json',value:{lastUid:12},runId:'2b8463dc-4052-41f5-9433-e00464527b0b',operationId:'78af9e20-a1b3-44dd-8ed4-9914795cb499',expectedRevision:0};
  assert.equal(validatePrivateWrite(input).role,'mail');
  for(const change of [{runId:'bad'},{operationId:'bad'},{expectedRevision:-1},{expectedRevision:0.5},{value:'a'.repeat(512001)}])assert.throws(()=>validatePrivateWrite({...input,...change}));
});
