const getPlayerJSUrl = async (rawHTML: string) => {
  // see https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/youtube.py
  const playerPattern = /(?:PLAYER_JS_URL|jsUrl)\"\s*:\s*\"([^\"]+)/;
  const matches = rawHTML.match(playerPattern);

  if(!matches || !matches[0]) {
    console.log('PLAYER_JS_URL not found');

    return;
  }

  return `https://youtube.com${matches[1]}`;
};

const processPlayerJs = async (url, formats) => {
  console.log(url);
  const rawJs: string = await fetch(`https://cors-proxy-wine.vercel.app/api?url=${url}`).then(res => res.text());

  // see https://github.com/ytdl-org/youtube-dl/blob/master/youtube_dl/extractor/youtube.py
  var patterns = [
		/\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
		/\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*encodeURIComponent\s*\(\s*([a-zA-Z0-9$]+)\(/,
		/\bm=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(h\.s\)\)/,
		/\bc&&\(c=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(c\)\)/,
		/(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\);[a-zA-Z0-9$]{2}\.[a-zA-Z0-9$]{2}\(a,\d+\)/,
		/(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)/,
		/([a-zA-Z0-9$]+)\s*=\s*function\(\s*a\s*\)\s*{\s*a\s*=\s*a\.split\(\s*""\s*\)/,
		// Obsolete patterns
		/(["\'])signature\1\s*,\s*([a-zA-Z0-9$]+)\(/,
		/\.sig\|\|([a-zA-Z0-9$]+)\(/,
		/yt\.akamaized\.net\/\)\s*\|\|\s*.*?\s*[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*(?:encodeURIComponent\s*\()?\s*([a-zA-Z0-9$]+)\(/,
		/\b[cs]\s*&&\s*[adf]\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
		/\b[a-zA-Z0-9]+\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*([a-zA-Z0-9$]+)\(/,
		/\bc\s*&&\s*a\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\('/,
		/\bc\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\(/,
		/\bc\s*&&\s*[a-zA-Z0-9]+\.set\([^,]+\s*,\s*\([^)]*\)\s*\(\s*([a-zA-Z0-9$]+)\(/,
	];

  let matches = null;

	for (let i = 0; i < patterns.length; i++) {
		matches = rawJs.match(patterns[i]);

		if (matches && matches[0]) {
			break;
		}
	}

  let toRun = rawJs.replace(/}\)\(_yt_player\);/, "return " + matches[1] + "\(\);}\)\(_yt_player\);");
  const regex = new RegExp(matches[1] + "\\(.*?_yt_player\\);","gm");

  formats.forEach(format => {
    if (format['signatureCipher']) {
      const signatureCipher: string = format['signatureCipher'];
      const urlPattern = /url=([^&"]*)/;
      const url = decodeURIComponent(signatureCipher.match(urlPattern)[1]);
      const spPattern = /sp=([^&"]*)/;
      const sp = decodeURIComponent(signatureCipher.match(spPattern)[1]);
      const sPattern = /s=([^&"]*)/;
      const s = decodeURIComponent(signatureCipher.match(sPattern)[1]);

      toRun = toRun.replace(regex, matches[1] + "\(\"" + s + "\"\);}\)\(_yt_player\);");

      const newSig = window.eval(toRun);

      format['url'] = url.concat('&' + sp + '=' + newSig);
    }
	});
}

export { getPlayerJSUrl, processPlayerJs }