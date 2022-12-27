import 'google-apps-script/google-apps-script.spreadsheet';
import { Common } from './common';
import './dayjs';

export class CheckAccount {
  private lastRow!: number;
  private common: Common = new Common();

  constructor(
    private dataSheet: GoogleAppsScript.Spreadsheet.Sheet,
    private historySheet: GoogleAppsScript.Spreadsheet.Sheet
  ) {}

  sortData() {
    // データ並び替え
    this.dataSheet.getRange(2, 1, this.dataSheet.getLastRow() - 1, this.dataSheet.getLastColumn()).sort([
      { column: 1, ascending: true },
      { column: 12, ascending: true },
    ]);
    this.lastRow = this.dataSheet.getLastRow();
    this.common.idFix(this.dataSheet, this.lastRow);
  }

  // TwitterIDにリンクを追加
  addLink() {
    const twitterID = this.dataSheet.getRange(2, 6, this.lastRow - 1, 1).getValues();
    twitterID.map((value: string[], i: number) => {
      if (value.indexOf('https://twitter.com/') !== 1) {
        twitterID[i][0] = '=HYPERLINK("https://twitter.com/' + value + '","' + value + '")';
      }
    });
    this.dataSheet.getRange(2, 6, this.lastRow - 1, 1).setValues(twitterID);
  }

