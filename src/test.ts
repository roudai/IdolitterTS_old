/* eslint-disable @typescript-eslint/no-unused-vars */
import { Common } from './common';
import { DailyAnalysis } from './daily-analysis';

function nameGroupMatchTest() {
  const common = new Common();
  // 月に足跡を残した6人の少女達は一体何を見たのか…
  const tsukiato = '月に足跡を残した6人の少女達は一体何を見たのか…';
  console.log(common.nameGroupMatch('苗加結菜(月に足跡を残した6人の少女達は一体何を見たのか…)', tsukiato));
  console.log(common.nameGroupMatch('早﨑 優奈 ( 月に足跡を残した６人の少女達は一体何を見たのか… )', tsukiato));
  console.log(
    common.nameGroupMatch('夏目一花(月に足跡を残した6人の少女達は一体何を見たのか…)3/4生バンドライブ‼️', tsukiato)
  );
  console.log(common.nameGroupMatch('美南 れな(月に足跡を残した6人の少女達は一体何を見たのか…)', tsukiato));
  // Chick-flick
  const chick = 'Chick-flick';
  console.log(common.nameGroupMatch('白栖ゆうか 4/28㈮ 下北沢シャングリラ ワンマン🎪 @Chick-flick', chick));
  console.log(common.nameGroupMatch('環木あんず@Chick-flick 4/28下北沢シャングリラワンマン', chick));
  console.log(common.nameGroupMatch('陽向りな2/5生誕祭@Chick-flick', chick));
  console.log(common.nameGroupMatch('東雲みよ@Chick-flick', chick));
  console.log(common.nameGroupMatch('愛好こばとC101 土曜日東サ39b@Chick‐flick', chick));
  // のんふぃく！
  const nonfik = 'のんふぃく！';
  console.log(common.nameGroupMatch('水瀬ぴあの（のんふぃく！）', nonfik));
  console.log(common.nameGroupMatch('海まりん(のんふぃく)', nonfik));
  console.log(common.nameGroupMatch('永月十華（のんふぃく)', nonfik));
  console.log(common.nameGroupMatch('真白里帆（のんふぃく）', nonfik));
}

function AnomalyDatafixTest() {
  const dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('アイドル一覧');
  const diffSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('取得差分');
  if (dataSheet !== null && diffSheet !== null) {
    const dailyAnalysis = new DailyAnalysis(dataSheet, diffSheet, true);
    dailyAnalysis.sortData();
    dailyAnalysis.AnomalyDatafix();
  }
}
