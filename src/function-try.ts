function dailyAnalysis_try(){
    var lastError = null;
    for(var i = 0; i < 10; i++) {
      try {
        dailyAnalysis();
        return;
      } catch(e) {
        lastError = e;
        Logger.log(e);
      }
      Utilities.sleep(60000);
    }
    throw lastError;
  }