# Deployment on GitHub Pages

`.github/workflows/deploy.yml` builds and deploys the site on every push to `main` (and on manual
dispatch). It validates the dataset and checks the exports first, so an invalid dataset is never
deployed.

## Prerequisites

1. **Pages source**: in _Settings → Pages → Build and deployment_, set _Source_ to
   **GitHub Actions**. Without it, `actions/configure-pages` fails on every run.
2. **Repository visibility and plan**: the repository is private.
   - Pages on a **private** repository requires GitHub Pro (personal accounts), or **GitHub Team or
     Enterprise Cloud** (organizations). On GitHub Free, make the repository public first.
   - A Pages site is **public on the internet even when the repository is private**, except on
     GitHub Enterprise Cloud with access control set to private. Do not publish anything
     confidential.
3. **Environment**: the workflow deploys to the `github-pages` environment, created by GitHub when
   Pages is enabled. Keep its branch protection limited to `main`.

## URLs and base path

The workflow reads the site URL from `actions/configure-pages` and passes it to Astro:

| Setup                    | `SITE_URL`                  | `BASE_PATH`    |
| ------------------------ | --------------------------- | -------------- |
| Default project site     | `https://ovarilo.github.io` | `/openplugdb/` |
| Custom domain configured | `https://openplugdb.org`    | `/`            |

All internal links and asset URLs go through `url()` (`src/lib/format.ts`), which prefixes
`import.meta.env.BASE_URL`, and the Pagefind search loads its files from the same base. The same
sources therefore work at both addresses. Local builds default to `https://openplugdb.org` and `/`.

## Custom domain (later)

The custom domain is **not enabled yet** and no `CNAME` file is committed: enabling it before the DNS
is set would break the site. When the DNS is ready:

1. At the DNS provider, add for `openplugdb.org` the GitHub Pages `A` records (185.199.108.153,
   185.199.109.153, 185.199.110.153, 185.199.111.153) and `AAAA` records (2606:50c0:8000::153,
   2606:50c0:8001::153, 2606:50c0:8002::153, 2606:50c0:8003::153), and a `CNAME` record for
   `www.openplugdb.org` pointing to `ovarilo.github.io`. Check these values against the current
   GitHub documentation before applying them.
2. Optionally verify the domain for the `ovarilo` organization (_Settings → Pages → Verified
   domains_) to prevent takeover.
3. In the repository _Settings → Pages_, set _Custom domain_ to `openplugdb.org` and, once the
   certificate is issued, enable _Enforce HTTPS_. With an Actions deployment, the domain setting
   lives in the repository settings; no `CNAME` file is needed.
4. Re-run the deploy workflow: `configure-pages` then reports the new origin and an empty base path.

## Local check

```sh
bun run build
bun run preview      # http://localhost:4321
```

To reproduce the project-site layout locally:

```sh
SITE_URL=https://ovarilo.github.io BASE_PATH=/openplugdb/ bun run build
```
