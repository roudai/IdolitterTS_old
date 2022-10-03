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
  const generatePost = new GeneratePost(dataSheet);
  generatePost.selectIdol();
  generatePost.generateInfo();
  generatePost.postTweet();
  generatePost.followAccount();
}

// エラーチェック
function checkError() {
  const checkError = new CheckError(dataSheet);
  checkError.checkDuplication();
  checkError.checkBlank();
}

function autoDelete() {
  const autoDelete = new AutoDelete(dataSheet, historySheet);
  autoDelete.checkDelete();
}

// アカウント生存監視
function checkAccount() {
  const checkAccount = new CheckAccount(dataSheet, historySheet);
  checkAccount.sortData();
  checkAccount.checkDeleteAccount();
  checkAccount.checkExistAccount();
}

// アカウント情報取得、データ集計、ランキングツイート
function dailyAnalysis() {
  const dailyAnalysis = new DailyAnalysis(dataSheet, diffSheet);
  dailyAnalysis.sortData();
  dailyAnalysis.getAllInformation();
  dailyAnalysis.dailyAnalysis();
  dailyAnalysis.tweetRanking('follower');
  dailyAnalysis.tweetRanking('tweet');
}
