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
var R = require("r-script");

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
function check_price(market="ETHBTC", channelID) {
  binance.prices(function(ticker) {
    bot.sendMessage({
      to: channelID,
      message: market + " price: " + ticker[market]
    });
  });
}

// checks Binance market for volume
function check_volume(market="ETHBTC", channelID) {
  binance.prevDay(market, function(prevDay, symbol) {
    bot.sendMessage({
      to: channelID,
      message: market + " 24h volume: " + prevDay.volume.toString()
    });
  });
}

// runs Ichimoku TA on a market and returns the resulting analysis
function check_ichimoku(market="ETHBTC", channelID) {
  bot.sendMessage({to: channelID, message: "Checking market.."});
  binance.candlesticks(market, "5m", function(ticks, symbol) {
    // converts from array (as delivered from Binance API) to JSON
    for (var i in ticks) {ticks[i] = Object.assign({}, ticks[i])}

    // loads JSON into R and runs analysis
    var analysis = R("ta-tools/ichimoku.R")
                    .data(JSON.stringify(ticks))
                    .callSync()

    bot.sendMessage({to: channelID, message: market + analysis});
  }, {limit: 1, endTime: 1514764800000});
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
        var command = args[0];
        var param = args[1]

        // help command
        if (command == "help") {
          bot.sendMessage({
            to: channelID,
            message: "This is CryptoBot! Here's a list of commands. \n" +
            "!vol MARKET : gives the volume for a specified market \n" +
            "!ichi MARKET : gives whether a specific market is within its Ichimoku cloud"
          });
        }

        //  price command
        if (command == "price") {
          var market = param
          check_price(market, channelID)
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
