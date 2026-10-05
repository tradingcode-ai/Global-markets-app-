# 3D logo loading architecture and master prompt

## Document status

This document describes the verified loading-logo implementation and the durable execution contract for future agents. It was written against the main branch baseline commit dbe9887a8b7618d50d21bcf7038ae7a8e26e347b on 2026-10-05. Re-check the files before relying on line-level details.

This is a loading-animation architecture document. It is not an instruction to change static brand marks elsewhere in the application.

## 1. Verified current architecture

### Entry point and owner

The loading animation is implemented in src/components/StockLogoLoader.tsx.

src/components/CompanyDetailModal.tsx imports StockLogoLoader and renders it in the company-detail loading flow. The loader accepts:

- ticker;
- optional onComplete callback;
- optional className.

The loader calls onComplete after a fixed 1.5 second timer and cleans up that timer on unmount.

### Rendering stack

StockLogoLoader uses:

- React hooks and a React error boundary;
- motion/react for the overlay transition;
- @react-three/fiber Canvas;
- three and three-stdlib SVGLoader;
- @react-three/drei for Center, Environment, PerspectiveCamera, Float, ContactShadows, and useTexture.

The overlay is a white, full-area, high-z-index container. The Canvas uses shadows, device pixel ratio [1, 2], a perspective camera at [0, 0, 8] with field of view 40, ambient and directional lights, a city Environment preset, and ContactShadows.

### Asset source selection

StockLogoLoader imports these loading inputs from src/components/StockLogo.tsx:

- BRAND_ICONS: ticker-to-Simple Icons slug mapping;
- OFFICIAL_DOMAINS: ticker-to-company-domain mapping;
- OFFICIAL_FAVICON_FIRST: ticker set that prefers a domain-based raster source;
- SIMPLE_ICONS_VERSION: currently 16.32.0.

For SVG candidates, the current URL pattern is the jsDelivr Simple Icons package URL. For raster candidates, the current fallback sequence is:

1. logo.clearbit.com;
2. icon.horse/icon;
3. Google S2 favicon.

These are distinct external sources. They must not be described as official company APIs unless verified as such. A future task must record the exact source URL and licensing or usage uncertainty for every approved loading asset.

### Current 3D paths

SvgLogo3D loads an SVG with SVGLoader, converts each SVG path to shapes, and creates an ExtrudeGeometry for each shape. The geometry has depth, bevel thickness, bevel size, and bevel segments. The resulting meshes use a dark slate MeshPhysicalMaterial and are placed in a centered Float group with gentle rotation.

This is the reference path for a real logo-shaped 3D object. It must preserve holes, separated parts, proportions, and brand colors when the approved source contains them.

### Current square fallback and confirmed defect

RasterBox loads a raster texture and maps it onto the faces of a box mesh. Its geometry is boxGeometry with dimensions [2.5, 2.5, 0.25]. This is a rotating rectangular object with a logo image on its faces, not 3D logo geometry. It is the confirmed source of the reported spinning-square behavior.

A future implementation must not call this object a 3D logo. If a real logo-shaped geometry cannot be loaded, the fallback must be a recognizable static logo or an explicit non-animated state, never a rotating box or cube.

### Error and resource lifecycle

The current error boundary switches between SVG and raster attempts after render errors. Suspense is used around asynchronous loaders. The loader timer is cleaned up. The current implementation must be audited for disposal of created geometries, materials, textures, and renderer resources when changing ticker or unmounting. Any fix must remain limited to the loading animation and must not create a shared-resource disposal bug.

## 2. Target architecture

The target pipeline is:

1. normalize ticker;
2. resolve a loading-only approved asset record;
3. prefer a vector asset whose contours can become geometry;
4. parse the SVG into shapes, preserving holes and separate paths;
5. extrude and bevel the actual logo contours;
6. apply the approved logo colors/material treatment;
7. center and scale by measured bounds;
8. animate the logo-shaped group with smooth rotation and optional float;
9. honor reduced-motion preferences;
10. dispose resources on replacement and unmount;
11. use a recognizable static fallback if geometry cannot be created.

The implementation may share proven parsing or lighting helpers with existing code, but it must not alter the static StockLogo rendering contract. If the same source registry is needed by both surfaces, add an adapter or loading-specific manifest instead of changing unrelated behavior.

## 3. Master prompt for the 3D logo-loading task

You are the main agent, orchestrator, and independent auditor for the Global Markets 3D logo-loading task.

### Objective

Improve only the 3D logo animations shown while the company-detail loading flow is active. The actual logo contour must be the rotating 3D object. An image mapped to a square, plane, card, or cube is not an acceptable result.

Use the existing Apple and Google loading results as visual references where they are verified to work. Match their quality level in depth, lighting, material, scale, centering, and smooth movement while preserving each brand's real proportions, colors, holes, and separate parts.

Do not modify static logos elsewhere in the application. Do not modify the Global News Agent, financial data, data providers, calculations, API logic, or unrelated components.

