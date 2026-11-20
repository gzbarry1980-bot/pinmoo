export async function preserveReviewedBands({year,parsed,previousBands,previousSources,fetchAsset}){
 const source=previousSources.find(s=>s.id===`official-${year}-score-bands`),evidence=source?.imageEvidence;
 if(!evidence)return {rows:parsed,sourceMetadata:null};
 const saved=previousBands.filter(r=>r.year===year&&r.sourceId===source.id);
 if(saved.length!==evidence.rows||!saved.length)throw new Error(`${year} reviewed score-band rows incomplete`);
 const result=await fetchAsset(evidence.url);
 if(result.sha256!==evidence.sha256)throw new Error(`${year} official reviewed image changed; review required`);
 if(parsed.length&&JSON.stringify(parsed)!==JSON.stringify(saved))throw new Error(`${year} HTML and reviewed image rows disagree`);
 return {rows:parsed.length?parsed:saved,sourceMetadata:{parserVersion:source.parserVersion,imageEvidence:evidence}};
}
