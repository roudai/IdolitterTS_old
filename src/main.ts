import { CheckAccount } from "./check-account";
import { DailyAnalysis } from "./daily-analysis";
import { GeneratePost } from "./generate-post"

const dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("アイドル一覧");
const diffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('取得差分');

// ランダムアイドル紹介
function postUpdateStatus() {
    let generatePost = new GeneratePost(dataSheet);
    generatePost.selectIdol();
    generatePost.generateInfo();
    generatePost.postTweet();
    generatePost.followAccount();
}

// アカウント生存監視
function checkAccount() {
    let checkAccount = new CheckAccount(dataSheet);
    checkAccount.sortData();
    checkAccount.checkDeleteAccount();
    checkAccount.checkExistAccount();
}

// アカウント情報取得、データ集計、ランキングツイート
function dailyAnalysis() {
    let dailyAnalysis = new DailyAnalysis(dataSheet, diffSheet);
    let checkAccount = new CheckAccount(dataSheet);
    checkAccount.sortData();
    checkAccount.checkDeleteAccount();
    dailyAnalysis.sortData();
    dailyAnalysis.getAllInformation();
    dailyAnalysis.dailyAnalysis();
    dailyAnalysis.tweetRanking("follower");
    dailyAnalysis.tweetRanking("tweet")
}