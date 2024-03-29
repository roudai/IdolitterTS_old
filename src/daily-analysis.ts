import 'google-apps-script/google-apps-script.spreadsheet';
import { Common } from './common';
import './dayjs';

export class DailyAnalysis {
  private lastRow!: number;
  private diffLastRow!: number;
  private common: Common = new Common();

  constructor(
    private dataSheet: GoogleAppsScript.Spreadsheet.Sheet,
    private diffSheet: GoogleAppsScript.Spreadsheet.Sheet,
    private diffFlag: boolean
  ) {}

  backupData() {
    this.diffSheet.getRange('W1').setValue('集計中');
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const trashSheet = sheet.getSheetByName('アイドル一覧_' + dayjs.dayjs().subtract(1, 'day').format('YYYYMMDD'));
    const copySheet = sheet.getSheetByName('アイドル一覧_' + dayjs.dayjs().format('YYYYMMDD'));
    if (trashSheet !== null) {
      sheet.deleteSheet(trashSheet);
    }
    if (copySheet !== null) {
      sheet.deleteSheet(copySheet);
    }
    this.dataSheet.copyTo(sheet).setName('アイドル一覧_' + dayjs.dayjs().format('YYYYMMDD'));
  }

  sortData() {
    // データ並び替え
    this.dataSheet.getRange(2, 1, this.dataSheet.getLastRow() - 1, this.dataSheet.getLastColumn()).sort([
      { column: 1, ascending: true },
      { column: 12, ascending: true },
    ]);
    this.lastRow = this.dataSheet.getLastRow();
    this.diffLastRow = this.diffSheet.getLastRow();
    this.common.idFix(this.dataSheet, this.lastRow);
  }

  getAllInformation() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twitterInfo: any[] = [];
    let getNum: number;

    this.common.idBackup(this.dataSheet, this.lastRow);

    try {
      // 100件ごとにTwitter情報取得
      for (let i = 1; i <= this.lastRow; i = i + 100) {
        // 100の倍数件データがある場合異常終了するための対応
        if (i == this.lastRow) {
          break;
        }
        getNum = this.common.getNum_100(i, this.lastRow);
        if (
          this.getTwitterInformation(
            twitterInfo,
            this.dataSheet
              .getRange(i + 1, 6, getNum, 1)
              .getValues()
              .join(),
            getNum
          )
        ) {
          // 100件で成功した場合、次のループ
          continue;
        }
        // 100件で失敗した場合、10件ごとに取得
        for (let j = 0; j < 100; j = j + 10) {
          getNum = this.common.getNum_10(i, j, this.lastRow);
          if (
            this.getTwitterInformation(
              twitterInfo,
              this.dataSheet
                .getRange(i + j + 1, 6, getNum, 1)
                .getValues()
                .join(),
              getNum
            )
          ) {
            // 10件未満の場合最後なのでここで終了、10件で成功した場合、次のループ
            if (getNum < 10) {
              break;
            } else {
              continue;
            }
          }
          // 10件で失敗した場合、1件ずつ取得
          for (let k = 0; k < 10; k = k + 1) {
            if (this.getTwitterInformation(twitterInfo, this.dataSheet.getRange(i + j + k + 1, 6).getValue(), 1)) {
              // 1件で成功した場合、次のループ
              continue;
            }
            // 1件で失敗した場合、nullをプッシュ、ログ出力
            twitterInfo.push([null, null, null, null, null, null, null]);
            this.dataSheet.getRange(i + j + k + 1, 1, 1, 14).setBackground('#00ffff');
            const pastTwitterID = this.dataSheet.getRange(i + j + k + 1, 6).getValue();
            Logger.log('No.' + (i + j + k + 1) + ' ' + pastTwitterID);
          }
        }
      }
    } finally {
      this.common.idUndo(this.dataSheet, this.lastRow);
    }

    // 現データコピー
    if (this.diffFlag === true && this.dataSheet.getRange(2, 7).getValue() != '') {
      this.dataSheet.getRange('A:A').copyTo(this.diffSheet.getRange('A:A'));
      this.dataSheet.getRange('F:I').copyTo(this.diffSheet.getRange('B:E'));
      this.diffSheet.getRange('A1:E1').setBackground('#adff2f');
    }

