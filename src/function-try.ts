/* eslint-disable @typescript-eslint/no-unused-vars */
function checkAccount_try() {
  let lastError = null;
  for (let i = 0; i < 3; i++) {
    try {
      checkAccount();
      return;
    } catch (e) {
      lastError = e;
      Logger.log(e);
    }
    Utilities.sleep(10000);
  }
  throw lastError;
}

function dailyAnalysis_try() {
  let lastError = null;
  for (let i = 0; i < 10; i++) {
    try {
      dailyAnalysis();
      return;
    } catch (e) {
      lastError = e;
      Logger.log(e);
    }
    Utilities.sleep(60000);
  }
  throw lastError;
}
