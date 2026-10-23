'use strict';
const OfficeLive=(()=>{
  let snapshot=null,error='',loading=false,lastFetch=0;
  const names={gerencia:'Gerência',marketing:'Marketing',comercial:'Prospecção',email:'E-mail',atendimento:'Atendimento',financeiro:'Financeiro',site:'Site'};
  const states={running:'Em execução',succeeded:'Concluído',blocked:'Aguardando',failed:'Falhou',stale:'Sem confirmação recente'};
  const time=at=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(at));
  function latest(id){return snapshot?.agents?.find(a=>a.agent===id)?.last||null;}
  function state(event){return event?.state==='running'&&Date.now()-Date.parse(event.at)>25*60000?'stale':event?.state;}
  function badge(event){const s=state(event);return `<span class="live-state ${s||'idle'}">${s?states[s]:'Sem execução registrada'}</span>`;}
  function mount(){const card=document.querySelector('.office-card');if(!card||document.querySelector('#office-connection'))return;card.insertAdjacentHTML('afterend','<div class="office-live-strip"><span><i class="connection-dot"></i><span id="office-connection">Consultando atividade real…</span></span><a href="#atividade">Acompanhar trabalho →</a></div>');updateStrip();}
  function updateStrip(){const el=document.querySelector('#office-connection');if(el)el.textContent=error?'Atividade indisponível — verifique a conexão':snapshot?`Última consulta: ${time(snapshot.serverTime)}`:'Consultando atividade real…';}
  function draw(){
    updateStrip();const area=document.querySelector('#real-activity-content');if(!area)return;
    if(!snapshot){area.innerHTML=`<div class="empty-state"><h3>${error?'Não foi possível consultar o histórico.':'Consultando as execuções…'}</h3><p>${error?'Use Atualizar para tentar novamente. Nenhuma atividade foi inventada.':'As confirmações vêm do registro da operação.'}</p></div>`;return;}
    const totals=snapshot.today||{};
    area.innerHTML=`${error?'<div class="info-strip"><p>A atualização falhou. Os dados abaixo são da última consulta.</p></div>':''}<div class="live-summary"><div><b>${totals.outreach_sent||0}</b><span>novas apresentações registradas hoje</span></div><div><b>${totals.reply_sent||0}</b><span>respostas registradas hoje</span></div><div><b>${totals.leads_verified||0}</b><span>contatos verificados hoje</span></div><div><b>${totals.site_check||0}</b><span>verificações do site hoje</span></div></div><p class="form-help">Totais desta rotina. Envios anteriores também são conferidos na Hostinger para respeitar o limite diário.</p><div class="live-agent-grid">${Object.keys(names).map(id=>{const last=latest(id);return `<button class="live-agent-card" data-live-agent="${id}"><span class="live-agent-title">${icon(Ops.agents.find(a=>a.id===id).icon)}<b>${names[id]}</b></span>${badge(last)}<p>${last?esc(last.label):'Aguardando a primeira atividade confirmada.'}</p><small>${last?esc(time(last.at)):'Sem registro'}</small></button>`;}).join('')}</div><div class="section-toolbar"><h2>Histórico de execução</h2><small>Consulta: ${esc(time(snapshot.serverTime))}</small></div><div class="live-history">${snapshot.events.length?snapshot.events.map(e=>`<article><span class="history-dot ${e.state}"></span><div><strong>${esc(names[e.agent])}</strong><p>${esc(e.label)}${e.count?` · ${e.count}`:''}</p><small>${esc(time(e.at))}</small></div>${badge(e)}</article>`).join(''):'<div class="empty-state"><h3>O histórico ainda está vazio.</h3><p>As primeiras execuções confirmadas aparecerão aqui.</p></div>'}</div>`;
  }
  async function refresh(){
    if(loading)return;loading=true;const button=document.querySelector('[data-live-refresh]');if(button)button.disabled=true;
    try{const response=await fetch('/api/office/status',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw new Error('indisponível');const data=await response.json();if(!Array.isArray(data.agents)||!Array.isArray(data.events)||!data.serverTime)throw new Error('inválido');snapshot=data;lastFetch=Date.now();error='';document.dispatchEvent(new Event('office-activity-updated'));}
    catch{error='Não foi possível atualizar.';}finally{loading=false;if(button)button.disabled=false;draw();}
  }
  function detail(id){
    if(!names[id])return;const event=latest(id),events=snapshot?.events.filter(e=>e.agent===id).slice(0,6)||[];
    showDialog(modalHeader('ATIVIDADE REAL · '+names[id])+`<div class="modal-body"><h2 id="dialog-title">${names[id]}</h2>${badge(event)}<p>${event?esc(event.label):'Esta função ainda não tem uma execução registrada.'}</p><p class="form-help">Os personagens se movimentam para representar o escritório. O histórico abaixo mostra apenas ações confirmadas pela rotina do Codex.</p><div class="actor-history">${events.map(e=>`<p><strong>${esc(time(e.at))}</strong><br>${esc(e.label)}${e.count?' · '+e.count:''}</p>`).join('')}</div><button class="button primary full" data-action="atividade">Ver todas as atividades ${icon('arrow')}</button></div>`);
  }
  document.addEventListener('click',e=>{const el=e.target.closest('[data-live-agent],[data-walker],[data-live-refresh]');if(!el)return;if(el.hasAttribute('data-live-refresh'))refresh();else detail(el.dataset.liveAgent||el.dataset.walker);});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-walker]')){e.preventDefault();detail(e.target.dataset.walker);}});
  document.addEventListener('DOMContentLoaded',()=>{new MutationObserver(()=>mount()).observe(document.querySelector('#main'),{childList:true});mount();refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastFetch>30000)refresh();});
  return {draw,refresh,mount,latest,state,detail};
})();
function renderActivity(){
  main.innerHTML=pageHead('CONNECT PROMO EM OPERAÇÃO','Trabalho que você pode acompanhar.','Execuções confirmadas, resultados e próximos passos.',`<button class="button" data-live-refresh>${icon('clock')}Atualizar</button>`)+`<div class="live-intro"><div><span class="eyebrow">ROTINAS DO CODEX</span><h2>Um escritório. Uma operação conectada.</h2><p>Atendimento, prospecção e manutenção executam suas rotinas pelo Codex e registram o resultado aqui. A página não precisa ficar aberta.</p></div><a class="button" href="https://mail.hostinger.com/" target="_blank" rel="noopener noreferrer">Abrir Hostinger ${icon('arrow')}</a></div><div class="live-rules"><span>${icon('check')}Até 5 novas apresentações por dia</span><span>${icon('clock')}Horário de Brasília</span><span>${icon('info')}Detalhes privados ficam na conversa</span></div><div id="real-activity-content" aria-live="polite"></div><p class="form-help live-footnote">A execução depende da disponibilidade do Codex e das integrações. O painel atualiza a cada 30 segundos; uma execução sem confirmação por 25 minutos é sinalizada. Para pausar ou mudar as rotinas, peça nesta conversa. As tarefas da aba Agentes continuam sendo registros manuais.</p>`;
  OfficeLive.draw();OfficeLive.refresh();
}
