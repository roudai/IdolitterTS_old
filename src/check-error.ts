import 'google-apps-script/google-apps-script.spreadsheet';

export class CheckError {
  private lastRow!: number;
  private recipient: string;
  private subject: string;

  constructor(private dataSheet: GoogleAppsScript.Spreadsheet.Sheet) {
    this.lastRow = this.dataSheet.getLastRow();
    this.recipient = String(PropertiesService.getScriptProperties().getProperty('email'));
    this.subject = 'アイドリッターエラー通知';
  }

  checkDuplication() {
    const twitterID = this.dataSheet
      .getRange(2, 6, this.lastRow - 1, 1)
      .getValues()
      .flat();

    const idDeplication = twitterID.filter((val: string, i: number) => {
      return !(twitterID.indexOf(val) === i);
    });
    if (idDeplication.length !== 0) {
      Logger.log('TwitterID重複');
      if (this.recipient !== null) {
        MailApp.sendEmail(this.recipient, this.subject, 'TwitterID重複：' + idDeplication);
      } else {
        console.error('TwitterID重複：' + idDeplication);
      }
    }
  }

  checkBlank() {
    const group = this.dataSheet
      .getRange(2, 1, this.lastRow - 1, 1)
      .getValues()
      .flat();
    const name = this.dataSheet
      .getRange(2, 3, this.lastRow - 1, 1)
      .getValues()
      .flat();
    const nameyomi = this.dataSheet
      .getRange(2, 5, this.lastRow - 1, 1)
      .getValues()
      .flat();
    const twitterID = this.dataSheet
      .getRange(2, 6, this.lastRow - 1, 1)
      .getValues()
      .flat();

    if (group.length !== group.filter(Boolean).length) {
      Logger.log('グループ名空白あり');
      MailApp.sendEmail(this.recipient, this.subject, 'グループ名空白あり');
    }
    if (name.length !== name.filter(Boolean).length) {
      Logger.log('名前空白あり');
      MailApp.sendEmail(this.recipient, this.subject, '名前空白あり');
    }
    if (nameyomi.length !== nameyomi.filter(Boolean).length) {
      Logger.log('名前読み空白あり');
      MailApp.sendEmail(this.recipient, this.subject, '名前読み空白あり');
    }
    if (twitterID.length !== twitterID.filter(Boolean).length) {
      Logger.log('TwitterID空白あり');
      MailApp.sendEmail(this.recipient, this.subject, 'TwitterID空白あり');
    }
  }
}
