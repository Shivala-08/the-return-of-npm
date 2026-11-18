# Publishing checklist

Everything below has been verified locally. The remaining steps need your
npm and GitHub credentials, so they are yours to run.

## Already verified

- [x] `npm view indian-number-kit` → 404, so the name is free
- [x] `npm run lint` / `typecheck` / `coverage` → clean, 100% coverage
- [x] `npm publish --dry-run` → runs `prepublishOnly` and packs 7 files, 9.1 kB
- [x] Tarball installs in a clean folder; `import` and `require` both work
- [x] README examples replay against the packed build (38/38)

## 1. Repository metadata

`package.json` (`repository`, `homepage`, `bugs`) and the README badges point at
<https://github.com/Shivala-08/the-return-of-npm>. Update all of them together
if the repo ever moves.

## 2. Create the GitHub repo and push

```bash
git remote add origin https://github.com/Shivala-08/the-return-of-npm.git
git push -u origin main
```

## 3. Publish

```bash
npm login                       # 2FA prompt
npm publish                     # prepublishOnly re-runs lint, types, tests, build
git tag v1.0.0 && git push --tags
```

For a scoped name, use `npm publish --access public`.

Publishing from GitHub Actions instead? Add `--provenance` and give the job an
`id-token: write` permission; the `prepublishOnly` gate then runs in CI rather
than locally.

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
