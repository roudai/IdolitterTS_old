import 'google-apps-script/google-apps-script.spreadsheet';

export class Common {
  nameGroupMatch(name: string, group: string) {
    name = String(name);
    group = String(group);
    if (
      name.replace(/\s/g, '').includes(group.replace(/\s/g, '')) ||
      this.replaceFullToHalf(name).includes(this.replaceFullToHalf(group)) ||
      name.replace('たち', '達').replace('...', '…').includes(group)
    ) {
      return true;
    }
    return false;
  }

  nameReplace(name: string) {
    return this.replaceFullToHalf(name).replace('@', '@\u200B').replace('.', '.\u200B');
  }

  // 全角→半角(英数字)
  replaceFullToHalf(str: string) {
    return str.replace(/[！-～]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
    });
  }

  getNum_100(i: number, lastRow: number) {
    if (lastRow - i - 1 >= 100 || lastRow % 100 == 1) {
      return 100;
    } else if (lastRow % 100 == 0) {
      return 99;
    } else {
      return (lastRow % 100) - 1;
    }
  }

  getNum_10(i: number, j: number, lastRow: number) {
    if (lastRow - i - j >= 10 || lastRow % 10 == 1) {
      return 10;
    } else if (lastRow % 10 == 0) {
      return 9;
    } else {
      return (lastRow % 10) - 1;
    }
  }

  idFix(dataSheet: GoogleAppsScript.Spreadsheet.Sheet, lastRow: number) {
    const id: string[][] = dataSheet.getRange(2, 6, lastRow - 1, 1).getValues();
    for (let i = 0; i < id.length; i++) {
      id[i][0] = id[i][0].replace(/[\s\t\n -/:-@[-^`{-~]/g, '');
    }
    dataSheet.getRange(2, 6, lastRow - 1).setValues(id);
  }

  idBackup(dataSheet: GoogleAppsScript.Spreadsheet.Sheet, lastRow: number) {
    // 削除アカウントを一旦ダミーアカウントに置き換え
    const twitterStatus: string[][] = dataSheet.getRange(2, 14, lastRow, 1).getValues();
    for (let i = 0; i < lastRow; i = i + 1) {
      if (twitterStatus[i][0] !== '') {
        const id = dataSheet.getRange(i + 2, 6).getValue();
        dataSheet.getRange(i + 2, 16).setValue(id);
        dataSheet.getRange(i + 2, 6).setValue('idol_itter');
      }
    }
  }

  idUndo(dataSheet: GoogleAppsScript.Spreadsheet.Sheet, lastRow: number) {
    // 置き換えたダミーアカウントを戻す
    const dummyID: string[][] = dataSheet.getRange(2, 16, lastRow, 1).getValues();
    for (let i = 0; i < lastRow; i = i + 1) {
      if (dummyID[i][0] != '') {
        const id = dataSheet.getRange(i + 2, 16).getValue();
        dataSheet.getRange(i + 2, 6).setValue(id);
        dataSheet.getRange(i + 2, 16).setValue(null);
      }
    }
  }
}
