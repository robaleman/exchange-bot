# CryptoBuddy Bot for Discord
A bot for [Discord](https://discordapp.com/) that provides utilities for cryptocurrency traders. Run it in your Discord server and users can call various commands that fetch current information from crypto-exchanges like Binance, or he can be toggled to send alerts during unusual price action. CryptoBuddy is built in Node.js and uses R to make technical analysis calls. 

## Bot Setup
First, make sure you have installed the latest versions of Node.js. Clone or download this repository. You will then need to install the following dependencies through NPM. Run:

```
npm install node-binance-api node-schedule r-script-with-bug-fixes
npm install discord.io
```

Replace the token in the `auth.json` with the your own token generated from the [app section of your Discord account](https://discordapp.com/developers/applications/me), as well as replacing the channel ID parameter in the `config.json` with the ID of the channel that you want the bot to fire alerts. Add the bot to your server.

When you're ready, navigate to this repo and run:
```
node bot.js
```

Your bot should be ready to go.


## Commands
Here's a list of commands users can use with CryptoBot. Note that all markets must be requested in the form of "FIRST_COIN" + "LAST_COIN", so for example, to check the price of Ethereum-Bitcoin, you would have to input the command `!price ETHBTC` in the chatroom.

`!help` provides a list of commands available to the user.

`!price <MARKET>` returns the current price of a specified market on Binance.

`!priceUSD <MARKET>` returns the current price of a specified market in US dollars.

`!vol <MARKET>` returns the current 24-hour volume of a specified market on Binance.

`!ichi <MARKET>` calculates where the Ichimoku cloud is for a given market.

`!alert` toggles Ichimoku alerts on or off; when on, will ping whenever a market has broken in or through an Ichi cloud on the 15 minute candle