### Phase A — Main inventory and architecture

The main agent must:

- read AGENTS.md and this document;
- inspect the current StockLogoLoader, StockLogo, CompanyDetailModal, package scripts, and relevant call sites;
- inspect the working Apple and Google loading paths;
- inventory every affected ticker and classify the defect as source selection, SVG parsing, geometry, mapping, transparency, error fallback, or rendering;
- identify the smallest file set required;
- preserve the existing user changes and record any uncertainty.

The main agent must never infer the implementation from the old agents/ files. The code is authoritative.

### Phase B — Main-only internet research and asset approval

Only the main agent may search the internet and select replacement logo assets.

For each affected logo, prefer a reliable first-party or clearly licensed vector source. Inspect the exact asset, not only a search-result thumbnail. Reject assets with backgrounds, watermarks, rectangular frames, incorrect wordmarks, wrong variants, or contours that cannot become the actual logo geometry.

Record for each approved asset:

- ticker and brand;
- exact source URL;
- exact file type and version;
- whether it is vector and suitable for SVGLoader or needs a documented conversion;
- how holes and separate paths are represented;
- color and proportion notes;
- usage or licensing uncertainty.

Do not fabricate or redraw a brand logo. Do not present third-party or fallback sources as official without evidence. The Builder and Tester do not search for substitute assets.

### Phase C — Builder brief

Delegate a bounded implementation brief containing only the approved asset set and verified target files.

The Builder must:

- remove the rotating-box behavior from the loading path;
- ensure the visible rotating object has the actual logo contour;
- preserve holes, separate parts, colors, proportions, centering, and consistent scale;
- keep the existing loading callback and overlay behavior unless a change is required;
- implement robust loading and error handling;
- dispose geometry, materials, textures, and related resources correctly;
- respect prefers-reduced-motion;
- use a recognizable static fallback when real geometry fails;
- avoid changing static StockLogo surfaces, financial logic, news logic, or dependencies unless explicitly approved;
- report changed files, asset choices, tests, and limitations.

### Phase D — Tester brief

The Tester independently verifies the result and does not accept the Builder's report as evidence.

For every affected ticker, verify:

- the actual loading animation at runtime;
- multiple rotation angles, including side views;
- real logo silhouette rather than a rectangle, cube, or placeholder;
- holes, disconnected parts, color, transparency, depth, scale, and centering;
- repeated loading and ticker changes;
- missing or failed asset behavior;
- reduced-motion behavior;
- console errors, missing resources, leaks, and layout shifts;
- relevant viewport sizes;
- unchanged static logos elsewhere;
- unchanged Global News Agent and other protected behavior.

Run the repository's available checks: npm run lint and npm run build, plus focused tests where available. Capture screenshots or short recordings when visual evidence is required. Explicitly list checks that were not possible.

If a defect is found, return a precise file-level defect report to the Builder. After a fix, repeat the affected verification.

### Phase E — Main final audit

The main agent must:

- inspect the complete diff and confirm scope;
- verify that the approved asset URLs and files are actually used;
- compare each affected animation to the Apple/Google reference quality;
- confirm that no rotating square, plane, cube, or logo-on-card fallback remains;
- confirm that static logos, financial functionality, and Global News Agent files are unchanged;
- review tester evidence and rerun or reject unsupported claims;
- require another Builder–Tester cycle for unresolved defects;
- report PASS, FAIL, or BLOCKED with evidence.

### Model gate

Before delegation, verify exact availability:

- Builder: Opus 5.5, medium;
- Tester: Flash 3.8, high.

If either exact model or setting is unavailable, stop before delegation and report the blocker. Do not silently substitute another model or claim that the requested model was used.

### Acceptance criteria

The task passes only when:

- every identified broken loading animation uses actual logo-shaped 3D geometry;
- no affected loading animation uses a rotating square, plane, cube, or logo-on-card as its logo representation;
- approved assets are traceable to inspected sources;
- colors, proportions, holes, separate parts, scale, lighting, depth, and motion are correct;
- fallbacks are recognizable and non-deceptive;
- reduced motion and cleanup are handled;
- relevant lint, typecheck, build, and focused checks pass;
- visual evidence exists per affected ticker;
- static logos, financial systems, and the Global News Agent remain unchanged.

## 4. Evidence and change log

At the verified baseline, the confirmed implementation defect is the RasterBox boxGeometry path in StockLogoLoader.tsx. This document intentionally does not claim that replacement assets have already been researched or approved. Asset research and runtime visual verification are separate execution steps and must be recorded with exact evidence when performed.


## 5. Runtime prompt templates

The repository stores the prompt templates used by the BTA workflow:

- agents/prompts/main-system.md
- agents/prompts/builder.md
- agents/prompts/tester.md

The Main Agent must inject the main prompt and explicitly pass the Builder and Tester role prompts at delegation time. These files describe behavior and boundaries; they do not themselves grant tools, skills, repository permissions, or model access.