    // 現データ削除
    if (this.dataSheet.getFilter()) {
      this.dataSheet.getFilter()?.remove();
    }
    this.dataSheet.getRange(2, 7, this.lastRow - 1, 7).clearContent();

    // 全データ貼り付け
    this.dataSheet.getRange(2, 7, this.lastRow - 1, 7).setValues(twitterInfo);

    // ダミー情報の削除
    const dummyID = this.dataSheet.getRange(2, 7, this.lastRow, 1).getValues().flat();
    dummyID.map((value: string, i: number) => {
      if (value === 'アイドリッター') {
        this.dataSheet.getRange(i + 2, 7, 1, 7).clearContent();
      }
    });

    // フィルター作成
    this.dataSheet.getRange(1, 1, this.lastRow, 15).createFilter();
  }

  private getTwitterInformation(twitterInfo: unknown[], twitterIDs: string, num: number) {
    const response = client.UsersLookupUsernames([twitterIDs], null, 'public_metrics,description,verified,protected');
    if (response['errors']) {
      return false;
    }

    for (let i = 0; i < num; i++) {
      const name = response['data'][i]['name'].replace(/[\r\n]+/g, ' ');
      const followers_count = response['data'][i]['public_metrics']['followers_count'];
      const tweet_count = response['data'][i]['public_metrics']['tweet_count'];
      let verified = response['data'][i]['verified'];
      let tweet_protected = response['data'][i]['protected'];
      const id = response['data'][i]['id'];
      const description = response['data'][i]['description'].replace(/[\r\n]+/g, ' ');
      if (verified) {
        verified = '認証';
      } else {
        verified = '';
      }
      if (tweet_protected) {
        tweet_protected = '非公開';
      } else {
        tweet_protected = '';
      }
      twitterInfo.push([name, followers_count, tweet_count, verified, tweet_protected, id, description]);
    }
    return true;
  }

  dailyAnalysis() {
    // データ集計-グループ
    const groupSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('データ集計-グループ');
    groupSheet
      ?.getRange('A1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select A,avg(H),count(A) group by A order by avg(H) desc label A 'グループ名',avg(H) '平均フォロワー数',count(A) 'メンバー数' format avg(H) '#'\")"
      );
    groupSheet
      ?.getRange('E1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select A,max(H)/min(H),count(A) group by A order by max(H)/min(H) desc label A 'グループ名',max(H)/min(H) 'フォロワー数最大/最小',count(A) 'メンバー数' format max(H)/min(H) '#.00'\")"
      );
    groupSheet
      ?.getRange('I1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select A,avg(I),count(A) group by A order by avg(I) desc label A 'グループ名',avg(I) '平均ツイート数',count(A) 'メンバー数' format avg(I) '#'\")"
      );
    groupSheet?.getRangeList(['A1:C1', 'E1:G1', 'I1:K1']).setBackground('#ffd700');
    groupSheet?.getRangeList(['A1:C1', 'E1:G1', 'I1:K1']).setFontWeight('bold');

    // データ集計-個人
    const personSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('データ集計-個人');
    personSheet
      ?.getRange('A1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select B,count(B) group by B order by count(B) desc limit 30 label B '名字', count(B) '人数'\")"
      );
    personSheet
      ?.getRange('D1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select C,count(C) group by C order by count(C) desc limit 30 label C '名前', count(C) '人数'\")"
      );
    personSheet
      ?.getRange('G1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select D,count(D) group by D order by count(D) desc limit 30 label D '名字読み', count(D) '人数'\")"
      );
    personSheet
      ?.getRange('J1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select E,count(E) group by E order by count(E) desc limit 30 label E '名前読み', count(E) '人数'\")"
      );
    personSheet
      ?.getRange('M1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select A,G,F,H order by H desc limit 100 label A 'グループ名',G '名前',F 'Twitter ID',H 'フォロワー数'\")"
      );
    personSheet
      ?.getRange('R1')
      .setValue(
        "=query('アイドル一覧'!$A$1:$K$" +
          this.lastRow +
          ",\"select A,G,F,I order by I desc limit 100 label A 'グループ名',G '名前',F 'Twitter ID',I 'ツイート数'\")"
      );
    personSheet?.getRangeList(['A1:B1', 'D1:E1', 'G1:H1', 'J1:K1', 'M1:P1', 'R1:U1']).setBackground('#ffd700');
    personSheet?.getRangeList(['A1:B1', 'D1:E1', 'G1:H1', 'J1:K1', 'M1:P1', 'R1:U1']).setFontWeight('bold');

    // 取得差分
    this.dataSheet.getRange('H:I').copyTo(this.diffSheet.getRange('F:G'));
    // 異常データ修正
    this.AnomalyDatafix();
    this.diffSheet
      .getRange('I1')
      .setValue(
        '=query($A$1:$G$' +
          this.lastRow +
          ",\"select A,B,C,D,F,F-D order by F-D desc label D '前フォロワー数', F '後フォロワー数', F-D 'フォロワー増減'\")"
      );
    this.diffSheet
      .getRange('P1')
      .setValue(
        '=query($A$1:$G$' +
          this.lastRow +
          ",\"select A,B,C,E,G,G-E order by G-E desc label E '前ツイート数', G '後ツイート数', G-E 'ツイート増減'\")"
      );
    this.diffSheet.getRangeList(['I1:N1', 'P1:U1']).setBackground('#ffd700');
    this.diffSheet.getRangeList(['I1:N1', 'P1:U1']).setFontWeight('bold');
    this.diffSheet.getRange('W1').setValue('完了');
  }

  tweetRankingPage() {
    const today =
      dayjs.dayjs().subtract(1, 'day').format('M月D日') +
      '（' +
      dayjs.dayjs().subtract(1, 'day').locale('ja').format('dd') +
      '）';
    client.postTweet(today + ' フォロワー増加数・ツイート数ランキング https://idolitter.net/ranking/');
  }

  tweetRanking(type: string) {
    const today =
      dayjs.dayjs().subtract(1, 'day').format('M月D日') +
      '（' +
      dayjs.dayjs().subtract(1, 'day').locale('ja').format('dd') +
      '）';

    let title = '';
    let group: string[] = [];
    let twitterId: string[] = [];
    let name: string[] = [];
    let before: number[] = [];
    let after: number[] = [];
    let increase: string[] = [];
    if (type == 'follower') {
      title = '【' + today + 'フォロワー増加数ランキング】' + '\n';
      group = this.diffSheet.getRange('I2:I30').getValues().flat();
      twitterId = this.diffSheet.getRange('J2:J30').getValues().flat();
      name = this.diffSheet.getRange('K2:K30').getValues().flat();
      before = this.diffSheet.getRange('L2:L30').getValues().flat();
      after = this.diffSheet.getRange('M2:M30').getValues().flat();
      increase = this.diffSheet.getRange('N2:N30').getValues().flat();
    } else if (type == 'tweet') {
      title = '【' + today + 'ツイート数ランキング】' + '\n';
      group = this.diffSheet.getRange('P2:P30').getValues().flat();
      name = this.diffSheet.getRange('R2:R30').getValues().flat();
      before = this.diffSheet.getRange('S2:S30').getValues().flat();
      after = this.diffSheet.getRange('T2:T30').getValues().flat();
      increase = this.diffSheet.getRange('U2:U30').getValues().flat();
    }

    let topFollowerId = '';
    let tweetId = '';
    let response = [];
    let tweet = '';
    let rename = '';
    let regroup = '';
    let reincrease = '';
    let nextRankTweet = '';
    let rank = 1;
    let rankup = 0;
    for (let i = 0; i < increase.length; i++) {
      // 10位まで終わったら終了
      if (rank > 10) {
        break;
      }
      // 増加率が3倍以上の場合、イレギュラーデータとしてスキップ
      if (before[i] === 0 || after[i] / before[i] >= 3) {
        continue;
      }

      if (tweet === '') {
        tweet = title;
      }
      rename = this.common.nameReplace(String(name[i]));
      regroup = this.common.nameReplace(String(group[i]));
      if (topFollowerId === '') {
        topFollowerId = twitterId[i];
      }
      if (type === 'follower') {
        reincrease = increase[i] + '人';
      } else if (type === 'tweet') {
        reincrease = increase[i];
      }

      if (this.common.nameGroupMatch(name[i], group[i])) {
        nextRankTweet = rank + '位 ' + reincrease + ' ' + rename + '\n';
      } else {
        nextRankTweet = rank + '位 ' + reincrease + ' ' + rename + ' (' + regroup + ')' + '\n';
      }

      if (tweet.length + nextRankTweet.length <= 140) {
        // ツイート文字数が140文字以下の場合は次のランクに進む
        tweet = tweet + nextRankTweet;
      } else {
        // ツイート文字数が140文字を超えたら、次のランクを追加せずツイートする
        if (tweetId === '') {
          response = client.postTweet(tweet);
        } else {
          response = client.postTweet(tweet, tweetId);
        }
        tweetId = response['data']['id'];
        tweet = title + nextRankTweet;
      }
      nextRankTweet = '';

      if (increase[i] === increase[i + 1]) {
        rankup = rankup + 1;
      } else {
        rank = rank + rankup + 1;
        rankup = 0;
      }
    }
    client.postTweet(tweet, tweetId);

    if (type === 'follower') {
      this.rankRetweet(topFollowerId);
    }
  }

  rankRetweet(twitterID: string) {
    let id = '';
    let tweetId: string;
    let retweet_count: number;
    let like_count: number;
    let quote_count: number;
    let buzz_tweetId = '';
    let buzz_count = 0;
    let max_buzz = 0;
    const start_time = dayjs.dayjs().subtract(2, 'day').format('YYYY-MM-DDTHH:mm:ssZ');

    const AlltwitterID = this.dataSheet
      .getRange(2, 6, this.lastRow - 1, 1)
      .getValues()
      .flat();
    AlltwitterID.map((value: string, i: number) => {
      if (value === twitterID) {
        id = this.dataSheet.getRange(i + 2, 12).getValue();
      }
    });
    // 過去48時間のツイートを最大100件取得する
    const response = client.getTimeLine(id, 100, false, start_time);

    for (let i = 0; i <= response['tweet'].length - 1; i = i + 1) {
      tweetId = response['tweet'][i][0];
      retweet_count = response['tweet'][i][2];
      like_count = response['tweet'][i][3];
      quote_count = response['tweet'][i][4];
      buzz_count = retweet_count + like_count + quote_count;
      if (buzz_count > max_buzz) {
        buzz_tweetId = tweetId;
        max_buzz = buzz_count;
      }
    }

    // リツイート数＋ライク数＋引用リツイートが一番多いツイートをリツイートする。ただし100未満の場合は何もしない。
    if (max_buzz >= 100) {
      client.createRetweet(PropertiesService.getScriptProperties().getProperty('twitterid'), buzz_tweetId);
    }
  }

  AnomalyDatafix() {
    const oldFollower: string[][] = this.diffSheet.getRange(1, 4, this.diffLastRow - 1, 1).getValues();
    const newFollower: string[][] = this.diffSheet.getRange(1, 6, this.diffLastRow - 1, 1).getValues();
    const TwitterIdList: string[][] = this.dataSheet.getRange(1, 6, this.lastRow - 1, 1).getValues();

    for (let i = 1; i < this.diffLastRow - 1; i = i + 1) {
      if (newFollower[i][0] === '' || oldFollower[i][0] === '') continue;
      if (Number(newFollower[i][0]) / Number(oldFollower[i][0]) <= 0.9) {
        // フォロワーが1割以上減った場合、旧フォロワー数に書き換える
        const TwitterID = this.diffSheet.getRange(i + 1, 2).getValue();
        console.log(TwitterID, oldFollower[i], newFollower[i]);
        this.diffSheet.getRange(i + 1, 6).setValue(this.diffSheet.getRange(i + 1, 4).getValue());

        for (let j = 1; j < this.lastRow - 1; j = j + 1) {
          if (TwitterID === TwitterIdList[j][0]) {
            // アイドル一覧シートの値を書き換える
            this.dataSheet.getRange(j + 1, 8).setValue(this.diffSheet.getRange(i + 1, 4).getValue());
          }
        }
      }
    }
  }
}
