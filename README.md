# ShareHub Market API

A small Next.js serverless API intended for deployment to Vercel. It fetches live market data and NEPSE index data through [`@rumess/nepse-api`](https://www.npmjs.com/package/@rumess/nepse-api).

## Endpoint

`GET /api/market` returns:

```json
{
  "liveMarket": [],
  "nepseIndex": [],
  "fetchedAt": "2026-01-01T00:00:00.000Z"
}
```

The actual fields and values are provided by the upstream package. Successful responses advertise a 60-second shared cache with up to 5 minutes of stale-while-revalidate. This uses Vercel's CDN cache; it is best-effort, not a durable database, and cache behavior can vary across deployments/regions. Errors return HTTP 502 and are not cached.

## Local development

Requires Node.js 20.9 or newer.

```sh
pnpm install
pnpm dev
```

Open `http://localhost:3000/api/market`.

## Deploy to Vercel

1. Push this folder to a Git repository (or import the repository and set Vercel's **Root Directory** to `sharehub-api`).
2. Deploy with the Next.js framework preset. No API key is needed for the current package interface.
3. Use `https://<your-project>.vercel.app/api/market` as the app's backend URL.

If the upstream NEPSE certificate fails verification, first test normal mode. Only if necessary, set `ENABLE_INSECURE_TLS=true` in Vercel project environment variables and redeploy. This uses the package's certificate-verification bypass and weakens connection security; keep it disabled otherwise.

The package is unofficial and depends on NEPSE's upstream service and behavior. Availability, response shape, and any upstream limits are outside this backend's control. Do not call this endpoint excessively; the cache reduces but does not eliminate upstream requests.
