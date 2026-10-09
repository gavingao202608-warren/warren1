/** Ontario dealer-purchase planning illustration, never a final quote. */
export const HST_RATE = 0.13;
export function budgetEstimate(price:number, optionalTaxableCost=0, licensingReserve=0){
 for(const value of [price,optionalTaxableCost,licensingReserve])if(!Number.isFinite(value)||value<0||value>1_000_000)throw new Error('Enter a finite amount between 0 and 1,000,000 CAD');
 const taxableSubtotal=price+optionalTaxableCost;
 const tax=Math.round(taxableSubtotal*HST_RATE*100)/100;
 return {price,optionalTaxableCost,licensingReserve,tax,total:Math.round((taxableSubtotal+tax+licensingReserve)*100)/100};
}
export function maximumListingPrice(totalBudget:number, optionalTaxableCost=0,licensingReserve=0){
 budgetEstimate(totalBudget,optionalTaxableCost,licensingReserve);
 return Math.max(0,Math.floor(((totalBudget-licensingReserve)/(1+HST_RATE)-optionalTaxableCost)*100)/100);
}
export const budgetMoney=(n:number)=>new Intl.NumberFormat('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2}).format(n);