  // フォーマットの設定、背景色リセット
  setFormat() {
    this.dataSheet.getRange(2, 13, this.lastRow, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
    this.dataSheet.getRange(2, 15, this.lastRow, 1).setNumberFormat('yyyy/MM/dd').setHorizontalAlignment('right');
    this.dataSheet.getRange(2, 1, this.lastRow, 15).setBackground(null);
  }

  // 削除アカウントのチェック
  checkDeleteAccount() {
    this.dataSheet.getRange(2, 14, this.lastRow, 1).getValues();
    const twitterStatus = this.dataSheet
      .getRange(2, 14, this.lastRow - 1, 1)
      .getValues()
      .flat();
    const twitterID = this.dataSheet
      .getRange(2, 6, this.lastRow - 1, 1)
      .getValues()
      .flat();

    twitterStatus.map((value: string, i: number) => {
      if (value !== '') {
        if (this.dataSheet.getRange(i + 2, 6).getValue() !== 'idol_itter' && this.getTwitterPass(twitterID[i])) {
          // アカウントが存在した場合、削除を取り消し
          this.dataSheet.getRange(i + 2, 14).setValue(null);
          this.dataSheet.getRange(i + 2, 1, 1, 15).setBackground(null);

          const response = client.UsersLookupUsernames([twitterID[i]]);
          const twitterName = this.common.nameReplace(response['data'][0]['name']);
          const group = this.common.nameReplace(this.dataSheet.getRange(i + 2, 1).getValue());
          const twitterSchedule = this.dataSheet.getRange(i + 2, 15).getValue();

          const history: string[] = [];
          history.push(
            group,
            twitterID[i],
            twitterName,
            twitterSchedule,
            '復活',
            dayjs.dayjs().format('YYYY/MM/DD HH:mm:ss')
          );
          this.historySheet.insertRowAfter(1);
          this.historySheet.getRange(2, 1, 1, 6).setValues([history]);

          if (this.common.nameGroupMatch(twitterName, group)) {
            client.postTweet('【アカウント復活】' + twitterName + ' ' + twitterID[i]);
          } else {
            client.postTweet('【アカウント復活】' + twitterName + ' (' + group + ') ' + twitterID[i]);
          }
        } else {
          // アカウントが存在しない場合、背景色を設定する
          this.dataSheet.getRange(i + 2, 1, 1, 15).setBackground('#00ffff');
        }
      }
    });
  }

  // アカウントの生存チェック
  checkExistAccount() {
    let newID: string[] = [];
    let getNum;

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
          this.getTwitterPass(
            this.dataSheet
              .getRange(i + 1, 6, getNum, 1)
              .getValues()
              .join()
          )
        ) {
          // 100件で成功した場合、次のループ
          continue;
        }
        // 100件で失敗した場合、10件ごとに取得
        for (let j = 0; j < 100; j = j + 10) {
          getNum = this.common.getNum_10(i, j, this.lastRow);
          if (
            this.getTwitterPass(
              this.dataSheet
                .getRange(i + j + 1, 6, getNum, 1)
                .getValues()
                .join()
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
            if (this.getTwitterPass(this.dataSheet.getRange(i + j + k + 1, 6).getValue())) {
              // 1件で成功した場合、次のループ
              continue;
            }
            if (this.dataSheet.getRange(i + j + k + 1, 14, 1, 1).getValue()) {
              // ツイート済みの場合、次のループ
              continue;
            }
            const twitterID = this.dataSheet.getRange(i + j + k + 1, 6, 1, 1).getValue();
            const twitterName = this.common.nameReplace(this.dataSheet.getRange(i + j + k + 1, 7, 1, 1).getValue());
            const group = this.common.nameReplace(this.dataSheet.getRange(i + j + k + 1, 1, 1, 1).getValue());
            const userID = this.dataSheet.getRange(i + j + k + 1, 12, 1, 1).getValue();
            const twitterSchedule = this.dataSheet.getRange(i + j + k + 1, 15, 1, 1).getValue();

            const history: string[] = [];

            if (userID) {
              if (this.getTwitterChange(userID, newID)) {
                history.push(
                  group,
                  twitterID,
                  twitterName,
                  twitterSchedule,
                  '変更',
                  dayjs.dayjs().format('YYYY/MM/DD HH:mm:ss')
                );
                if (this.common.nameGroupMatch(twitterName, group)) {
                  client.postTweet('【ユーザー名変更】' + twitterName + ' ' + twitterID + ' ⇒ ' + newID[0]);
                } else {
                  client.postTweet(
                    '【ユーザー名変更】' + twitterName + ' (' + group + ') ' + twitterID + ' ⇒ ' + newID[0]
                  );
                }
                this.dataSheet.getRange(i + j + k + 1, 6, 1, 1).setValue(newID[0]);
                newID = [];
              } else {
                history.push(
                  group,
                  twitterID,
                  twitterName,
                  twitterSchedule,
                  '削除',
                  dayjs.dayjs().format('YYYY/MM/DD HH:mm:ss')
                );
                if (this.common.nameGroupMatch(twitterName, group)) {
                  client.postTweet('【アカウント削除】' + twitterName + ' ' + twitterID);
                } else {
                  client.postTweet('【アカウント削除】' + twitterName + ' (' + group + ') ' + twitterID);
                }
                this.dataSheet.getRange(i + j + k + 1, 14, 1, 1).setValue('削除');
                this.dataSheet.getRange(i + j + k + 1, 1, 1, 15).setBackground('#00ffff');
              }
            } else {
              history.push(
                group,
                twitterID,
                twitterName,
                twitterSchedule,
                '不明',
                dayjs.dayjs().format('YYYY/MM/DD HH:mm:ss')
              );
              if (this.common.nameGroupMatch(twitterName, group)) {
                client.postTweet('【アカウント所在不明】' + twitterName + ' ' + twitterID);
              } else {
                client.postTweet('【アカウント所在不明】' + twitterName + ' (' + group + ') ' + twitterID);
              }
              this.dataSheet.getRange(i + j + k + 1, 14, 1, 1).setValue('不明');
              this.dataSheet.getRange(i + j + k + 1, 1, 1, 15).setBackground('#00ffff');
            }
            this.historySheet.insertRowAfter(1);
            this.historySheet.getRange(1, 1, 1, 6).setValues([history]);
          }
        }
      }
    } finally {
      // 置き換えたダミーアカウントを戻す
      this.common.idUndo(this.dataSheet, this.lastRow);
    }
  }

  private getTwitterPass(twitterIDs: string) {
    if (twitterIDs[0] === '') {
      return false;
    }
    const response = client.UsersLookupUsernames([twitterIDs]);
    if (response['errors']) {
      return false;
    }
    return true;
  }

  private getTwitterChange(userID: string, newID: string[]) {
    const response = client.UsersLookupId(userID);
    if (response['errors']) {
      return false;
    }
    newID.push(response['data']['username']);
    return true;
  }
}
