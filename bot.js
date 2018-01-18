//-----------------------
//-----------------------
// SETUP AND DEPENDENCIES
//-----------------------
//-----------------------

// connect to Discord API
var Discord = require('discord.io');
var auth = require('./auth.json');

// loads modifiable settings from config file
var settings = require("./config.json");

// loads all necessary local data
var markets = require('./markets.json').markets;


// loads all packages used
var schedule = require('node-schedule');
var R = require("r-script-with-bug-fixes");

// connect to Binance API using Node Binance API wrapper
const binance = require('node-binance-api');
binance.options({
  'APIKEY':'<key>',
  'APISECRET':'<secret>'
});



//-----------------------
//-----------------------
// COMMAND FUNCTIONS
//-----------------------
//-----------------------

// checks Binance market for price
function check_price(market="BTCUSDT", channelID) {
  binance.prices(function(error, ticker) {
    if (ticker.msg != "Invalid symbol.") {
      bot.sendMessage({
        to: channelID,
        message: market + " price: " + ticker[market]
      });
    }
    else {
      bot.sendMessage({to: channelID, message:
      "Didn't recognize that symbol. Try again?"});
    }
  });
}

// checks Binance market for price and converts to USD
function check_price_USD(market="BTCUSDT", channelID) {
  binance.prices(function(error, ticker) {
    if (ticker.market != undefined) {
      var exchange_rate = 1
      if (market.endsWith("BTC")) {
        exchange_rate = ticker["BTCUSDT"]
      }
      if (market.endsWith("ETH")) {
        exchange_rate = ticker["ETHUSDT"]
      }
      if (market.endsWith("BNB")) {
        exchange_rate = ticker["BNBUSDT"]
      }

      price = exchange_rate * ticker[market]

      bot.sendMessage({
        to: channelID,
        message: market + " price: " + price
      });

    }
    else {
      bot.sendMessage({to: channelID, message:
      "Didn't recognize that symbol. Try again?"});
    }
  });
}

// checks Binance market for volume
function check_volume(market="BTCUSDT", channelID) {
  binance.prevDay(market, function(error, prevDay, symbol) {
    if (prevDay.msg != "Invalid symbol.") {
      bot.sendMessage({
        to: channelID,
        message: market + " 24h volume: " + prevDay.volume.toString()
      });
    }
    else {
      bot.sendMessage({to: channelID, message:
      "Didn't recognize that symbol. Try again?"});
    }
  });
}


// helper function
function run_ichimoku(ticks) {
  // converts from array to JSON for easier loading into R
  for (var i in ticks) {ticks[i] = Object.assign({}, ticks[i])}

  try {
    var analysis = R("ta-tools/ichimoku.R")
                   .data(JSON.stringify(ticks))
                   .callSync()
  }
  catch(err) {
    console.log("R-Script threw an error: " + err)
  }

  return analysis
}

// runs Ichimoku TA on a market and returns the resulting analysis
function check_ichimoku(market="BTCUSDT", channelID) {
  bot.sendMessage({to: channelID, message: "Checking market.."});
  binance.candlesticks(market, "1h", function(error, ticks, symbol) {
    if (ticks.msg != "Invalid symbol.") {


      analysis = run_ichimoku(ticks)

      // parse analysis results
      switch (analysis) {
        case "above green cloud":
          analysis = "is above the green cloud. Uptrending market with support."
          break;

        case "above red cloud":
          analysis = "is above the red cloud."
          break;

        case "inside green cloud":
          analysis = "is inside the cloud. Careful trading."
          break;

        case "inside red cloud":
          analysis = "is inside the cloud. Careful trading."
          break;

        case "below green cloud":
          analysis = "is below the green cloud."
          break;

        case "below red cloud":
          analysis = "is below the red cloud. Downtrending market with support."
          break;

        case "broken into green cloud":
          analysis = "has recently broken into the green cloud!"
          break;

        case "broken through green cloud":
          analysis = "has completely broken through the green cloud! "
                       + "Support broken. Watch for reversal. "
                       + ":chart_with_downwards_trend:"
          break;

        case "bounced off green cloud support":
          analysis = "has recently bounced off support. "
                      + "Currently back above the green cloud."
          break;

        case "broken into red cloud":
          analysis = "has recently broke into the red cloud!"
          break;

        case "broken through red cloud":
          analysis = "has completely broken through the red cloud! "
                      + "Support broken. Watch for reversal. "
                      + ":chart_with_upwards_trend:"
          break;

        case "bounced off red cloud support":
          analysis = "has recently bounced off support. "
                        + "Currently back below the red cloud."
          break;

        default: analysis = analysis
      }

      if (analysis != undefined) {
        bot.sendMessage({to: channelID, message: market + ' ' + analysis});
      }
      else {
        bot.sendMessage({to: channelID, message:
          "Sorry, had trouble reading markets."});
      }
    }

    else {
      bot.sendMessage({to: channelID, message:
      "Didn't recognize that symbol. Try again?"});
    }
  }, {limit: 150});
}



