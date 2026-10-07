# Spot Terminal

A frontend-only Binance Spot market terminal. It shows public market data; it does not place orders, use API keys, or run a backend.

## Local setup

Use Node.js 20.19+ or 22.12+ and npm (this repository has a `package-lock.json`).

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To check a production build locally:

```sh
npm run lint
npm test
npm run build
npm run preview
```

`npm run build` runs `tsc -b && vite build` and writes the static site to `dist/`.

## How it works

- React, TypeScript, Vite, and Tailwind render the terminal. Lightweight Charts renders candles and volume.
- TanStack Query fetches REST snapshots and handles caching/retries. `src/api/binance-client.ts` contains the typed HTTP client; `src/hooks/` contains the queries.
- `src/api/market-stream.ts` owns one combined WebSocket connection for the active market. Live candles, ticker, top-20 order book, and trades come through that connection. The browser connects directly to Binance, not through Vercel.
- Zustand keeps the selected symbol, interval, and favorites. These preferences are stored in localStorage; search input and the mobile panel selection stay local to their components.
- If live data cannot load, the UI offers an explicitly labeled offline fixture demo. Fixtures are never silently shown as live data.

Public Binance hosts used by the browser:

| Transport | Host | Endpoints or streams |
| --- | --- | --- |
| REST | `https://data-api.binance.vision` | `/api/v3/exchangeInfo`, `/api/v3/ticker/24hr`, `/api/v3/klines`, `/api/v3/trades` |
| WebSocket | `wss://data-stream.binance.vision:443` | Combined `/stream?streams=...` with `<symbol>@kline_<interval>`, `<symbol>@ticker`, `<symbol>@depth20@100ms`, and `<symbol>@trade` |

## Vercel

Import this repository as a Vite project, with the repository root as the Root Directory. Use `npm ci` for installation, `npm run build` for the Build Command, and `dist` for the Output Directory. No environment variables or server functions are required.

The app currently has only the `/` page and no client-side router, so it does not need an SPA catch-all rewrite. If routes are added later, configure refresh handling for those routes then.

For a CLI deployment, run from this directory with a valid Vercel account:

```sh
npx vercel login
npx vercel link
npx vercel deploy --prod
```

The deployment URL is printed by the CLI. Open it in a browser and check that the market list, chart, book, and trades load; change symbols and intervals, then refresh. Browser access to Binance REST and WebSocket hosts can vary by network or region, so a successful build alone does not prove live data works there.

## Known limitations

- Spot public data only: no authentication, orders, balances, futures, or backend.
- The order book is a replacement top-20 snapshot, not a reconstructed full depth book.
- Binance rate limits, regional restrictions, ad blockers, browser policies, or network loss can make live data unavailable. Use the labeled offline fixture demo when offered.
