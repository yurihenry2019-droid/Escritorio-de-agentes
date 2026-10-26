export const agents = ['gerencia','marketing','comercial','email','atendimento','financeiro','site'];
export const roleEventAgents = {mail:['atendimento','email','comercial'],marketing:['marketing'],finance:['financeiro'],maintenance:['site'],briefing:['gerencia']};
export const actions = {
  inbox_review: 'Caixa de entrada e histórico conferidos',
  auto_reply_ignored: 'Respostas automáticas identificadas; nenhum retorno necessário',
  reply_sent: 'Resposta a cliente confirmada nos enviados',
  outreach_sent: 'Apresentação comercial confirmada nos enviados',
  quota_reached: 'Limite diário de novas apresentações atingido',
  leads_verified: 'Contatos comerciais públicos verificados',
  site_check: 'Verificação do site concluída',
  bug_fixed: 'Correção testada e publicada',
  run_failed: 'A execução precisa de atenção',
  automation_enabled: 'Rotina automática configurada',
  briefing_ready: 'Briefing de gestão entregue na conversa',
  marketing_ready: 'Material de marketing concluído e salvo em privado',
  finance_review: 'Conferência de documentos financeiros concluída',
  finance_report_ready: 'Relatório financeiro atualizado em privado',
  awaiting_data: 'Aguardando informações para executar',
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateEvent(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Registro inválido.');
  const keys = ['id','runId','agent','code','state','count'];
  if (Object.keys(input).some(key=>!keys.includes(key))) throw new Error('O histórico público não aceita conteúdo livre ou dados de clientes.');
  if (!uuid.test(input.id)||!uuid.test(input.runId)) throw new Error('Identificador inválido.');
  if (!agents.includes(input.agent)||!Object.hasOwn(actions,input.code)) throw new Error('Função ou atividade inválida.');
  if (!['running','succeeded','blocked','failed'].includes(input.state)) throw new Error('Estado inválido.');
  if (!Number.isInteger(input.count)||input.count<0||input.count>10000) throw new Error('Quantidade inválida.');
  return Object.fromEntries(keys.map(key=>[key,input[key]]));
}
export function validateLease(input) {
  if (!input||!uuid.test(input.runId)||!['mail','maintenance','marketing','finance','briefing'].includes(input.task)) throw new Error('Reserva inválida.');
  return {runId:input.runId,task:input.task};
}
export function publicEvent(row, now=Date.now()) {
  const state = row.state==='running' && now-row.createdAt>25*60*1000 ? 'stale' : row.state;
  return {id:row.id,agent:row.agent,code:row.code,label:actions[row.code]||'Atividade registrada',state,count:row.count,at:new Date(row.createdAt).toISOString()};
}
export function todayStart(now = new Date()) {
  const day = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  return Date.parse(day+'T00:00:00-03:00');
}
