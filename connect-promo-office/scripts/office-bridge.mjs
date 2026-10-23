import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {validateEvent,validateLease} from '../lib/office-policy.mjs';
const root=new URL('../',import.meta.url);
const args=process.argv.slice(2),command=args.shift();
const targetOrigin='https://connect-promo-escritorio.yurihenry2013.chatgpt.site';
if(command==='uuid'){console.log(randomUUID());process.exit(0);}
try {
  let data,path,method='POST';
  if(command==='status'){path='/status';method='GET';}
  else if(command==='event'){
    const [runId,id,agent,code,state,count='0']=args;
    data=validateEvent({runId,id,agent,code,state,count:Number(count)});path='/events';
  }else if(command==='claim'||command==='release'){data=validateLease({runId:args[0],task:args[1]});path='/'+command;}
  else throw new Error('Use uuid, status, claim RUN_ID mail|maintenance, release RUN_ID mail|maintenance ou event RUN_ID EVENT_ID FUNCAO CODIGO ESTADO QUANTIDADE.');
  const headers={'Content-Type':'application/json'};
  if(method==='POST'){
    const config=JSON.parse(await readFile(new URL('.office-runtime/config.json',root),'utf8'));
    if(config.origin!==targetOrigin||typeof config.token!=='string'||config.token.length<40)throw new Error('Configuração da rotina indisponível.');
    headers.Authorization='Bearer '+config.token;
  }
  const response=await fetch(targetOrigin+'/api/office'+path,{method,headers,body:data?JSON.stringify(data):undefined,redirect:'error',signal:AbortSignal.timeout(20000)});
  const result=await response.json();
  console.log(JSON.stringify({status:response.status,...result}));
  if(!response.ok)process.exitCode=response.status===409?3:1;
}catch(error){console.error(error.name==='TimeoutError'?'Tempo esgotado. Verifique o histórico antes de repetir.':error.message);process.exitCode=1;}
