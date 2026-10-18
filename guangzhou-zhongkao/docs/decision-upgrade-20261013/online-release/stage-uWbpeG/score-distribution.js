// Linear estimates within published score bands, not observed one-point ranks.
function rows(bands){return (bands||[]).filter(r=>Number.isFinite(r.score)&&Number.isFinite(r.cumulativeRatio)).sort((a,b)=>b.score-a.score);}
export function estimatePercentile(score,bands){
 const ordered=rows(bands);if(!ordered.length||!Number.isFinite(score))return null;
 if(score>=ordered[0].score)return ordered[0].cumulativeRatio;
 for(let i=1;i<ordered.length;i++){const upper=ordered[i-1],lower=ordered[i];if(score>=lower.score){const fraction=(upper.score-score)/(upper.score-lower.score);return upper.cumulativeRatio+fraction*(lower.cumulativeRatio-upper.cumulativeRatio);}}
 return ordered.at(-1).cumulativeRatio;
}
export function estimateScore(percentile,bands){
 const ordered=rows(bands);if(!ordered.length||!Number.isFinite(percentile))return null;
 if(percentile<=ordered[0].cumulativeRatio)return ordered[0].score;
 for(let i=1;i<ordered.length;i++){const upper=ordered[i-1],lower=ordered[i];if(percentile<=lower.cumulativeRatio){const span=lower.cumulativeRatio-upper.cumulativeRatio;if(span<=0)return lower.score;return upper.score-(percentile-upper.cumulativeRatio)/span*(upper.score-lower.score);}}
 return ordered.at(-1).score;
}
