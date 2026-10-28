import {officeOverview, overviewKeys} from './office-overview.mjs';
export const tickKey='briefing/yuri-cloud-tick.json';
export const queueKey='briefing/yuri-cloud-actions.json';
export const supervisionKeys=[...overviewKeys,tickKey,queueKey];
const cadence={mail:90,service:90,marketing:300,finance:300,maintenance:180};
const role={mail:'mail',service:'mail',marketing:'marketing',finance:'finance',maintenance:'maintenance'};
const parsed=row=>{try{return typeof row?.value==='string'?JSON.parse(row.value):row?.value||{};}catch{return {};}};
// Fixed evidence checks; no instructions from email, external pages or request bodies.
export function planSupervision(rows,leases,now=new Date()) {
  const overview=officeOverview(rows,now,leases), demands=[];
  const add=(id,sector,reason,request)=>demands.push({id,sector,reason,request});
  for(const [sector,limit] of Object.entries(cadence)) {
    const report=overview[sector],running=overview.reservations[role[sector]]?.active;
    if(!running&&(!report.available||report.ageMinutes===null||report.ageMinutes>limit||Date.parse(report.completedAt)>now.valueOf()))
      add('report-'+sector,sector,'missing_or_late_evidence','Conferir a função na próxima execução autorizada e registrar fontes, conclusão e bloqueio real.');
  }
  if(!overview.mail.today.verifiedReport||overview.mail.ageMinutes===null||overview.mail.ageMinutes>90)
    add('mail-count','mail','unverified_or_stale_count','Reconciliar Entrada, Enviados, devoluções, descadastros e reservas incertas; paginar e registrar cotas reais antes de enviar.');
  if(overview.service.pendingInReviewedConversations>0)
    add('service-pending','service','pending_human_requests','Ler conversas pendentes, verificar se já foram atendidas e responder solicitações rotineiras com inReplyTo real, dentro da reserva e da cota.');
  if(!overview.mail.today.verifiedReport||overview.mail.today.remainingToGoal>0)
    add('prospecting-goal','mail',overview.mail.today.verifiedReport?'daily_goal_incomplete':'daily_goal_unverified','Primeiro confirmar cotas nativas. Priorizar empresas de todo o Brasil com convite explícito a apresentações de fornecedores. Deduplicar empresa, domínio, aliases e histórico completo. Até 20 candidatos e 10 apresentações por execução; nunca ultrapassar 100 por dia nem a cota móvel.');
  const previous=parsed(rows.find(r=>r.key===queueKey));
  const prior=new Map((Array.isArray(previous.actions)?previous.actions:[]).map(a=>[a.id,a]));
  const actions=demands.map(a=>({...a,status:'pending',firstSeenAt:prior.get(a.id)?.status==='pending'?prior.get(a.id).firstSeenAt:now.toISOString(),lastObservedAt:now.toISOString()}));
  for(const item of prior.values())if(!demands.some(a=>a.id===item.id))actions.push({...item,status:'resolved',resolvedAt:item.resolvedAt||now.toISOString()});
  const changed=actions.filter(a=>a.status==='pending'&&prior.get(a.id)?.status!=='pending').length;
  return {overview,queue:{schemaVersion:1,updatedAt:now.toISOString(),actions,newDemands:changed,instruction:'Cobranças para a próxima execução autorizada; não alteram agendamentos, permissões, cotas ou aceite. Não comprovam trabalho do setor.'},
    tick:{schemaVersion:1,executor:'render',checkedAt:now.toISOString(),slot:Math.floor(now.valueOf()/600000),cadenceMinutes:10,
      reportSources:rows.filter(r=>overviewKeys.includes(r.key)).map(r=>({key:r.key,revision:r.revision})),sectorsChecked:Object.keys(cadence),pendingDemands:demands.length,newDemands:changed,
      presentationsAsOf:overview.mail.today.asOf,presentations:overview.mail.today.presentations,remainingToGoal:overview.mail.today.remainingToGoal,mailsSentBySupervisor:0,deliveryConfirmed:false}};
}
export function publicSupervision(row,enabled,now=Date.now()) {
  const tick=parsed(row),at=Date.parse(tick.checkedAt),age=now-at;
  const evidence=Number.isFinite(at)&&age>=0;
  return {serviceReady:enabled===true,configured:enabled===true&&evidence,cadenceMinutes:enabled&&evidence?10:null,lastCheckAt:evidence?tick.checkedAt:null,recentExecution:enabled===true&&evidence&&age<=20*60000,evidence:'Verificação dos relatórios; não significa novo envio ou entrega de e-mail.'};
}
