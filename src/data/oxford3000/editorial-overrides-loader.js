(() => {
  "use strict";
  const basePath = "/data/oxford3000/editorial-overrides.json.gz.b64";
  const overlayPaths = [
    "/data/oxford3000/editorial-overrides-context-fixes.json.gz.b64",
    "/data/oxford3000/editorial-overrides-batch2-a.json.gz.b64",
    "/data/oxford3000/editorial-overrides-batch2-b.json.gz.b64",
    "/data/oxford3000/editorial-overrides-b1b2-a.json.gz",
    "/data/oxford3000/editorial-overrides-b1b2-b.json.gz.b64",
    "/data/oxford3000/editorial-overrides-b1b2-c.json.gz",
    "/data/oxford3000/editorial-overrides-gap-01.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-02.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-03.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-04.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-05.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-06.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-07.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-08.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-09.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-10.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-11.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-12.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-13.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-14.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-15.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-16.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-17.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-18.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-19.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-20.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-21.json.gz.b64",
    "/data/oxford3000/editorial-overrides-gap-22.json.gz.b64",
    "/data/oxford3000/editorial-overrides-b1b2-translations.json.gz.b64",
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

  async function decodeResponse(response) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return JSON.parse(await new Response(stream).text());
    }
    const text = new TextDecoder().decode(bytes).trim();
    if (text.startsWith("{")) return JSON.parse(text);
    return decodeBundle(text);
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

      const base = await decodeResponse(responses[0]);
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
          const extra = await decodeResponse(responses[i]);
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
