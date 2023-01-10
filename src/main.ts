/* eslint-disable @typescript-eslint/no-unused-vars */
import { GeneratePost } from './generate-post';
import { CheckError } from './check-error';
import { AutoDelete } from './auto-delete';
import { CheckAccount } from './check-account';
import { DailyAnalysis } from './daily-analysis';
import { CheckGroup } from './check-group';

const dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('アイドル一覧');
const groupSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('グループ一覧');
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

// アカウント生存監視
function checkAccount() {
  if (dataSheet !== null && historySheet !== null) {
    const checkAccount = new CheckAccount(dataSheet, historySheet);
    checkAccount.sortData();
    checkAccount.addLink();
    checkAccount.setFormat();
    checkAccount.checkDeleteAccount();
    checkAccount.checkExistAccount();

    const autoDelete = new AutoDelete(dataSheet, historySheet);
    autoDelete.checkDelete();
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

function checkGroup() {
  if (groupSheet !== null) {
    const checkGroup = new CheckGroup(groupSheet);
    checkGroup.sortData();
    checkGroup.getAllInformation();
  }
}
