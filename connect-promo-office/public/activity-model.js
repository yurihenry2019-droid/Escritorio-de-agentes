(function(root,factory){const model=factory();if(typeof module==='object'&&module.exports)module.exports=model;else root.OfficeEvidence=model;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const names={gerencia:'Gerência',marketing:'Marketing',comercial:'Prospecção',email:'E-mail',atendimento:'Atendimento',financeiro:'Financeiro',site:'Site'};
  const states={running:'Em execução',succeeded:'Registro confirmado',blocked:'Aguardando',failed:'Falha registrada',stale:'Sem confirmação recente'};
  function day(value){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
  function state(event,now=Date.now()){
    if(!event||!Object.hasOwn(states,event.state))return null;
    return event.state==='running'&&now-Date.parse(event.at)>25*60000?'stale':event.state;
  }
  function label(event,now=Date.now()){
    if(!event)return 'Sem registro público';
    if(event.code==='automation_enabled'&&event.state==='succeeded')return 'Configuração registrada';
    return states[state(event,now)]||'Sem confirmação';
  }
  function olderDay(event,now=Date.now()){return !!event&&Number.isFinite(Date.parse(event.at))&&day(event.at)!==day(now);}
  function filter(events,agent='',status='all',now=Date.now()){
    return events.filter(event=>(!agent||event.agent===agent)&&(status==='all'||status==='attention'&&['failed','blocked','stale'].includes(state(event,now))||status===state(event,now)));
  }
  function validSnapshot(data){return !!data&&Number.isFinite(Date.parse(data.serverTime))&&Array.isArray(data.agents)&&Array.isArray(data.events)&&[...data.events,...data.agents.map(a=>a.last).filter(Boolean)].every(e=>e&&Object.hasOwn(names,e.agent)&&Object.hasOwn(states,e.state)&&typeof e.label==='string'&&Number.isFinite(Date.parse(e.at))&&Number.isInteger(e.count)&&e.count>=0);}
  return {names,states,day,state,label,olderDay,filter,validSnapshot};
});
