import { authorized, officeFetch } from './office';
import { documentRole, isOfficeOwner, roles, validatePrivateWrite } from '../lib/private-office-policy.mjs';
import { cloudInstructions } from '../lib/cloud-instructions.mjs';
import { agents, actions, roleEventAgents } from '../lib/office-policy.mjs';
import { officeOverview, overviewKeys } from '../lib/office-overview.mjs';
import { checkMailDomain } from '../lib/mail-domain.mjs';
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const object=(properties:Record<string,unknown>,required:string[]=[])=>({type:'object',properties,required,additionalProperties:false});
const string={type:'string'};
const tools=[
  {name:'office_instructions',description:'Leia primeiro. Procedimentos da Connect Promo, executor autorizado e estado da migração. Acesso exclusivo do proprietário.',inputSchema:object({})},
  {name:'office_overview',description:'Resumo privado e somente leitura dos últimos relatórios de cada setor, com revisões, horários, contagem diária e lacunas. Não representa nova execução nem confirma entrega de e-mail. Confirme Enviados antes de enviar.',inputSchema:object({})},
  {name:'office_domain_check',description:'Consulta somente o DNS de um domínio público de e-mail por HTTPS. Distingue MX, fallback, Null MX, domínio inexistente e consulta inconclusiva. Não envia e-mail, testa caixa ou comprova aceite. Use depois de verificar fonte oficial e afinidade.',inputSchema:object({domain:string},['domain'])},
  {name:'office_read',description:'Lê um documento privado ou lista até 100 chaves da área. Nunca envie estes dados ao histórico público.',inputSchema:object({key:string,area:{type:'string',enum:roles},offset:{type:'integer',minimum:0}})},
  {name:'office_write',description:'Salva documento privado com reserva válida e controle de versão. Para intenção de e-mail, salvar e reler antes do envio. Não aceita configurações ou segredos.',inputSchema:object({key:string,value:{},runId:string,operationId:string,expectedRevision:{type:'integer',minimum:0}},['key','value','runId','operationId','expectedRevision'])},
  {name:'office_lease',description:'Reserva, renova ou libera uma função. Não trabalhe se a reserva for negada. Renove antes de 25 minutos e libere no final. runId omitido em claim gera UUID.',inputSchema:object({action:{type:'string',enum:['claim','release']},task:{type:'string',enum:roles},runId:string},['action','task'])},
  {name:'office_event',description:'Registra somente ação realmente confirmada no histórico público agregado, sem informação privada. Use agent financeiro para finance, site para maintenance e gerencia para briefing. id omitido gera UUID; repetir use o mesmo id. Não tente novamente após rejeição de aprovação.',inputSchema:object({runId:string,id:string,agent:{type:'string',enum:agents},code:{type:'string',enum:Object.keys(actions)},state:{type:'string',enum:['running','succeeded','blocked','failed']},count:{type:'integer',minimum:0,maximum:10000}},['runId','agent','code','state','count'])},
  {name:'office_probe',description:'Teste inofensivo de acesso privado: devolve desafio solicitado. Não envia e-mails nem registra trabalho. Pode salvar confirmação privada de acesso à caixa corporativa após account_current.',inputSchema:object({challenge:string,mailboxVerified:{type:'boolean'}},['challenge'])},
];
async function payload(request:Request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw Error('JSON obrigatório.');
  const reader=request.body?.getReader();if(!reader)throw Error('Corpo obrigatório.');
  const parts:Uint8Array[]=[];let size=0;
  while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>540000){await reader.cancel();throw Error('Limite de tamanho.');}parts.push(p.value);}
  const merged=new Uint8Array(size);let offset=0;for(const part of parts){merged.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(merged));
}
async function documentCall(name:string,args:any,env:Cloudflare.Env,local:boolean){
  const db=env.DB!;
  if(name==='office_domain_check')return checkMailDomain(args.domain);
  if(name==='office_overview'){
    const rows=await db.prepare('SELECT key,value,revision,updated_at AS updatedAt FROM office_documents WHERE key IN ('+overviewKeys.map(()=>'?').join(',')+')').bind(...overviewKeys).all();
    return officeOverview(rows.results);
  }
  if(name==='office_instructions'){
    const control=await db.prepare("SELECT value FROM office_documents WHERE key='system/control'").first<{value:string}>();
    return {instructions:cloudInstructions+'\n\nCONTRATO DOS EVENTOS\nOs nomes das reservas não são os nomes dos agentes no painel. Use eventContract.roleAgents para escolher agent e eventContract.codes para code. Uma rejeição de aprovação não autoriza repetir com outro nome ou ferramenta. Preserve o resultado privado e informe o bloqueio. Uma reserva ocupada é concorrência temporária, não motivo para desativar um agendamento.',eventContract:{agents,codes:Object.keys(actions),roleAgents:roleEventAgents,fields:['runId','id','agent','code','state','count']},control:control?JSON.parse(control.value):{executors:Object.fromEntries(roles.map(r=>[r,'local'])),migration:'not_ready'}};
  }
  if(name==='office_probe'){
    if(typeof args.challenge!=='string'||args.challenge.length>120)throw Error('Desafio inválido.');
    // This record is readiness evidence only, excluded from business activity.
    const value=JSON.stringify({challenge:args.challenge,mailboxVerified:args.mailboxVerified===true,at:new Date().toISOString(),via:local?'local':'owner_mcp'});
    await db.prepare("INSERT INTO office_documents(key,value,revision,updated_at,operation_id) VALUES('maintenance/access-probe',?,1,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,revision=revision+1,updated_at=excluded.updated_at,operation_id=excluded.operation_id").bind(value,Date.now(),crypto.randomUUID()).run();
    return JSON.parse(value);
  }
  if(name==='office_read'){
    if(args.key){documentRole(args.key);const row=await db.prepare('SELECT key,value,revision,updated_at AS updatedAt FROM office_documents WHERE key=?').bind(args.key).first<any>();return row?{...row,value:JSON.parse(row.value)}:{key:args.key,value:null,revision:0};}
    if(!roles.includes(args.area)||!Number.isInteger(args.offset??0)||(args.offset??0)<0)throw Error('Área inválida.');
    const found=await db.prepare('SELECT key,revision,updated_at AS updatedAt FROM office_documents WHERE key LIKE ? ORDER BY key LIMIT 101 OFFSET ?').bind(args.area+'/%',args.offset||0).all();
    return {documents:found.results.slice(0,100),nextOffset:found.results.length>100?(args.offset||0)+100:null};
  }
  if(name==='office_write'){
    const {role,value}=validatePrivateWrite(args);
    if(args.key==='system/control'&&!local)throw Error('A rotina não pode modificar executores ou autorizações.');
    if(args.key==='system/control'){
      if(!args.value?.executors||Object.entries(args.value.executors).some(([k,v])=>!roles.includes(k)||!['local','cloud'].includes(v as string)))throw Error('Controle inválido.');
    }
    const lease=await db.prepare('SELECT run_id,expires_at FROM office_leases WHERE task=?').bind(role).first<any>();
    if(!lease||lease.run_id!==args.runId||lease.expires_at<=Date.now())throw Error('Reserva ausente ou vencida.');
    const prior=await db.prepare('SELECT value,revision,operation_id FROM office_documents WHERE key=?').bind(args.key).first<any>();
    if(prior?.operation_id===args.operationId){if(prior.value!==value)throw Error('Identificador reutilizado para conteúdo diferente.');return {key:args.key,revision:prior.revision,saved:true,idempotent:true};}
    if((prior?.revision||0)!==args.expectedRevision)throw Error('Conflito de versão. Releia antes de salvar.');
    // The lease and revision checks are repeated within the mutation for atomicity.
    const changed=args.expectedRevision===0
      ?await db.prepare('INSERT INTO office_documents(key,value,revision,updated_at,operation_id) SELECT ?,?,1,?,? WHERE EXISTS(SELECT 1 FROM office_leases WHERE task=? AND run_id=? AND expires_at>?) ON CONFLICT(key) DO NOTHING').bind(args.key,value,Date.now(),args.operationId,role,args.runId,Date.now()).run()
      :await db.prepare('UPDATE office_documents SET value=?,revision=revision+1,updated_at=?,operation_id=? WHERE key=? AND revision=? AND EXISTS(SELECT 1 FROM office_leases WHERE task=? AND run_id=? AND expires_at>?)').bind(value,Date.now(),args.operationId,args.key,args.expectedRevision,role,args.runId,Date.now()).run();
    if(changed.meta.changes!==1)throw Error('Reserva ou versão mudou. Releia antes de salvar.');
    return {key:args.key,revision:args.expectedRevision+1,saved:true};
  }
  if(name==='office_lease'||name==='office_event'){
    if(!env.OFFICE_RUNNER_TOKEN)throw Error('Configuração indisponível.');
    const runId=args.runId||crypto.randomUUID();
    const action=name==='office_event'?'events':args.action;
    if(!['events','claim','release'].includes(action))throw Error('Ação inválida.');
    const data=name==='office_event'?{...args,runId,id:args.id||crypto.randomUUID()}:{runId,task:args.task};
    const response=await officeFetch(new Request('https://office.internal/api/office/'+action,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+env.OFFICE_RUNNER_TOKEN},body:JSON.stringify(data)}),env,local?'local':'cloud');
    const result=await response!.json() as any;if(!response!.ok)throw Error(result.error||'Operação negada.');return {...result,runId};
  }
  throw Error('Ferramenta desconhecida.');
}
export async function privateOfficeFetch(request:Request,env:Cloudflare.Env):Promise<Response|null>{
  const path=new URL(request.url).pathname;
  if(path!=='/mcp'&&path!=='/api/office/private')return null;
  if(request.method!=='POST')return json({error:'Método não permitido.'},405);
  const local=path==='/api/office/private';
  const permitted=local?await authorized(request,env.OFFICE_RUNNER_TOKEN):isOfficeOwner(request.headers,env.OFFICE_OWNER_EMAIL);
  // Drain bounded input before rejecting: local Worker keep-alive otherwise restarts.
  let input,invalid=false;try{input=await payload(request);}catch{invalid=true;}
  if(!permitted)return json({error:'Acesso exclusivo do proprietário.'},403);
  if(!env.DB)return json({error:'Armazenamento indisponível.'},503);
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Origem não permitida.'},403);
  if(invalid)return json({error:'Solicitação inválida.'},400);
  if(local){try{return json(await documentCall(input.name,input.arguments||{},env,true));}catch{return json({error:'Operação privada negada ou conflito. Releia os dados e a reserva.'},409);}}
  const id=input.id??null;
  try{
    if(input.jsonrpc!=='2.0')return json({jsonrpc:'2.0',id,error:{code:-32600,message:'JSON-RPC inválido.'}},400);
    let result;
    if(input.method==='server/discover')result={supportedVersions:['2026-07-28'],capabilities:{tools:{}}};
    else if(input.method==='initialize')result={protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'Connect Promo — operações privadas',version:'1.0.0'}};
    else if(input.method==='notifications/initialized')return new Response(null,{status:202});
    else if(input.method==='tools/list')result={tools};
    else if(input.method==='tools/call'){
      try{const value=await documentCall(input.params?.name,input.params?.arguments||{},env,false);result={content:[{type:'text',text:JSON.stringify(value)}],isError:false};}
      catch(error){result={content:[{type:'text',text:(error as Error).message}],isError:true};}
    }else return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Método desconhecido.'}},400);
    return json({jsonrpc:'2.0',id,result});
  }catch{return json({jsonrpc:'2.0',id,error:{code:-32603,message:'Falha privada. Tente reler o estado.'}},500);}
}
