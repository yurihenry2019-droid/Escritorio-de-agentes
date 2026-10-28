import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {officeOverview} from './lib/office-overview.mjs';
import {checkMailDomain,normalizeMailDomain} from './lib/mail-domain.mjs';
const scope={};vm.runInNewContext(readFileSync(new URL('./public/activity-model.js',import.meta.url),'utf8'),scope);
const ui=scope.OfficeEvidence;
const now=new Date('2026-10-28T17:00:00Z');
const doc=(key,value)=>({key,value,revision:2,updatedAt:now.valueOf()});
const mail=quota=>doc('mail/cloud-last-run.json',{completedAt:now.toISOString(),mode:'cloud',quota:{brasiliaDate:'2026-10-28',checkedAt:now.toISOString(),allPagesCovered:true,todayOutgoingTotal:4,confirmedDailyPresentations:3,otherOutgoingToday:1,...quota},privateBody:'NEVER EXPOSE',confirmedThisRun:{outreachSent:1,repliesSent:0}});
test('consulta DNS não aceita URL, endereço completo, caminho nem IP',()=>{
  for(const input of ['https://example.com','a@example.com','localhost','127.0.0.1','example.com/?x=1','a..com','-a.com'])assert.throws(()=>normalizeMailDomain(input));
  assert.equal(normalizeMailDomain(' EXAMPLE.COM. '),'example.com');
});
test('distingue domínio inexistente, Null MX, MX válido e fallback sem prometer entrega',async()=>{
  const mock=data=>async url=>{const u=new URL(url);assert.equal(u.origin,'https://cloudflare-dns.com');assert.equal(u.searchParams.get('name'),'example.com');return {ok:true,json:async()=>data[u.searchParams.get('type')]||{Status:0}};};
  assert.equal((await checkMailDomain('example.com',mock({MX:{Status:3}}))).state,'nxdomain');
  assert.equal((await checkMailDomain('example.com',mock({MX:{Status:0,Answer:[{type:15,data:'0 .'}]}}))).state,'null_mx');
  const found=await checkMailDomain('example.com',mock({MX:{Status:0,Answer:[{type:15,data:'10 mail.example.com.'}]}}));
  assert.equal(found.state,'mx_found');assert.equal(found.mailboxExistenceVerified,false);assert.equal(found.emailSent,false);assert.equal(found.commercialConsentVerified,false);
  assert.equal((await checkMailDomain('example.com',mock({A:{Status:0,Answer:[{type:1,data:'192.0.2.1'}]}}))).state,'implicit_mx');
  assert.equal((await checkMailDomain('example.com',mock({}))).state,'no_mail_route');
});
test('erro transitório e resposta truncada não aprovam nem suprimem um contato',async()=>{
  for(const data of [{Status:2},{Status:0,TC:true},{Status:0,Answer:'bad'},{Status:0,Answer:[{type:15,data:'broken'}]}])assert.equal((await checkMailDomain('example.com',async()=>({ok:true,json:async()=>data}))).state,'unverified');
  assert.equal((await checkMailDomain('example.com',async()=>{throw Error('timeout')})).state,'unverified');
});

test('consulta usa modo compatível com Workers e rejeita redirecionamento do resolvedor',async()=>{
  const result=await checkMailDomain('example.com',async(_url,options)=>{
    assert.equal(options.redirect,'manual');
    return {ok:false,status:302,json:async()=>{throw Error('Não seguir redirecionamento.');}};
  });
  assert.equal(result.state,'unverified');
  assert.equal(result.emailSent,false);
});
test('resumo distingue apresentações, respostas e entrega; não devolve documentos privados',()=>{
  const result=officeOverview([mail({}),doc('finance/checkpoint.json',{historicalCoverage:{messagesRead:474,complete:false},invoice:'PRIVATE'})],now);
  assert.equal(result.mail.today.presentations,3);assert.equal(result.mail.today.outgoingTotal,4);assert.equal(result.mail.today.remainingToGoal,97);
  assert.equal(result.mail.today.deliveryConfirmed,false);assert.equal(result.finance.reviewedMessages,474);
  assert.equal(result.finance.cashBalanceKnown,false);assert.ok(!JSON.stringify(result).includes('NEVER EXPOSE'));assert.ok(!JSON.stringify(result).includes('PRIVATE'));
});
test('ausência, dia anterior, paginação incompleta e contradição são desconhecidos, nunca zero',()=>{
  for(const quota of [{brasiliaDate:'2026-10-27'},{allPagesCovered:false},{presentationsToday:2},{todayOutgoingTotal:2},{otherOutgoingToday:2},{checkedAt:'2026-10-29T17:00:00Z'}]){
    const result=officeOverview([mail(quota)],now);assert.equal(result.mail.today.verifiedReport,false);assert.equal(result.mail.today.presentations,null);assert.equal(result.mail.today.remainingToGoal,null);
  }
  const missing=officeOverview([],now);assert.equal(missing.finance.reviewedMessages,null);assert.equal(missing.mail.today.outgoingTotal,null);assert.equal(missing.service.pendingInReviewedConversations,null);
});
test('o dia de Brasília não vira à meia-noite UTC',()=>{
  const result=officeOverview([mail({brasiliaDate:'2026-10-28',checkedAt:'2026-10-29T01:00:00Z'})],new Date('2026-10-29T02:59:00Z'));
  assert.equal(result.mail.today.verifiedReport,true);
  assert.equal(officeOverview([mail({})],new Date('2026-10-29T03:00:00Z')).mail.today.presentations,null);
});
test('briefing diário habilitado não significa supervisão de dez minutos ativa',()=>{
  const result=officeOverview([doc('briefing/supervision-protocol.json',{scheduleDecision:{enabled:true,requestedMinutes:10,configuredMinutes:null,exactRequestFulfilled:false,restoredDailyBriefing:true}})],now);
  assert.equal(result.supervision.exactRequestFulfilled,false);assert.equal(result.supervision.dailyBriefingPreserved,true);
});

test('reservas expõem apenas função e vencimento, sem liberar nem revelar identificadores',()=>{
  const result=officeOverview([],now,[{task:'mail',run_id:'PRIVATE-RUN',expires_at:now.valueOf()+90000},{task:'finance',expires_at:now.valueOf()-1}]);
  assert.equal(result.reservations.mail.active,true);assert.equal(result.reservations.mail.remainingSeconds,90);
  assert.equal(result.reservations.finance.active,false);assert.equal(result.reservations.marketing.active,false);
  assert.ok(!JSON.stringify(result).includes('PRIVATE-RUN'));
});
test('painel não transforma configuração ou registro antigo em trabalho atual',()=>{
  const event={agent:'gerencia',code:'automation_enabled',state:'succeeded',at:'2026-10-27T10:00:00Z',label:'Configuração',count:1};
  assert.equal(ui.label(event,now.valueOf()),'Configuração registrada');assert.equal(ui.olderDay(event,now.valueOf()),true);
  assert.equal(ui.state({...event,state:'running'},now.valueOf()),'stale');
  assert.equal(ui.filter([event,{...event,agent:'site',state:'failed'}],'site','attention',now.valueOf()).length,1);
  assert.equal(ui.validSnapshot({serverTime:'invalid',agents:[],events:[]}),false);
  assert.equal(ui.validSnapshot({serverTime:now.toISOString(),agents:[],events:[{...event,count:-1}]}),false);
});
