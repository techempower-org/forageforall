# Contributing to Forage for All

Thanks for thinking about pitching in. This project only works with many hands.

## Ways to help (ranked by how much we need them)

1. **Pin & confirm finds in your neighborhood.** The map is the product. Use the app.
2. **Add species to the catalog** with accurate toxicity and look-alike data.
3. **Translate** the UI — i18n scaffolding is in the `i18n` branch.
4. **File issues** — bugs, species errors, bad pins you've seen.
5. **Code** — pick up anything tagged `good first issue`.

## Development setup

```bash
git clone https://github.com/techempower-org/forageforall.git
cd forageforall
npm install
cp .env.example .env
# Fill in:
#   INSTANT_APP_ID=           (free at instantdb.com)
#   GOOGLE_MAPS_IOS_KEY=
#   GOOGLE_MAPS_ANDROID_KEY=
npm run schema:push
npm run seed:species
npx expo prebuild --clean
npm run ios
```

## Code style

- TypeScript strict mode
- Prettier + ESLint (runs on pre-commit)
- Components: PascalCase, one per file
- Hooks: `useThing.ts`, return an object not a tuple
- Screen files in `app/` follow Expo Router conventions

## PR flow

1. Fork, branch from `main` as `feat/xxx` or `fix/xxx`
2. Write a short PR description — what, why, screenshots for UI work
3. One reviewer approval + passing CI = merge
4. We squash-merge with a conventional commit message

## What we won't merge

- Ads, analytics, tracking SDKs, or anything that phones home
- Hard dependencies on paid services (beyond Instant free tier + Google Maps)
- Features that weaken location privacy defaults
- Anything that violates [`FORAGING_ETHICS.md`](./FORAGING_ETHICS.md)

## Code of Conduct

Be kind. We follow the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## Licensing

By contributing, you agree your contributions are licensed under AGPLv3.
