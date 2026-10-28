// Owner-only projection of durable reports. Never return source document bodies.
export const overviewKeys = [
  'system/control', 'mail/cloud-last-run.json', 'mail/customer-service-last-run.json',
  'marketing/cloud-last-run.json', 'finance/cloud-last-run.json', 'finance/checkpoint.json',
  'maintenance/cloud-last-run.json', 'briefing/supervision-protocol.json',
];
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const firstCount = (...values) => values.map(count).find(value => value !== null) ?? null;
const stamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const day = value => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
function source(document) {
  return {key:document.key, revision:count(document.revision), updatedAt:Number.isFinite(document.updatedAt) ? new Date(document.updatedAt).toISOString() : null};
}

export function officeOverview(documents, now = new Date()) {
  const warnings = [];
  const docs = new Map();
  for (const row of documents) {
    if (!overviewKeys.includes(row.key)) continue;
    let value = row.value;
    try { if (typeof value === 'string') value = JSON.parse(value); } catch { value = null; }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {warnings.push({key:row.key,code:'invalid_report'});continue;}
    docs.set(row.key, {...row,value});
  }
  const get = key => docs.get(key)?.value || {};
  const report = key => {
    const row = docs.get(key), value = get(key);
    const at = stamp(value.completedAt || value.checkedAt || value.lastCheckedAt);
    return {
      available:!!row, source:row ? source(row) : null,
      completedAt:at, ageMinutes:at ? Math.max(0,Math.floor((now.valueOf()-Date.parse(at))/60000)) : null,
      executor:['cloud','local'].includes(value.executor || value.executorConfirmed || value.mode) ? (value.executor || value.executorConfirmed || value.mode) : null,
    };
  };
  const mail = get('mail/cloud-last-run.json'), quota = mail.quota || {};
  const quotaDay = quota.brasiliaDate || quota.date;
  const total = firstCount(quota.todayOutgoingTotal,quota.todayTotal,quota.allOutgoingToday);
  const presentations = firstCount(quota.confirmedDailyPresentations,quota.presentationsToday);
  const other = firstCount(quota.otherOutgoingToday);
  const counterValues = [quota.confirmedDailyPresentations,quota.presentationsToday].filter(v=>v!==undefined);
  const inconsistent = counterValues.some(v=>count(v)===null || v!==presentations) ||
    (total!==null && presentations!==null && presentations>total) ||
    (total!==null && presentations!==null && other!==null && presentations+other!==total);
  const checkedAt = stamp(quota.checkedAt || quota.calculatedAt);
  const currentDay = quotaDay===day(now) && !!checkedAt && day(new Date(checkedAt))===day(now) && Date.parse(checkedAt)<=now.valueOf();
  const usable = currentDay && !inconsistent && quota.allPagesCovered===true && total!==null && presentations!==null;
  if (!currentDay) warnings.push({key:'mail/cloud-last-run.json',code:'daily_count_not_current'});
  if (inconsistent) warnings.push({key:'mail/cloud-last-run.json',code:'conflicting_daily_counts'});
  if (quota.allPagesCovered!==true) warnings.push({key:'mail/cloud-last-run.json',code:'mail_pagination_not_confirmed'});
  const service = get('mail/customer-service-last-run.json');
  const finance = get('finance/cloud-last-run.json'), checkpoint = get('finance/checkpoint.json');
  const marketing = get('marketing/cloud-last-run.json'), progress = marketing.concreteProgress || {};
  const maintenance = get('maintenance/cloud-last-run.json');
  const decision = get('briefing/supervision-protocol.json').scheduleDecision || {};
  const control = get('system/control');
  return {
    generatedAt:now.toISOString(), timezone:'America/Sao_Paulo', privateOnly:true,
    evidence:'Saved reports; confirm native Sent before any send. Missing evidence is unknown, never zero.',
    execution:Object.fromEntries(['mail','marketing','finance','maintenance','briefing'].map(role=>[role,['cloud','local'].includes(control.executors?.[role]) ? control.executors[role] : null])),
    mail:{...report('mail/cloud-last-run.json'), today:{
      date:day(now), asOf:checkedAt, verifiedReport:usable,
      presentations:usable ? presentations : null, outgoingTotal:usable ? total : null,
      otherOutgoing:usable ? (other ?? total-presentations) : null,
      remainingToGoal:usable ? Math.max(0,100-presentations) : null,
      deliveryConfirmed:false,
    }, lastRun:{presentations:firstCount(mail.confirmedThisRun?.outreachSent),replies:firstCount(mail.confirmedThisRun?.repliesSent)},
    uncertainReservations:firstCount(quota.uncertainOutgoingReservations,quota.uncertainReserved),
    historicalCoverageComplete:mail.service?.coverage==='complete' ? true : null},
    service:{...report('mail/customer-service-last-run.json'),
      pendingInReviewedConversations:Array.isArray(service.pendingRoutineReplies) ? service.pendingRoutineReplies.length : firstCount(service.pendingRoutineReplies),awaitingOwnerDecision:firstCount(service.awaitingOwnerDecisionCount),
      newHumanRequests:firstCount(service.newHumanRequests),repliesConfirmed:firstCount(service.routineRepliesConfirmed),
      oldestPendingAt:stamp(service.oldestPendingAt),
      historicalCoverageComplete:service.serviceBacklogCoverage?.status==='complete' ? true : service.serviceBacklogCoverage?.status==='partial' ? false : null,
    },
    marketing:{...report('marketing/cloud-last-run.json'),newPackagePrepared:typeof progress.newPackageCreated==='boolean' ? progress.newPackageCreated : null,
      materialPrepared:typeof marketing.declaration?.materialPrepared==='boolean' ? marketing.declaration.materialPrepared : null,
      socialPostsPublished:firstCount(progress.socialPostsPublished,marketing.declaration?.socialPostsPublished), adsPurchased:firstCount(progress.adsPurchased,marketing.declaration?.adsPurchased),
      newHumanReplies:firstCount(progress.newHumanReplies)},
    finance:{...report('finance/cloud-last-run.json'),
      messagesReadThisRun:firstCount(finance.newMessagesRead),reviewedMessages:firstCount(checkpoint.historicalCoverage?.messagesRead),
      historicalCoverageComplete:typeof checkpoint.historicalCoverage?.complete==='boolean' ? checkpoint.historicalCoverage.complete : null,
      sentBodiesPending:firstCount(checkpoint.historicalCoverage?.sentBodyMessagesPending),
      financialDocumentsThisRun:firstCount(finance.breakdown?.confirmedFinancialDocuments),
      cashBalanceKnown:false,
    },
    maintenance:{...report('maintenance/cloud-last-run.json'),reproducibleBug:typeof maintenance.logs?.reproducibleBug==='boolean' ? maintenance.logs.reproducibleBug : typeof maintenance.verified?.logs?.reproducibleBug==='boolean' ? maintenance.verified.logs.reproducibleBug : null,
      codeChanged:typeof maintenance.codeChanged==='boolean' ? maintenance.codeChanged : null,
      published:typeof maintenance.published==='boolean' ? maintenance.published : null},
    supervision:{source:docs.has('briefing/supervision-protocol.json') ? source(docs.get('briefing/supervision-protocol.json')) : null,
      requestedMinutes:firstCount(decision.requestedMinutes),configuredMinutes:firstCount(decision.configuredMinutes),
      exactRequestFulfilled:decision.exactRequestFulfilled===true && decision.configuredMinutes===decision.requestedMinutes && count(decision.configuredMinutes)>0,
      dailyBriefingPreserved:decision.restoredDailyBriefing===true,
    },warnings,
  };
}
