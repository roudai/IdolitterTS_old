/* eslint-disable @typescript-eslint/no-unused-vars */
import { GeneratePost } from './generate-post';
import { CheckError } from './check-error';
import { AutoDelete } from './auto-delete';
import { CheckAccount } from './check-account';
import { DailyAnalysis } from './daily-analysis';

const dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('アイドル一覧');
const diffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('取得差分');
const historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('履歴');

// ランダムアイドル紹介
function postUpdateStatus() {
  if (dataSheet !== null) {
    const generatePost = new GeneratePost(dataSheet);
    generatePost.selectIdol();
    generatePost.generateInfo();
    generatePost.postTweet();
    generatePost.followAccount();
  }
}

// エラーチェック
function checkError() {
  if (dataSheet !== null) {
    const checkError = new CheckError(dataSheet);
    checkError.checkDuplication();
    checkError.checkBlank();
  }
}

function autoDelete() {
  if (dataSheet !== null && historySheet !== null) {
    const autoDelete = new AutoDelete(dataSheet, historySheet);
    autoDelete.checkDelete();
  }
}

// アカウント生存監視
function checkAccount() {
  if (dataSheet !== null && historySheet !== null) {
    const checkAccount = new CheckAccount(dataSheet, historySheet);
    checkAccount.sortData();
    checkAccount.addLink();
    checkAccount.checkDeleteAccount();
    checkAccount.checkExistAccount();
  }
}

// アカウント情報取得、データ集計、ランキングツイート
function dailyAnalysis() {
  if (dataSheet !== null && diffSheet !== null) {
    const dailyAnalysis = new DailyAnalysis(dataSheet, diffSheet);
    dailyAnalysis.backupData();
    dailyAnalysis.sortData();
    dailyAnalysis.getAllInformation();
    dailyAnalysis.dailyAnalysis();
    dailyAnalysis.tweetRanking('tweet');
    dailyAnalysis.tweetRanking('follower');
  }
}
