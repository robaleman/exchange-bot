// -----------------------
// SET-UP AND DEPENDENCIES
// -----------------------

var Discord = require('discord.io');
var auth = require('./auth.json');

// Loads market list.
const markets = require('./markets.json');

// Access Node-Binance API package and configures Binance API
const binance = require('node-binance-api');
binance.options({
  'APIKEY':'<key>',
  'APISECRET':'<secret>'
});


// -----------------------
// DISCORD BOT
// -----------------------

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

    // interprets any message starting with a '!' as a command
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var command = args[0];
        var param = args[1]

        // help command
        if (command == "help") {
          bot.sendMessage({
            to: channelID,
            message: "This is CryptoBot! Here's a list of commands. \n" +
            "!vol MARKET : gives the volume for a specified market"
          });
        }

        // volume command
        if (command == "vol") {
          var market = param
          binance.prevDay(market, function(prevDay, symbol) {
              bot.sendMessage({
                to: channelID,
                message: "24h volume: " + prevDay.volume.toString()
              });
          });
         }
     }
});


// -----------------------
// CONFIGURATION FUNCTIONS
// -----------------------

function refreshMarkets() {
    binance.prices(function(ticker) {
        console.log(JSON.stringify(Object.keys(ticker)).length);
    });
}
