# import library; suppressMessage is needed to avoid a bug in r-script package
suppressMessages(library(jsonlite))
suppressMessages(library(caTools))
suppressMessages(library(quantmod))

# loads stringified JSON (input[[1]]) recieved from Node
data <- fromJSON(input[[1]])
colnames(data) <- c("time", "open", "high", "low", "close", "volume", "closeTime", "assetVolume", "trades", "buyBaseVolume", "buyAssetVolume", "ignored")


HLC = cbind(data["high"], data["low"], data["close"])

# function that calculates ichimoku lines
ichimoku <- function(HLC, nFast=20, nMed=60, nSlow=120) {
  turningLine <- (runmax(Hi(HLC), nFast)+runmin(Lo(HLC), nFast))/2
  baseLine <- (runmax(Hi(HLC), nMed)+runmin(Lo(HLC), nMed))/2
  spanA <- lag((turningLine+baseLine)/2, nMed)
  spanB <- lag((runmax(Hi(HLC), nSlow)+runmin(Lo(HLC), nSlow))/2, nMed)
  plotSpan <- lag(Cl(HLC), -nMed) #for plotting the original Ichimoku only
  laggingSpan <- lag(Cl(HLC), nMed)
  lagSpanA <- lag(spanA, nMed)
  lagSpanB <- lag(spanB, nMed)
  
  out <- cbind(turnLine=turningLine, baseLine=baseLine, spanA=spanA, spanB=spanB,
               plotSpan=plotSpan, laggingSpan=laggingSpan, lagSpanA=lagSpanA, 
               lagSpanB=lagSpanB)
  colnames(out) <- c("turnLine", "baseLine", "spanA", "spanB", "plotLagSpan", 
                     "laggingSpan", "lagSpanA","lagSpanB")
  return (out)
}

# function that compares current price to Ichimoku clouds 
ichi.check <- function(cloud.data) {
  spanA <- cloud.data[1,3]
  spanB <- cloud.data[1,4]
  close <- cloud.data[1,9]
  
  if (close > spanA & spanA > spanB) {
    return(" is above the green cloud. Uptrending market.")
  }
  
  if (spanA > close & close > spanB) {
    return(" is currently inside the green cloud. Careful trading.")
  }
  
  if (spanA > spanB & spanB > close) {
    return(" is below the green cloud! Possible resistance ahead.")
  }
  
  if (spanB > spanA & spanA > close) {
    return(" is below the red cloud. Downtrending market.")
  }
  
  if (spanB > close & close > spanA) {
    return(" is inside the red cloud. Careful trading.")
  }
  
  if (close > spanB & spanB > spanA) {
    return(" is above the red cloud! Possible resistance ahead.")
  }
}

# runs functions
clouds <- ichimoku(HLC)
clouds <- cbind(clouds, HLC, stringsAsFactors=FALSE)
ichi.check(clouds)
