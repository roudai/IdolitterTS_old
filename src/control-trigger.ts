/* eslint-disable @typescript-eslint/no-unused-vars */
//トリガー作成
function setTrigger() {
  const next = new Date();
  //翌日00時00分00秒
  next.setDate(next.getDate() + 1);
  next.setHours(0);
  next.setMinutes(0);
  next.setSeconds(0);

  ScriptApp.newTrigger('dailyAnalysis_try').timeBased().at(next).create();
}

//トリガー削除
function delTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() == 'dailyAnalysis_try') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
}
