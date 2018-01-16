# This is a basic implementation of the Ichimoku Cloud trading strategy, along with 
# some associated fuctions used for chart interpretation. 
# 
# This script is loaded using the NPM package 'r-script' which runs R code on Node.js
# platforms. Data from Node is automatically loaded at the beginning of this script as the
# variable 'input' in the form of an array.

suppressMessages(library(jsonlite))
suppressMessages(library(caTools))
suppressMessages(library(quantmod))


# calculates Ichimoku chart lines
ichimoku <- function(HLC, nFast=20, nMed=60, nSlow=120) {
  turningLine <- (runmax(Hi(HLC), nFast) + runmin(Lo(HLC), nFast))/2
  baseLine <- (runmax(Hi(HLC), nMed) + runmin(Lo(HLC), nMed))/2
  spanA <- lag((turningLine + baseLine)/2, nMed)
  spanB <- lag((runmax(Hi(HLC), nSlow) + runmin(Lo(HLC), nSlow))/2, nMed)
  plotSpan <- lag(Cl(HLC), -nMed)
  laggingSpan <- lag(Cl(HLC), nMed)
  lagSpanA <- lag(spanA, nMed)
  lagSpanB <- lag(spanB, nMed)
  
  out <- cbind(turnLine=turningLine, baseLine=baseLine, spanA=spanA, spanB=spanB,
               plotSpan=plotSpan, laggingSpan=laggingSpan, lagSpanA=lagSpanA, 
               lagSpanB=lagSpanB)
  colnames(out) <- c("turnLine", "baseLine", "spanA", "spanB", "plotLagSpan", 
                     "laggingSpan", "lagSpanA","lagSpanB")
  return(out)
}


# compares candle 'close'  relative to Ichimoku chart lines
ichi.candle.check <- function(cloud.data) {
  spanA <- cloud.data[3]
  spanB <- cloud.data[4]
  close <- cloud.data[11]
  
  if (close >= spanA & spanA >= spanB) {
    return("above green cloud")
  }
  
  if (spanA >= close & close >= spanB) {
    return("inside green cloud")
  }
  
  if (spanA >= spanB & spanB >= close) {
    return("below green cloud")
  }
  
  if (spanB >= spanA & spanA >= close) {
    return("below red cloud")
  }
  
  if (spanB >= close & close >= spanA) {
    return("inside red cloud")
  }
  
  if (close >= spanB & spanB >= spanA) {
    return("above red cloud")
  }
}


# compares current candle to previous one to determine most recent price action
ichi.compare <- function(cloud.data) {
  last.candle.index = length(cloud.data)
  current.candle = ichi.candle.check(cloud.data[last.candle.index,])
  prev.candle = ichi.candle.check(cloud.data[last.candle.index-1,])
  
  if (prev.candle == current.candle) {
    return(current.candle)
  }
  
  if ((prev.candle == "above green cloud") &&
      (current.candle == "inside green cloud")) {
    return("broken into green cloud")
  }

  if (((prev.candle == "above green cloud") || (prev.candle == "inside green cloud")) &&
      (current.candle == "below green cloud")) {
    return("broken through green cloud")
  }
  
  if (((prev.candle == "inside green cloud") || (prev.candle == "below green cloud")) &&
      (current.candle == "above green cloud")) {
    return("bounced off green cloud support")
  }
  
  if ((prev.candle == "below green cloud") &&
      (current.candle == "inside green cloud")) {
    return(current.candle)
  }
  
  if ((prev.candle == "below red cloud") &&
      (current.candle == "inside red cloud")) {
    return("broken into red cloud")
  }
  
  if (((prev.candle == "below red cloud") || (prev.candle == "inside green cloud")) &&
      (current.candle == "above red cloud")) {
    return("broken through red cloud")
  }
  
  if (((prev.candle == "inside red cloud") || (prev.candle == "above red cloud")) &&
      (current.candle == "below red cloud")) {
    return("bounced off red cloud support")
  }
  
  if ((prev.candle == "above red cloud") &&
      (current.candle == "inside red cloud")) {
    return(current.candle)
  }

  return(": the clouds seem too thin to make a prediction right now.")
}


# loads data and runs script
candles <- fromJSON(input[[1]])
colnames(candles) <- c("time", "open", "high", "low", "close", "volume", "closeTime", 
                    "assetVolume", "trades", "buyBaseVolume", "buyAssetVolume", "ignored")

hlc = cbind(candles["high"], candles["low"], candles["close"])
clouds <- ichimoku(hlc)
clouds <- cbind(clouds, hlc, stringsAsFactors=FALSE)

ichi.compare(clouds)
