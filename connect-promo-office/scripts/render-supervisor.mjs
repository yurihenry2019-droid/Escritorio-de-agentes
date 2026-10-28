// Render cron: */10 * * * *. No dependencies, mailbox credentials or local files.
const endpoint='https://connect-promo-escritorio.yurihenry2013.chatgpt.site/api/office/supervision/run';
try {
  const token=process.env.YURI_SUPERVISION_TOKEN;
  if(!token||token.length<40)throw Error('missing_scoped_credential');
  const response=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('supervision_http_'+response.status);
  const result=await response.json();
  if(result.ok!==true)throw Error('supervision_not_confirmed');
  console.log(JSON.stringify({ok:true,scheduledExecution:result.scheduledExecution===true,checkedAt:result.checkedAt||null,skipped:result.skipped||null,pendingDemands:result.pendingDemands??null,newDemands:result.newDemands??null}));
}catch(error){console.error(JSON.stringify({ok:false,error:['missing_scoped_credential','supervision_not_confirmed'].includes(error.message)||/^supervision_http_\d{3}$/.test(error.message)?error.message:'supervision_connection_failed'}));process.exitCode=1;}
