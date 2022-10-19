import 'google-apps-script/google-apps-script.spreadsheet';
import { Common } from './common';

export class GeneratePost {
  private group!: string;
  private twitterID!: string;
  private userID!: string;
  private message!: string;
  private common: Common = new Common();

  constructor(private dataSheet: GoogleAppsScript.Spreadsheet.Sheet) {}

  // アイドルを抽出する
  selectIdol() {
    const rand = Math.floor(Math.random() * (this.dataSheet?.getLastRow() - 1) + 2);

    this.group = this.common.nameReplace(this.dataSheet?.getRange(rand, 1).getValue());
    this.twitterID = this.dataSheet?.getRange(rand, 6).getValue();
  }

  // 対象TwitterIDの抽出、ツイート内容を作る
  generateInfo() {
    const response = client.UsersLookupUsernames([this.twitterID], 'pinned_tweet_id');

    this.userID = response['data'][0]['id'];
    const name = this.common.nameReplace(response['data'][0]['name']);
    const pinned_tweet_id = response['data'][0]['pinned_tweet_id'];

    let tweet;
    if (pinned_tweet_id) {
      // 固定ツイート
      tweet = 'https://twitter.com/' + this.twitterID + '/status/' + pinned_tweet_id;
    } else {
      // 固定ツイートがない場合、最新ツイート
      const response = client.getTimeLine(this.userID, 100, false);
      tweet = 'https://twitter.com/' + this.twitterID + '/status/' + response['tweet'][0][0];
    }
    if (this.common.nameGroupMatch(name, this.group)) {
      // 名前にグループ名が含まれる場合はグループ名は重ねてツイートしない
      this.message = name + ' ' + tweet;
    } else {
      this.message = name + ' | ' + this.group + ' ' + tweet;
    }
  }

  postTweet() {
    client.postTweet(this.message);
  }

  followAccount() {
    client.createFollow(PropertiesService.getScriptProperties().getProperty('twitterid'), [this.userID]);
  }
}
