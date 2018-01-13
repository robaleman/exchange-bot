# R script that inputs HLC data and outputs Ichimoku cloud lines

require("quantmod")
ichimoku <- function(HLC, nFast=9, nMed=26, nSlow=52) {
  turningLine <- (runmax(Hi(HLC), nFast)+runmin(Lo(HLC), nFast))/2
  baseLine <- (runmax(Hi(HLC), nMed)+runmin(Lo(HLC), nMed))/2
  spanA <- lag((turningLine+baseLine)/2, nMed)
  spanB <- lag((runmax(Hi(HLC), nSlow)+runmin(Lo(HLC), nSlow))/2, nMed)
  plotSpan <- lag(Cl(HLC), -nMed) #for plotting the original Ichimoku only
  laggingSpan <- lag(Cl(HLC), nMed)
  lagSpanA <- lag(spanA, nMed)
  lagSpanB <- lag(spanB, nMed)
  out <- cbind(turnLine=turningLine, baseLine=baseLine, spanA=spanA, spanB=spanB,
               plotSpan=plotSpan, laggingSpan=laggingSpan, lagSpanA, lagSpanB)
  colnames(out) <- c("turnLine", "baseLine", "spanA", "spanB", "plotLagSpan", 
                     "laggingSpan", "lagSpanA","lagSpanB")
  return (out)
}