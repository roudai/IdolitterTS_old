export class AutoDelete {
  private lastRow!: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private dataSheet: any, private historySheet: any) {
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
        // 卒業脱退予定日が今日より後
        if (deleteDay.isAfter(today)) {
          this.dataSheet.getRange(nowRow, 1, 1, 15).setBackground('#dcdcdc');
        }
        // 卒業脱退予定日が今日より前
        if (deleteDay.isBefore(today) || deleteDay.isSame(today)) {
          this.dataSheet.getRange(nowRow, 1, 1, 15).setBackground('#a9a9a9');
          if (this.dataSheet.getRange(nowRow, 14).getValue() === '削除') {
            this.deleteData(nowRow);
            shiftRow += 1;
          }
        }
        // 卒業脱退予定の14日後が今日より前
        if (deleteDay.add(14, 'day').isBefore(today)) {
          this.deleteData(nowRow);
          shiftRow += 1;
        }
      }
    });
  }

  private deleteData(deleteRow: number) {
    const history: string[] = [];
    const setValueRow: number = this.historySheet.getLastRow() + 1;
    const group = nameReplace(this.dataSheet.getRange(deleteRow, 1).getValue());
    const twitterID = this.dataSheet.getRange(deleteRow, 6).getValue();
    const twitterName = this.dataSheet.getRange(deleteRow, 7).getValue();

    this.dataSheet.deleteRow(deleteRow);
    history.push(group, twitterID, twitterName, '削除済', dayjs.dayjs().format('YYYY/MM/DD HH:mm:ss'));
    this.historySheet.getRange(setValueRow, 1, 1, 5).setValues([history]);
  }
}
