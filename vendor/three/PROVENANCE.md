# vendored: three.js r147 (UMD global build)

## Why vendored, and why r147

The walkable world must open from `file://`. Browsers treat `file://` pages as
opaque origins, so (a) `fetch()` of local JSON is CORS-blocked and (b) ES
module scripts are blocked outright. Three.js dropped the UMD/global build
after r147 (`build/three.min.js` → module-only from r148+). r147 is the last
release that sets a plain `window.THREE` global, which is what lets
`world/index.html` load with zero server and zero bundler.

## Provenance

| field | value |
|---|---|
| package | `three` |
| version | `0.147.0` |
| file | `build/three.min.js` (UMD) |
| fetched from | `https://unpkg.com/three@0.147.0/build/three.min.js` (2026-09-21, 607784 bytes) |
| license | MIT © 2010-2022 Three.js Authors (SPDX header in file) |
| used by | `world/world.js` (classic script, no build step) |

Regenerate: `curl -o vendor/three/three.min.js https://unpkg.com/three@0.147.0/build/three.min.js`
