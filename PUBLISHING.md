# Publishing checklist

Everything below has been verified locally. The remaining steps need your
npm and GitHub credentials, so they are yours to run.

## Already verified

- [x] `npm view indian-number-kit` → 404, the name is still free
- [x] Repository pushed to https://github.com/Shivala-08/the-return-of-npm
- [x] GitHub Actions CI green on Node 18, 20 and 22 (lint, types, coverage,
      build, size budget and a tarball install smoke test)
- [x] `npm run lint` / `typecheck` / `coverage` → clean, 100% coverage
- [x] `npm publish --dry-run` → runs `prepublishOnly` and packs 7 files, 9.1 kB
- [x] Tarball installs in a clean folder; `import` and `require` both work
- [x] README examples replay against the packed build (38/38)

## 1. Repository metadata — done

`package.json` (`repository`, `homepage`, `bugs`) and the README badges point at
<https://github.com/Shivala-08/the-return-of-npm>. Update all of them together
if the repo ever moves.

## 2. Push to GitHub — done

```bash
git remote add origin https://github.com/Shivala-08/the-return-of-npm.git
git push -u origin main
```

`origin` is configured and `main` tracks it; future pushes are just `git push`.

## 3. Publish — the only step left

Nothing in this repo can publish on its own: the npm token stored in `~/.npmrc`
currently returns `E401 Unauthorized` (expired or revoked), and no `NPM_TOKEN`
is available to the agent. Pick one of the two paths below.

### Path A — publish from CI on a tag (recommended)

`.github/workflows/release.yml` publishes when a `v*` tag is pushed, with
provenance, and then verifies the registry copy.

1. Create an npm **Automation** (or granular, publish-scoped) token at
   <https://www.npmjs.com/settings/~/tokens>.
2. Add it as a repository secret named `NPM_TOKEN`:
   ```bash
   gh secret set NPM_TOKEN --repo Shivala-08/the-return-of-npm
   ```
3. Tag the release:
   ```bash
   git tag v1.0.0 && git push --tags
   ```

The workflow refuses to publish if the tag does not match `package.json`.

### Path B — publish from this machine

```bash
npm login                       # browser + 2FA
npm publish                     # prepublishOnly re-runs lint, types, tests, build
git tag v1.0.0 && git push --tags
```

For a scoped name, use `npm publish --access public`.

The registry name check still passes (`npm view indian-number-kit` → 404), so
publish soon if the name matters to you.

## 4. Verify the published package

```bash
mkdir -p /tmp/verify && cd /tmp/verify && npm init -y
npm install indian-number-kit
node -e "const k=require('indian-number-kit'); console.log(k.toCurrency(1234567.5))"
node --input-type=module -e "import {toCompact} from 'indian-number-kit'; console.log(toCompact(12500000))"
```

Expected: `₹12,34,567.50` and `1.25 Cr`.

## 5. If you need to undo a release

Within 72 hours npm allows `npm unpublish indian-number-kit@1.0.0`. Otherwise
publish a patch — that is the normal path for anything shipped by mistake.

## Version checklist for the next release

1. `npm version patch|minor|major` (updates `package.json`, tags the commit)
2. Add the entry to `CHANGELOG.md`
3. `npm publish`