//-----------------------
//-----------------------
// DISCORD BOT LISTENERS
//-----------------------
//-----------------------

// launches bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});


// actions that launch upon bot startup
bot.on('ready', function (evt) {
    console.log('Connected');
    console.log('Logged in as: ' + bot.username + '-' + bot.id);
});


// actions that launch upon any messages in the channel
bot.on('message', function (user, userID, channelID, message, evt) {

    // filters only for commands that start with '!'
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var command = args[0]
        var param = args[1]
        if (param != undefined ) {
          param = param.toUpperCase()
        }

        // help command
        if (command == "help") {
          bot.sendMessage({
            to: channelID,
            message: "This is CryptoBot! Here's a list of commands. \n" +
            "!price MARKET : gives the price for a specified market \n" +
            "!priceUSD MARKET : gives the price for a specified market in US dollars \n" +
            "!vol MARKET : gives the volume for a specified market \n" +
            "!ichi MARKET : gives whether a specific market is within its Ichimoku cloud \n" +
            "!alert : toggles whether or not you want to receive 15m Ichimoku cloud updates"
          });
        }

        //  price command
        if (command == "price") {
          var market = param
          check_price(market, channelID)
        }

        //  price command
        if (command == "priceUSD") {
          var market = param
          check_price_USD(market, channelID)
        }

        // volume command
        if (command == "vol") {
          var market = param
          check_volume(market, channelID)
         }

        // ichimoku command
        if (command == "ichi") {
          var market = param
          check_ichimoku(market, channelID)
        }

        // alert command for toggling Ichimoku indicator
        if (command == "alert") {
          var indicator = param

          if (ichi_alert === "on" ) { ichi_alert = "off" }
          if (ichi_alert === "off") { ichi_alert = "on"  }

          bot.sendMessage({
            to: channelID,
            message: "Ichimoku indicator is now " + ichi_alert + "!"
          });
        }
     }
});



// ----------------
// ----------------
// SCHEDULED EVENTS
// ----------------
// ----------------

const ALERT_CHANNEL = settings.alert_channelID
const ALERT_FREQUENCY = "0,15,30,45 * * * *"   // default every 15 mins

var ichi_alert = "on"


// ichimoku scheduled alert system
var ichiAlertSystem = schedule.scheduleJob(ALERT_FREQUENCY, function(){

  if (ichi_alert === "on") {
  function analyzeMarkets(i) {
    if (i < markets.length) {
      binance.candlesticks(markets[i], "5m", function(error, ticks, symbol) {

        // recursively convert array into stringified JSON
        function jsonify(ticks, i) {
          if (i < ticks.length) {
            ticks[i] = Object.assign({}, ticks[i])
            jsonify(ticks, i+1)
          }
        }
        jsonify(ticks,0)
        candlesticks_data = JSON.stringify(ticks)

        R("ta-tools/ichimoku.R").data(candlesticks_data)
          .call(function(err, analysis) {
          if (analysis == "broken into green cloud") {
            bot.sendMessage({to: ALERT_CHANNEL,
              message: symbol + ': ' + analysis});
            }
          if (analysis == "broken into red cloud") {
            bot.sendMessage({to: ALERT_CHANNEL,
              message: symbol + ': ' + analysis});
            }
          if (analysis == "broken through green cloud") {
            bot.sendMessage({to: ALERT_CHANNEL,
              message: symbol + ': ' + analysis});
            }
          if (analysis == "broken through red cloud") {
            bot.sendMessage({to: ALERT_CHANNEL,
              message: symbol + ': ' + analysis});
            }
          analyzeMarkets(i+1)

        })
      }, {limit: 150});
    }
  }
  analyzeMarkets(0)
  }
});



// -----------------------
// CONFIGURATION FUNCTIONS
// -----------------------

// fetches list of available markets from Binance API;
// markets are usually stored locally but may need if new markets are added
function refreshMarkets() {
    binance.prices(function(ticker) {
        console.log(JSON.stringify(Object.keys(ticker)).length);
    });
}
