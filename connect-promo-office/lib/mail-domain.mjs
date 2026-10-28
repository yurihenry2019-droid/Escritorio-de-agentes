// DNS only: no SMTP probing, no message, no consent or mailbox-existence claim.
// RFC 5321 §5.1: implicit MX fallback. RFC 7505: explicit Null MX.
export function normalizeMailDomain(value) {
  if(typeof value!=='string')throw Error('Informe somente o domínio público do e-mail.');
  const domain=value.trim().toLowerCase().replace(/\.$/,'');
  if(domain.length>253||!domain.includes('.')||/^[\d.]+$/.test(domain)||!domain.split('.').every(label=>/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)))throw Error('Domínio inválido. Não informe URL ou endereço de e-mail.');
  return domain;
}
export async function checkMailDomain(value,fetcher=fetch) {
  const domain=normalizeMailDomain(value),queries=[];
  const base={domain,checkedAt:new Date().toISOString(),resolver:'Cloudflare DNS over HTTPS',emailSent:false,mailboxExistenceVerified:false,commercialConsentVerified:false};
  async function query(type){
    const url=new URL('https://cloudflare-dns.com/dns-query');url.searchParams.set('name',domain);url.searchParams.set('type',type);
    // Workers accepts manual/follow, but not redirect:error. Never follow a redirect.
    const response=await fetcher(url.toString(),{headers:{Accept:'application/dns-json'},signal:AbortSignal.timeout(5000),redirect:'manual'});
    if(!response.ok)throw Error('DNS indisponível.');
    const json=await response.json();
    if(!Number.isInteger(json.Status)||json.TC===true||json.Answer!==undefined&&!Array.isArray(json.Answer))throw Error('DNS incompleto.');
    queries.push({type,status:json.Status});return json;
  }
  function result(state,note,mx=[]){return {...base,state,note,mx,queries};}
  try{
    const response=await query('MX');
    if(response.Status===3)return result('nxdomain','O domínio não existe no DNS. Não enviar.');
    if(response.Status!==0)return result('unverified','A consulta DNS falhou. Não interpretar como endereço inexistente nem como aprovado.');
    const records=(response.Answer||[]).filter(answer=>answer.type===15);
    if(records.length){
      const mx=records.map(record=>{
        if(typeof record.data!=='string')throw Error('MX inválido.');
        const match=record.data.trim().match(/^(\d+)\s+(\S+)$/);if(!match||Number(match[1])>65535)throw Error('MX inválido.');
        const host=match[2]==='.'?'.':normalizeMailDomain(match[2]);return {preference:Number(match[1]),host};
      });
      if(mx.some(record=>record.host==='.'))return mx.length===1&&mx[0].preference===0
        ?result('null_mx','O domínio declara que não recebe e-mails. Não enviar.',mx)
        :result('unverified','Configuração MX contraditória. Revisar antes de qualquer envio.',mx);
      return result('mx_found','Há rota MX publicada. Isso não prova existência da caixa, entrega ou aceite comercial.',mx);
    }
    const addresses=await Promise.allSettled([query('A'),query('AAAA')]);
    if(addresses.some(item=>item.status==='fulfilled'&&item.value.Status===0&&(item.value.Answer||[]).some(answer=>[1,28].includes(answer.type)&&typeof answer.data==='string'&&answer.data.length>0)))return result('implicit_mx','Não há MX explícito; existe endereço para fallback SMTP. Não prova que o servidor recebe e-mail ou que a caixa existe.');
    if(addresses.some(item=>item.status==='rejected'||item.value.Status!==0))return result('unverified','Não foi possível confirmar a rota de e-mail. Tratar como pendência técnica.');
    return result('no_mail_route','Não foram encontrados MX nem endereços de fallback. Não enviar até revisão.');
  }catch(error){console.warn('office_domain_check',error?.name,error?.message);return result('unverified','Consulta técnica indisponível ou resposta inválida. Não marca o contato como aprovado.');}
}
