# voriongit/cognigate-www — greenfield repo

A brand-new Astro repo for cognigate.dev. Built on @vorionsys/design-tokens v0.1.

## Create the repo

```bash
gh repo create voriongit/cognigate-www --private --description "Cognigate marketing site"
gh repo clone voriongit/cognigate-www
cd cognigate-www
```

## Drop in these files

Copy the entire contents of `migration/cognigate-www/` into the new repo root. Then:

```bash
npm install
npm run dev   # → http://localhost:4321
```

## Deploy to Vercel

```bash
git add -A
git commit -m "feat: initial cognigate.dev site (Astro + @vorionsys/design-tokens)"
git push -u origin main
```

In Vercel dashboard:
1. Add Project → import voriongit/cognigate-www
2. Set custom domain: `cognigate.dev`
3. Done. Pushes to main auto-deploy.

## Routes shipped

- `/` — homepage (5-stage pipeline, latency band, SDKs, conformance)
- `/playground` — interactive policy editor (6 scenarios, animated decision + chain)

## What's still to do (v0.2)

- `/docs` — pull from voriongit/cognigate/docs at build time
- `/changelog` — pull from voriongit/cognigate/CHANGELOG.md
- `/status` — read live from cdn.cognigate.dev/v1/health
- Replace the live-ticker mock in /playground with the real basis://chain reader
