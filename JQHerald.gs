/**     A  S I M P L E   T W I T T E R   B O T           **/
/**     =======================================          **/
/**     Written by Amit Agarwal @labnol on 03/08/2013    **/
/**     Tutorial link: http://www.labnol.org/?p=27902    **/
/**     Live demo at http://twitter.com/DearAssistant    **/

function start() {
  // REPLACE THESE DUMMY VALUES
  var TWITTER_CONSUMER_KEY     = "AAAA";
  var TWITTER_CONSUMER_SECRET  = "BBBB";
  var TWITTER_HANDLE           = "CCCC";
  var WOLFRAM_API_ID           = "DDDD";
  
  // DO NOT CHANGE ANYTHING BELOW THIS LINE
  // Store variables
  ScriptProperties.setProperty("TWITTER_CONSUMER_KEY",    TWITTER_CONSUMER_KEY);
  ScriptProperties.setProperty("TWITTER_CONSUMER_SECRET", TWITTER_CONSUMER_SECRET);
  ScriptProperties.setProperty("TWITTER_HANDLE",          TWITTER_HANDLE);
  ScriptProperties.setProperty("WOLFRAM_API_ID",          WOLFRAM_API_ID);
  ScriptProperties.setProperty("MAX_TWITTER_ID",          0);
    
  // Delete exiting triggers, if any
  var triggers = ScriptApp.getScriptTriggers();
  
  for(var i=0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
    
  // Setup trigger to read Tweets every five minutes
  ScriptApp.newTrigger("fetchTweets")
           .timeBased()
           .everyMinutes(1)
           .create();
}

function oAuth() {
  var oauthConfig = UrlFetchApp.addOAuthService("twitter");
  oauthConfig.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");
  oauthConfig.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");
  oauthConfig.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
  oauthConfig.setConsumerKey(ScriptProperties.getProperty("TWITTER_CONSUMER_KEY"));
  oauthConfig.setConsumerSecret(ScriptProperties.getProperty("TWITTER_CONSUMER_SECRET"));
}

function fetchTweets() {
  oAuth();
  
  var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
  
  var phrase = "lang:en+to:" + twitter_handle; // English languate tweets sent to @labnol
  var search = "https://api.twitter.com/1.1/search/tweets.json?count=5&include_entities=false&result_type=recent&q="; 
  search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("MAX_TWITTER_ID");    
      
  var options =
  {
    "method": "get",
    "oAuthServiceName":"twitter",
    "oAuthUseToken":"always"
  };
  
  try {
    var result = UrlFetchApp.fetch(search, options);    

    if (result.getResponseCode() === 200) {
      var data = Utilities.jsonParse(result.getContentText());
      
      if (data) {
        var tweets = data.statuses;
        
        for (var i=tweets.length-1; i>=0; i--) {
          var question = tweets[i].text.replace(new RegExp("\@" + twitter_handle, "ig"), "");
          var answer   = askWolframAlpha(question);
          sendTweet(tweets[i].user.screen_name, tweets[i].id_str, answer);          
        }
      }
    }
  } catch (e) {
    Logger.log(e.toString());
  }
}

function sendTweet(user, reply_id, tweet) {
  var options =
  {
    "method": "POST",
    "oAuthServiceName":"twitter",
    "oAuthUseToken":"always"    
  };
  
  var status = "https://api.twitter.com/1.1/statuses/update.json";
  
  status = status + "?status=" + encodeString("@" + user + " " + tweet);
  status = status + "&in_reply_to_status_id=" + reply_id;
  
  try {
    var result = UrlFetchApp.fetch(status, options);
    ScriptProperties.setProperty("MAX_TWITTER_ID", reply_id);
    Logger.log(result.getContentText());    
  } catch (e) {
    Logger.log(e.toString());
  }
}

function askWolframAlpha(q) {
  var request  = "http://api.wolframalpha.com/v2/query?podindex=2&format=plaintext&appid=" 
                 + ScriptProperties.getProperty("WOLFRAM_API_ID") + "&input=" + encodeString(q);
  
  var answer = Xml.parse(UrlFetchApp.fetch(request).getContentText(), true);
  
  if (answer.queryresult.success == "true")    
    return answer.queryresult.pod.subpod.plaintext.Text;
  else 
    return "Sorry but I do not have an answer to that question. Please try another one.";
}

// Thank you +Martin Hawksey - you are awesome

function encodeString (q) {
   var str =  encodeURIComponent(q);
   str = str.replace(/!/g,'%21');
   str = str.replace(/\*/g,'%2A');
   str = str.replace(/\(/g,'%28');
   str = str.replace(/\)/g,'%29');
   str = str.replace(/'/g,'%27');
   return str;
}
