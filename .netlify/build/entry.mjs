import { r as renderers } from './chunks/_@astro-renderers_RTh2s7Lh.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_BdK4HqFm.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image/index.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/acg.astro.mjs');
const _page3 = () => import('./pages/api/bangumi-subjects.json.astro.mjs');
const _page4 = () => import('./pages/api/steam-games.json.astro.mjs');
const _page5 = () => import('./pages/archive.astro.mjs');
const _page6 = () => import('./pages/friends.astro.mjs');
const _page7 = () => import('./pages/posts/_---slug_.astro.mjs');
const _page8 = () => import('./pages/robots.txt.astro.mjs');
const _page9 = () => import('./pages/rss.xml.astro.mjs');
const _page10 = () => import('./pages/_---page_.astro.mjs');
const pageMap = new Map([
    ["node_modules/.pnpm/astro@5.13.10_@netlify+blobs@10.7.4_@types+node@24.5.2_jiti@1.21.7_lightningcss@1.29.3_rollup_pjcdygbk45s6z2ntcyuixdrv5a/node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/about.astro", _page1],
    ["src/pages/acg.astro", _page2],
    ["src/pages/api/bangumi-subjects.json.ts", _page3],
    ["src/pages/api/steam-games.json.ts", _page4],
    ["src/pages/archive.astro", _page5],
    ["src/pages/friends.astro", _page6],
    ["src/pages/posts/[...slug].astro", _page7],
    ["src/pages/robots.txt.ts", _page8],
    ["src/pages/rss.xml.ts", _page9],
    ["src/pages/[...page].astro", _page10]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "4aae3d85-c0fc-433f-9237-4720f0e556c6"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
