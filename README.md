# PINMOO 鍝佹矏鍜ㄨ瀹樼綉

骞垮窞鍝佹矏鍜ㄨ鏈夐檺鍏徃鍝佺墝灞曠ず鍨嬪畼缃戯紝鍖呭惈棣栭〉銆佹湇鍔′粙缁嶃€侀」鐩粡楠屻€佹渚嬭鎯呫€佸叧浜庡搧娌愬拰鑱旂郴鎴戜滑椤甸潰銆傞」鐩负鏃犳暟鎹簱闈欐€佺珯锛屽唴瀹规暟鎹泦涓湪 JS 鏂囦欢涓紝鏂逛究鍚庣画缁存姢銆?
## 鏈湴鍚姩

鏃犻渶瀹夎渚濊禆锛?
```bash
npm run dev
```

鎵撳紑缁堢杈撳嚭鐨勫湴鍧€锛岄€氬父鏄?`http://localhost:5173/`銆?
濡傞渶閲嶆柊澶勭悊 Logo 鍜屾渚嬪浘鐗囷細

```bash
npm run assets
```

## 鏋勫缓

```bash
npm run build
npm run preview
```

鏋勫缓浜х墿鍦?`dist` 鐩綍銆?
## 閮ㄧ讲鍒?Vercel

1. 灏嗛」鐩鍏?Vercel銆?2. Framework Preset 閫夋嫨 `Other`銆?3. Build Command 浣跨敤 `npm run build`銆?4. Output Directory 浣跨敤 `dist`銆?5. 缁戝畾姝ｅ紡鍩熷悕 `pinmoo.top`銆?
## 閮ㄧ讲鍒?Netlify

1. 灏嗛」鐩鍏?Netlify銆?2. Build command 浣跨敤 `npm run build`銆?3. Publish directory 浣跨敤 `dist`銆?4. 椤圭洰宸插寘鍚?`public/_redirects`锛屾瀯寤哄悗浼氬鍒跺埌 `dist/_redirects`銆?5. 缁戝畾姝ｅ紡鍩熷悕 `pinmoo.top`銆?
## 鍐呭缁存姢

- 鍏徃鍚嶇О銆佺數璇濄€佸煙鍚嶇瓑甯搁噺锛歚src/data/site.js`
- 鏈嶅姟鍐呭锛歚src/data/services.js`
- 妗堜緥鍐呭锛歚src/data/cases.js`
- 椤甸潰缁勪欢涓庝氦浜掞細`src/static-main.js`
- 瑙嗚鏍峰紡锛歚src/styles.css`

## 琛ㄥ崟閭欢閫氱煡

褰撳墠鑱旂郴琛ㄥ崟宸插吋瀹?Netlify Forms銆傞儴缃插埌 Netlify 鍚庯紝鍦ㄩ」鐩悗鍙拌繘鍏?Forms锛屾壘鍒?consultation 琛ㄥ崟锛屽啀娣诲姞 Email notification锛屾敹浠朵汉濉啓锛歡zbarry@139.com銆?
鏈湴 localhost 鐜浼氭ā鎷熸彁浜ゆ垚鍔燂紝涓嶄細鐪熷疄鍙戦€侀偖浠躲€傞儴缃插埌 Netlify 鍚庯紝瀹㈡埛鎻愪氦浼氳繘鍏?Netlify Forms 鍚庡彴锛屽苟鎸夐€氱煡璁剧疆鍙戦€佸埌鎸囧畾閭銆?
## SEO / GEO 浼樺寲

椤圭洰鏋勫缓鏃朵細鑷姩鎶婃瘡涓〉闈㈤娓叉煋鎴愮湡瀹?HTML锛屽苟娉ㄥ叆 Schema.org JSON-LD 缁撴瀯鍖栨暟鎹紝鍖呭惈 Organization / ProfessionalService / WebSite / WebPage / BreadcrumbList / Service / FAQPage / Article / ContactPage 绛変俊鎭€?
宸叉柊澧?AI 鍙嬪ソ鏂囦欢锛?
- `/llms.txt`锛氱粰 AI 鎼滅储鍜屽ぇ妯″瀷鎽樿浣跨敤鐨勫搧鐗岃鏄?- `/ai.txt`锛氬悓鏍风殑 AI 鎽樿鍏ュ彛澶囩敤
- `/pinmoo-profile.json`锛氭満鍣ㄥ彲璇荤殑鍝佺墝銆佹湇鍔°€佹渚嬨€佽仈绯绘柟寮忚祫鏂?- `/sitemap.xml`锛氬惈 lastmod銆乧hangefreq銆乸riority
- `/robots.txt`锛氬厑璁镐富娴佹悳绱㈠紩鎿庡拰甯歌 AI 鎶撳彇鍣ㄨ闂紝骞舵寚鍚?sitemap 涓?llms.txt

閮ㄧ讲鍓嶈杩愯锛?
```bash
npm run build
```

閮ㄧ讲鐩綍浣跨敤 `dist`銆?