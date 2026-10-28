'use strict';
const OfficeLive=(()=>{
  let snapshot=null,error='',loading=false,lastFetch=0,agentFilter='',statusFilter='all';
  const names=OfficeEvidence.names;
  const time=at=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(at));
  function latest(id){return snapshot?.agents?.find(a=>a.agent===id)?.last||null;}
  function state(event){return OfficeEvidence.state(event);}
  function badge(event){return `<span class="live-state ${state(event)||'idle'}">${esc(OfficeEvidence.label(event))}</span>`;}
  function mount(){
    const card=document.querySelector('.office-card');
    if(!card||document.querySelector('#office-connection'))return;
    card.insertAdjacentHTML('afterend','<div class="office-live-strip"><span><i class="connection-dot"></i><span id="office-connection">Consultando atividade real…</span></span><a href="#atividade">Acompanhar trabalho →</a></div>');
    updateStrip();
  }
  function updateStrip(){const el=document.querySelector('#office-connection');if(el)el.textContent=error?'Consulta indisponível — tente atualizar':snapshot?`Última consulta: ${time(snapshot.serverTime)}`:'Consultando atividade real…';}
  function history(){
    const area=document.querySelector('#live-history');if(!area||!snapshot)return;
    const events=OfficeEvidence.filter(snapshot.events,agentFilter,statusFilter);
    area.innerHTML=events.length?events.map(e=>`<article><span class="history-dot ${state(e)}"></span><div><strong>${esc(names[e.agent])}</strong><p>${esc(e.label)}${e.count?` · ${e.count}`:''}</p><small>${esc(time(e.at))}</small></div>${badge(e)}</article>`).join(''):'<div class="empty-state"><h3>Nenhum registro nesta seleção.</h3><p>Os filtros se aplicam aos últimos 30 registros públicos. Isso não confirma ausência de trabalho ou de pendências.</p></div>';
    const count=document.querySelector('#live-history-count');if(count)count.textContent=`${events.length} de ${snapshot.events.length} registros carregados`;
  }
  function draw(){
    updateStrip();const area=document.querySelector('#real-activity-content');if(!area)return;
    if(!snapshot){area.innerHTML=`<div class="empty-state"><h3>${error?'Não foi possível consultar o histórico.':'Consultando as execuções…'}</h3><p>${error?'Use Atualizar para tentar novamente. Não há dados atuais para exibir.':'As confirmações vêm do registro da operação.'}</p></div>`;return;}
    const focused=document.activeElement?.id;
    const modes=Object.values(snapshot.execution||{}),allCloud=modes.length===5&&modes.every(mode=>mode==='cloud');
    const executionText=allCloud?'As cinco rotinas estão configuradas na nuvem. Este computador e esta página podem ficar fechados.':modes.some(mode=>mode==='cloud')?'Parte das rotinas está na nuvem. As demais ainda dependem do executor local.':'Não há confirmação de que todas as rotinas estejam na nuvem.';
    const totals=snapshot.today||{};
    const metrics=[['outreach_sent','apresentações registradas','Envio confirmado não garante entrega.'],['reply_sent','respostas e acompanhamentos','Inclui correções em conversas existentes.'],['leads_verified','contatos avaliados','Não significa contatos aptos ou interessados.'],['site_check','verificações do site','Somente verificações registradas.'],['marketing_ready','materiais preparados','Preparação não significa publicação.'],['finance_report_ready','relatórios financeiros','Ausência de registro não significa saldo zero.']];
    area.innerHTML=`<div class="live-execution"><div><span class="eyebrow">${allCloud?'OPERAÇÃO NA NUVEM':'EXECUÇÃO'}</span><p>${executionText}</p><small>As conexões precisam estar disponíveis. Agendamento não comprova execução.</small></div><span class="live-query-time">Consulta em Brasília<br><strong>${esc(time(snapshot.serverTime))}</strong></span></div>
      ${error?'<div class="live-warning" role="alert"><strong>Não foi possível atualizar.</strong> Os números abaixo pertencem à última consulta, indicada acima.</div>':''}
      <div class="section-toolbar"><h2>Registros públicos de hoje</h2><small>${esc(OfficeEvidence.day(snapshot.serverTime).split('-').reverse().join('/'))} · Brasília</small></div>
      <div class="live-summary">${metrics.map(([key,label,note])=>`<div><b>${Number.isSafeInteger(totals[key])&&totals[key]>=0?totals[key]:0}</b><span>${label}</span><small>${note}</small></div>`).join('')}</div>
      <div class="live-evidence-note">${icon('info')}<p><strong>Este painel mostra os eventos publicados pela operação.</strong> Um zero aqui significa nenhum evento registrado nesta categoria, não ausência de trabalho. A contagem completa de e-mails, os relatórios e as pendências ficam na conferência privada de Yuri e da Hostinger.</p></div>
      <div class="section-toolbar"><h2>Última evidência por função</h2><small>Registro mais recente · não é estado permanente</small></div>
      <div class="live-agent-grid">${Object.keys(names).map(id=>{
        const last=latest(id),older=OfficeEvidence.olderDay(last);
        return `<button class="live-agent-card" data-live-agent="${id}"><span class="live-agent-title">${icon(Ops.agents.find(a=>a.id===id).icon)}<b>${names[id]}</b></span>${badge(last)}<p>${last?esc(last.label):'Nenhuma execução publicada para esta função.'}</p><small>${last?esc(time(last.at)):'Sem registro público'}</small>${older?'<span class="live-old-note">Registro de outro dia. Consulte o relatório privado atualizado.</span>':''}</button>`;
      }).join('')}</div>
      <div class="section-toolbar"><h2>Histórico recente</h2><small>Últimos 30 registros</small></div>
      <div class="live-filters"><label>Função<select id="live-agent-filter"><option value="">Todas as funções</option>${Object.entries(names).map(([id,name])=>`<option value="${id}" ${id===agentFilter?'selected':''}>${name}</option>`).join('')}</select></label><label>Situação<select id="live-status-filter">${[['all','Todos os registros'],['attention','Precisam de atenção'],['running','Em execução'],['succeeded','Confirmados']].map(([id,name])=>`<option value="${id}" ${id===statusFilter?'selected':''}>${name}</option>`).join('')}</select></label><span id="live-history-count"></span></div>
      <div id="live-history" class="live-history"></div>`;
    history();
    if(['live-agent-filter','live-status-filter'].includes(focused))document.getElementById(focused)?.focus({preventScroll:true});
  }
  async function refresh(){
    if(loading)return;loading=true;const button=document.querySelector('[data-live-refresh]');if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
    try{
      const response=await fetch('/api/office/status',{cache:'no-store',signal:AbortSignal.timeout(15000)});
      if(!response.ok)throw new Error('indisponível');
      const data=await response.json();if(!OfficeEvidence.validSnapshot(data))throw new Error('inválido');
      snapshot=data;lastFetch=Date.now();error='';document.dispatchEvent(new Event('office-activity-updated'));
    }catch{error='Não foi possível atualizar.';}
    finally{loading=false;if(button){button.disabled=false;button.removeAttribute('aria-busy');}draw();}
  }
  function detail(id){
    if(!names[id])return;const event=latest(id),events=snapshot?.events.filter(e=>e.agent===id).slice(0,6)||[];
    showDialog(modalHeader('EVIDÊNCIAS DA OPERAÇÃO · '+names[id])+`<div class="modal-body"><h2 id="dialog-title">${names[id]}</h2>${badge(event)}<p>${event?esc(event.label):'Esta função ainda não tem uma execução publicada.'}</p><p class="form-help">Último registro: ${event?esc(time(event.at)):'não disponível'}. Os movimentos dos personagens são uma representação visual. Relatórios privados podem conter trabalho que ainda não aparece no histórico público.</p><div class="actor-history">${events.length?events.map(e=>`<p><strong>${esc(time(e.at))}</strong><br>${esc(e.label)}${e.count?' · '+e.count:''}</p>`).join(''):'<p>Não há eventos desta função entre os últimos 30 registros.</p>'}</div><button class="button primary full" data-action="atividade">Ver atividade ${icon('arrow')}</button></div>`);
  }
  document.addEventListener('change',e=>{if(e.target.id==='live-agent-filter'){agentFilter=e.target.value;history();}else if(e.target.id==='live-status-filter'){statusFilter=e.target.value;history();}});
  document.addEventListener('click',e=>{const el=e.target.closest('[data-live-agent],[data-walker],[data-live-refresh]');if(!el)return;if(el.hasAttribute('data-live-refresh'))refresh();else detail(el.dataset.liveAgent||el.dataset.walker);});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-walker]')){e.preventDefault();detail(e.target.dataset.walker);}});
  document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>mount()).observe(document.querySelector('#main'),{childList:true});mount();refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastFetch>30000)refresh();});
  return {draw,refresh,mount,latest,state,detail};
})();
function renderActivity(){
  main.innerHTML=pageHead('CONNECT PROMO EM OPERAÇÃO','Trabalho que você pode acompanhar.','Evidências, horários e resultados, com clareza sobre o que ainda falta.',`<button class="button" data-live-refresh>${icon('clock')}Atualizar</button>`)+`<div class="live-intro"><div><span class="eyebrow">ROTINAS DA EMPRESA</span><h2>Durante o dia e a noite.</h2><p>Atendimento e prospecção a cada hora; marketing e financeiro a cada 4 horas; verificação do site a cada 2 horas. Todos os dias, inclusive fins de semana. Briefing às 15h de Brasília.</p></div><a class="button" href="https://mail.hostinger.com/" target="_blank" rel="noopener noreferrer">Abrir Hostinger ${icon('arrow')}</a></div><div class="live-rules"><span>${icon('check')}Meta: até 100 apresentações por dia</span><span>${icon('clock')}Horário de Brasília</span><span>${icon('info')}Dados de clientes e documentos ficam privados</span></div><div id="real-activity-content" aria-live="polite"></div><p class="form-help live-footnote">A meta depende de contatos elegíveis, sem repetição, e da cota da Hostinger. Uma resposta automática não é interesse comercial. Marketing prepara conteúdo; financeiro confere documentos, sem pagamentos automáticos. O painel consulta registros a cada 30 segundos enquanto visível; isso não muda a frequência das rotinas. Uma execução sem confirmação por 25 minutos é sinalizada. As tarefas da aba Agentes são planejamento manual deste navegador.</p>`;
  OfficeLive.draw();OfficeLive.refresh();
}
