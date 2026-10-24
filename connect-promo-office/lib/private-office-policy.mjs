export const roles=['mail','marketing','finance','maintenance','briefing'];
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function isOfficeOwner(headers,ownerEmail) {
  // These identity headers are supplied by Sites dispatch, never browser forms.
  const email=headers.get('oai-authenticated-user-email');
  return !!ownerEmail&&!!headers.get('oai-authenticated-user-id')&&email?.toLowerCase()===ownerEmail.toLowerCase();
}
export function documentRole(key){
  if(typeof key!=='string'||key.length>180||!/^([a-z]+)\/[a-zA-Z0-9_.\/-]+$/.test(key)||key.split('/').some(p=>p===''||p==='.'||p==='..')||/config|credential|secret|token|\.env/i.test(key))throw Error('Chave privada inválida.');
  const role=key.split('/')[0];if(!roles.includes(role)&&key!=='system/control')throw Error('Área privada inválida.');
  return role==='system'?'maintenance':role;
}
export function validatePrivateWrite(input){
  const role=documentRole(input.key);
  if(!uuidPattern.test(input.runId)||!uuidPattern.test(input.operationId)||!Number.isInteger(input.expectedRevision)||input.expectedRevision<0)throw Error('Versão ou reserva inválida.');
  const value=JSON.stringify(input.value);
  if(value===undefined||new TextEncoder().encode(value).length>512000)throw Error('Documento muito grande. Divida o registro.');
  return {role,value};
}
