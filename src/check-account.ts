export class CheckAccount {
  private lastRow!: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private dataSheet: any) {}

  sortData() {
    // データ並び替え
    this.dataSheet
      .getRange(2, 1, this.dataSheet.getLastRow() - 1, this.dataSheet.getLastColumn())
      .sort([
        { column: 1, ascending: true },
        { column: 12, ascending: true },
      ]);
    this.lastRow = this.dataSheet.getLastRow();
    idFix(this.dataSheet, this.lastRow);
  }

  // 削除アカウントのチェック
  checkDeleteAccount() {
    this.dataSheet.getRange(2, 14, this.lastRow, 1).getValues();
    const twitterStatus = this.dataSheet.getRange(2, 14, this.lastRow, 1).getValues();
    const twitterID = this.dataSheet.getRange(2, 6, this.lastRow, 1).getValues();

    for (let i = 0; i < this.lastRow; i = i + 1) {
      if (twitterStatus[i] != '') {
        Logger.log(twitterID[i]);
        if (this.getTwitterPass(String(twitterID[i]))) {
          // アカウントが存在した場合、削除を取り消し
          this.dataSheet.getRange(i + 2, 14).setValue(null);
          this.dataSheet.getRange(i + 2, 1, 1, 14).setBackground(null);

          const response = client.UsersLookupUsernames([twitterID[i]]);
          const twitterName = nameReplace(response['data'][0]['name']);
          const group = nameReplace(this.dataSheet.getRange(i + 2, 1).getValue());

          if (nameGroupMatch(twitterName, group)) {
            client.postTweet('【アカウント復活】' + twitterName + ' ' + twitterID[i]);
          } else {
            client.postTweet(
              '【アカウント復活】' + twitterName + ' (' + group + ') ' + twitterID[i]
            );
          }
        }
      }
    }
  }

  // アカウントの生存チェック
  checkExistAccount() {
    let newID: string[] = [];
    let getNum;

    idBackup(this.dataSheet, this.lastRow);

    try {
      // 100件ごとにTwitter情報取得
      for (let i = 1; i <= this.lastRow; i = i + 100) {
        // 100の倍数件データがある場合異常終了するための対応
        if (i == this.lastRow) {
          break;
        }
        getNum = getNum_100(i, this.lastRow);
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
          getNum = getNum_10(i, j, this.lastRow);
          if (
            this.getTwitterPass(
              this.dataSheet
                .getRange(i + j + 1, 6, getNum, 1)
                .getValues()
                .join()
            )
          ) {
            // 10件で成功した場合、次のループ
            continue;
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
            const twitterName = nameReplace(
              this.dataSheet.getRange(i + j + k + 1, 7, 1, 1).getValue()
            );
            const group = nameReplace(this.dataSheet.getRange(i + j + k + 1, 1, 1, 1).getValue());
            const userID = this.dataSheet.getRange(i + j + k + 1, 12, 1, 1).getValue();
            if (userID) {
              if (this.getTwitterChange(userID, newID)) {
                if (nameGroupMatch(twitterName, group)) {
                  client.postTweet(
                    '【ユーザー名変更】' + twitterName + ' ' + twitterID + ' ⇒ ' + newID[0]
                  );
                } else {
                  client.postTweet(
                    '【ユーザー名変更】' +
                      twitterName +
                      ' (' +
                      group +
                      ') ' +
                      twitterID +
                      ' ⇒ ' +
                      newID[0]
                  );
                }
                this.dataSheet.getRange(i + j + k + 1, 6, 1, 1).setValue(newID[0]);
                newID = [];
              } else {
                if (nameGroupMatch(twitterName, group)) {
                  client.postTweet('【アカウント削除】' + twitterName + ' ' + twitterID);
                } else {
                  client.postTweet(
                    '【アカウント削除】' + twitterName + ' (' + group + ') ' + twitterID
                  );
                }
                this.dataSheet.getRange(i + j + k + 1, 14, 1, 1).setValue('削除');
                this.dataSheet.getRange(i + j + k + 1, 1, 1, 14).setBackground('#00ffff');
              }
            } else {
              if (nameGroupMatch(twitterName, group)) {
                client.postTweet('【アカウント所在不明】' + twitterName + ' ' + twitterID);
              } else {
                client.postTweet(
                  '【アカウント所在不明】' + twitterName + ' (' + group + ') ' + twitterID
                );
              }
              this.dataSheet.getRange(i + j + k + 1, 14, 1, 1).setValue('不明');
              this.dataSheet.getRange(i + j + k + 1, 1, 1, 14).setBackground('#00ffff');
            }
          }
        }
      }
    } finally {
      // 置き換えたダミーアカウントを戻す
      idUndo(this.dataSheet, this.lastRow);
    }
  }

  private getTwitterPass(twitterIDs: string) {
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
