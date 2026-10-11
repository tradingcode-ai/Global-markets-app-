# Original report visuals

New visual enrichments (payload version 2) use original figures from articles/research documents and reusable editorial photos. They never reconstruct financial charts from model-supplied datapoints. Legacy stored macroChart datasets remain displayable.

## Runtime

1. Analyze the report claim and image slot concept.
2. Inspect up to three existing research sources first. A title, publisher, snippet or URL is never evidence that a figure exists.
3. Run code-controlled discovery in order: official research, financial media, specialist finance (including ZeroHedge), social (including X), primary sources, structured-source publications. maxSearches=10 bounds discovery attempts and existing-document inspections; each discovery returns at most three leads. Stop only after a real figure validates.
4. Acquire the original source before accepting its linked image. Otherwise inspect isolated Chromium figure/img/svg/canvas elements or render up to two PDF pages (nominated page first, then a fallback) and crop a complete figure. Never substitute a whole article screenshot.
5. Inspect actual pixels with the configured model: relevance to claim, recognizable chart/exhibit, readability, complete axes/legend and identified original source. Model/credential failures, paywalls, login, unavailable browsers, unreadable figures and absent provenance produce explicit unavailable status and continued retrieval.
6. Commons API photo discovery retains actual author/license/file/source metadata. Only CC0, public domain, CC BY and CC BY-SA files are accepted. Validate decoded dimensions and review actual pixels against the selected editorial concept. Photo dates are retained; recency is not inferred from upload date or described as current. No Unsplash API assets or invented location captions.
7. Normalize and embed real raster bytes once in assetRegistry.stored (SHA-256, dimensions, MIME, capture time/method, PDF page/crop). Evidence is capped at 1 MB and photos at 500 KB; unsuccessful encoding produces a truthful no-visual result. Source URLs remain citations, not image src.
8. Composer links claim IDs and asset IDs; gates reject unpersisted/unattributed assets or missing layout references. The actual modal displays stored figures with captions, original-source credit, discovery credit and PDF page. Corrupt/missing/legacy remote assets show unavailable text and never hotlink.

## Setup

Use Node.js22.13+ on the22.x line or Node.js24+ (including Render deployment), matching PDF.js runtime requirements. Install dependencies with npm install. Install Chromium once during development/deployment with npm run visuals:install-browser (Linux deployment can use npx playwright install --with-deps chromium). Browser installation is deliberately separate from app build. Set PLAYWRIGHT_BROWSERS_PATH to the installed cache location consistently for installer and server. Local QA uses workspace/.cache/ms-playwright. No existing authenticated browser sessions, cookies or login are used.

The existing visual model/router identifiers are preserved. The same configured model performs image inspection; there is no silent substitute. This needs working Gemini credentials and model access. Search result discovery and paid-site accessibility cannot be guaranteed. Request failures never become fictional evidence.

## Persistence and offline reading

The existing PostgreSQL report JSONB persistence stores the full inline assets without a new schema or object-store service. Memory-only operation is not durable. Reports already fetched into the app can display stored pixels without image-host access. Sources are still external citations and acquisition needs network access. A PDF/HTML export must embed these stored bytes; this change does not add an export feature.

Dashboard and list responses carry text and image metadata without raster bytes. Opening a report uses the full detail endpoint. The browser cache keeps at most the three newest reports, including stored images once opened; matching image bytes survive later metadata-only dashboard refreshes. Reopening a complete cached report needs no new server/image-host request. Under quota pressure whole oldest browser copies are evicted, keeping complete images in the remaining copies. PostgreSQL originals are unaffected.

Reports expire seven times24 hours after createdAt. APIs and browser copies exclude expired reports. A server task runs at startup and every minute, independently of market scans, physically deleting expired PostgreSQL report rows (including inline images) and clearing report links/derived catalyst summaries from events. Failures are retried; an unavailable/stopped server executes cleanup when it resumes. Provider-managed database backups/WAL follow the provider retention policy; this task deletes active application records, not historical infrastructure backups. Existing old reports are subject to this policy after deployment.

## Network and work limits

Public HTTP(S) only, no credentials or nonstandard ports. Every DNS result must be public; native requests pin the validated address and revalidate redirects. Browser subrequests pass through the same guarded fetch; service workers, websocket connections and non-GET/HEAD requests are blocked. Input documents max12MB; browser resources4MB each,65 requests/30MB total; render/capture10M pixels; PDF up to2 pages; max4 multimodal reviews per source;60-second overall source deadline;4 captured web elements (selected from at most60 DOM candidates). Captures are re-encoded after real raster decoding. Chromium contexts close after every lead. Discovery and capture failures are recorded in retrievalLog without leaking private configuration.

## Verification

npm run lint and npm run build are the repository checks. Focused tests cover retrieval order, stopping/budget, failed-source fallback, real PNG decoding/checksum, rejected private URLs/redirects/oversized bytes, actual DOM screenshots, actual PDF cropping and actual modal display. Test fixtures are clearly labeled and are not runtime assets.

## Existing reports

Existing reports with external image URLs are not automatically migrated or fetched when opened. Their remote images show an explicit unavailable fallback. Re-enrich the report through the existing research workflow to acquire and persist original figures and reusable photos. This change does not rewrite historical database records.
