import 'google-apps-script/google-apps-script.spreadsheet';
import { Common } from './common';
import './dayjs';

export class AutoDelete {
  private lastRow!: number;
  private common: Common = new Common();

  constructor(
    private dataSheet: GoogleAppsScript.Spreadsheet.Sheet,
    private historySheet: GoogleAppsScript.Spreadsheet.Sheet
  ) {
    this.lastRow = this.dataSheet.getLastRow();
  }

  checkDelete() {
    const today = dayjs.dayjs();
    const deleteDays = this.dataSheet
      .getRange(2, 15, this.lastRow - 1, 1)
      .getValues()
      .flat();

    let shiftRow = 0;
    deleteDays.map((value: string, i: number) => {
      if (value !== '') {
        const deleteDay = dayjs.dayjs(value);
        const nowRow = i + 2 - shiftRow;
        Logger.log(
          nowRow +
            ' ' +
            this.dataSheet.getRange(nowRow, 6).getValue() +
            ' : 削除日 ' +
            dayjs.dayjs(deleteDay).format('YYYY-MM-DD') +
            ' 今日 ' +
            dayjs.dayjs(today).format('YYYY-MM-DD')
        );
        // 卒業脱退予定日が今日より後
        if (deleteDay.isAfter(today)) {
          Logger.log('卒業脱退前');
          this.dataSheet.getRange(nowRow, 1, 1, 15).setBackground('#dcdcdc');
        }
        // 卒業脱退予定の14日後が今日より前
        else if (deleteDay.add(14, 'day').isBefore(today)) {
          Logger.log('卒業後削除猶予経過');
          this.deleteData(nowRow);
          shiftRow += 1;
        }
        // 卒業脱退予定日が今日より前
        else if (deleteDay.isBefore(today) || deleteDay.isSame(today)) {
          Logger.log('卒業脱退済');
          this.dataSheet.getRange(nowRow, 1, 1, 15).setBackground('#a9a9a9');
          if (this.dataSheet.getRange(nowRow, 14).getValue() === '削除') {
            Logger.log('卒業済削済削除');
            this.deleteData(nowRow);
            shiftRow += 1;
          }
        }
      }
    });
  }

  private deleteData(deleteRow: number) {
    const history: string[] = [];
    const setValueRow: number = this.historySheet.getLastRow() + 1;
    const group = this.common.nameReplace(this.dataSheet.getRange(deleteRow, 1).getValue());
    const twitterID = this.dataSheet.getRange(deleteRow, 6).getValue();
    const twitterName = this.dataSheet.getRange(deleteRow, 7).getValue();

    this.dataSheet.deleteRow(deleteRow);
    history.push(group, twitterID, twitterName, '削除済', dayjs.dayjs().format('YYYY/MM/DD HH:mm:ss'));
    this.historySheet.getRange(setValueRow, 1, 1, 5).setValues([history]);
  }
}
