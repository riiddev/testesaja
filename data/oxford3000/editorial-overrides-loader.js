(() => {
  "use strict";
  const basePath = "/data/oxford3000/editorial-overrides.json.gz.b64";
  const overlayPaths = [
    "/data/oxford3000/editorial-overrides-context-fixes.json.gz.b64",
    "/data/oxford3000/editorial-overrides-batch2-a.json.gz.b64",
    "/data/oxford3000/editorial-overrides-batch2-b.json.gz.b64"
  ];
  const nativeFetch = window.fetch.bind(window);
  let combinedPromise = null;

  async function decodeBundle(encoded) {
    const binary = atob(String(encoded).trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  }

  async function encodeBundle(data) {
    const stream = new Blob([JSON.stringify(data)]).stream().pipeThrough(new CompressionStream("gzip"));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary);
  }

  function getCombinedBundle() {
    if (combinedPromise) return combinedPromise;
    combinedPromise = (async () => {
      const paths = [basePath, ...overlayPaths];
      const responses = await Promise.all(paths.map((path) => nativeFetch(path, { cache: "no-cache" })));
      if (!responses[0].ok) throw new Error("Editorial base bundle could not be loaded.");

      const base = await decodeBundle(await responses[0].text());
      const entriesByWord = new Map();
      for (const entry of (base.entries || [])) {
        if (entry && entry.word) entriesByWord.set(String(entry.word).trim().toLowerCase(), entry);
      }

      for (let i = 1; i < responses.length; i++) {
        if (!responses[i].ok) {
          console.warn("SinauuEnglish extra editorial bundle unavailable:", paths[i]);
          continue;
        }
        try {
          const extra = await decodeBundle(await responses[i].text());
          for (const entry of (extra.entries || [])) {
            if (entry && entry.word) entriesByWord.set(String(entry.word).trim().toLowerCase(), entry);
          }
        } catch (error) {
          console.warn("SinauuEnglish extra editorial bundle could not be read:", paths[i], error);
        }
      }

      base.entries = Array.from(entriesByWord.values());
      base.entryCount = base.entries.length;
      return encodeBundle(base);
    })();
    return combinedPromise;
  }

  window.fetch = async function(input, init) {
    const requestUrl = typeof input === "string" ? input : (input && input.url) || "";
    let pathname = "";
    try { pathname = new URL(requestUrl, window.location.href).pathname; } catch (_) {}
    if (pathname !== basePath) return nativeFetch(input, init);
    try {
      const encoded = await getCombinedBundle();
      return new Response(encoded, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
      });
    } catch (error) {
      console.error("SinauuEnglish editorial merge failed; using the original bundle.", error);
      return nativeFetch(input, init);
    }
  };
})();