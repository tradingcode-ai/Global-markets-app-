import { CONFIG } from "./config.js";

export function extractVerifiedGroundingChunks(response) {
  const metadata = response?.candidates?.[0]?.groundingMetadata;
  const chunks = metadata?.groundingChunks || [];
  
  const verifiedSources = [];
  for (const chunk of chunks) {
    if (chunk?.web?.uri) {
      verifiedSources.push({
        name: chunk.web.title || new URL(chunk.web.uri).hostname.replace(/^www\./, ""),
        url: chunk.web.uri
      });
    }
  }

  // Dedupliceren op basis van URL
  return verifiedSources.filter((s, idx, arr) => arr.findIndex(x => x.url === s.url) === idx);
}

export function inferTier(sourceName = "", sourceUrl = "") {
  const combined = `${sourceName} ${sourceUrl}`.toLowerCase();
  for (const t1 of CONFIG.SOURCE_TIERS[1]) {
    if (combined.includes(t1.toLowerCase())) return 1;
  }
  for (const t2 of CONFIG.SOURCE_TIERS[2]) {
    if (combined.includes(t2.toLowerCase())) return 2;
  }
  for (const t3 of CONFIG.SOURCE_TIERS[3]) {
    if (combined.includes(t3.toLowerCase())) return 3;
  }
  return 4;
}

export function sanitizeAndEnforceGrounding(item, verifiedChunks) {
  const validUrlRegex = /^https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
  
  const isGroundedUrl = (url) => verifiedChunks.some(vc => {
    try {
      const u1 = new URL(url).hostname;
      const u2 = new URL(vc.url).hostname;
      return u1 === u2 || url === vc.url;
    } catch {
      return false;
    }
  });

  let primaryUrl = item.source_url;
  let primaryName = item.source_name;

  if (!primaryUrl || !validUrlRegex.test(primaryUrl) || (!isGroundedUrl(primaryUrl) && verifiedChunks.length > 0)) {
    if (verifiedChunks.length > 0) {
      primaryUrl = verifiedChunks[0].url;
      primaryName = verifiedChunks[0].name;
    } else {
      throw new Error(`Item afgewezen: Geen verifieerbare grounding URL voor headline: "${item.headline}"`);
    }
  }

  const primaryTier = inferTier(primaryName, primaryUrl);

  const cleanedSupporting = [];
  if (Array.isArray(item.supporting_sources)) {
    for (const sup of item.supporting_sources) {
      if (sup.url && validUrlRegex.test(sup.url)) {
        cleanedSupporting.push({
          name: sup.name || new URL(sup.url).hostname,
          url: sup.url,
          tier: sup.tier && [1, 2, 3, 4].includes(sup.tier) ? sup.tier : inferTier(sup.name, sup.url)
        });
      }
    }
  }

  if (cleanedSupporting.length === 0 && verifiedChunks.length > 1) {
    for (const chunk of verifiedChunks.slice(1, 4)) {
      if (chunk.url !== primaryUrl) {
        cleanedSupporting.push({
          name: chunk.name,
          url: chunk.url,
          tier: inferTier(chunk.name, chunk.url)
        });
      }
    }
  }

  return {
    ...item,
    source_name: primaryName,
    source_url: primaryUrl,
    source_tier: primaryTier,
    supporting_sources: cleanedSupporting
  };
}
