// 認証用インスタンス
const client = TwitterClient.getInstance(
  PropertiesService.getScriptProperties().getProperty('consumer_key'),
  PropertiesService.getScriptProperties().getProperty('consumer_secret')
);

// 認証
function authorize() {
  client.authorize();
}

// 認証解除
function reset() {
  client.reset();
}

// 認証後のコールバック
function authCallback(request) {
  return client.authCallback(request);
}