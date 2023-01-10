import 'google-apps-script/google-apps-script.spreadsheet';
import { Common } from './common';
import './dayjs';

export class CheckGroup {
  private lastRow!: number;
  private common: Common = new Common();

  constructor(private groupSheet: GoogleAppsScript.Spreadsheet.Sheet) {}

  sortData() {
    // データ並び替え
    this.groupSheet.getRange(2, 1, this.groupSheet.getLastRow() - 1, this.groupSheet.getLastColumn()).sort([
      { column: 1, ascending: true },
      { column: 12, ascending: true },
    ]);
    this.lastRow = this.groupSheet.getLastRow();
    this.common.idFix(this.groupSheet, this.lastRow);
  }

  getAllInformation() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const twitterInfo: any[] = [];
    let getNum: number;

    this.common.idBackup(this.groupSheet, this.lastRow);

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
            this.groupSheet
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
              this.groupSheet
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
            if (this.getTwitterInformation(twitterInfo, this.groupSheet.getRange(i + j + k + 1, 6).getValue(), 1)) {
              // 1件で成功した場合、次のループ
              continue;
            }
            // 1件で失敗した場合、nullをプッシュ、ログ出力
            twitterInfo.push([null, null, null, null, null, null, null]);
            this.groupSheet.getRange(i + j + k + 1, 1, 1, 14).setBackground('#00ffff');
            const pastTwitterID = this.groupSheet.getRange(i + j + k + 1, 6).getValue();
            Logger.log('No.' + (i + j + k + 1) + ' ' + pastTwitterID);
          }
        }
      }
    } finally {
      this.common.idUndo(this.groupSheet, this.lastRow);
    }

    // 現データ削除
    if (this.groupSheet.getFilter()) {
      this.groupSheet.getFilter()?.remove();
    }
    this.groupSheet.getRange(2, 7, this.lastRow - 1, 7).clearContent();

    // 全データ貼り付け
    this.groupSheet.getRange(2, 7, this.lastRow - 1, 7).setValues(twitterInfo);

    // ダミー情報の削除
    const dummyID = this.groupSheet.getRange(2, 7, this.lastRow, 1).getValues().flat();
    dummyID.map((value: string, i: number) => {
      if (value === 'Idolitter') {
        this.groupSheet.getRange(i + 2, 7, 1, 7).clearContent();
      }
    });

    // フィルター作成
    this.groupSheet.getRange(1, 1, this.lastRow, 15).createFilter();
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
}
