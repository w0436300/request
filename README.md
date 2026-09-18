# Fieldwork

Internal delivery operations prototype for a commercial design-and-build company.

```sh
npm ci
npm run dev
```

Open [the local preview](http://127.0.0.1:8089/app.html). Use the account switcher to simulate employees; Paws & Care Veterinary Hospital (`PR-061`, Harbin) demonstrates packages, specialist milestones, internal review and external dependencies.

```sh
npm test
npm run test:browser
npm run test:ui
```

Browser tests require the local preview and installed Google Chrome. Runtime remains the custom DCLogic setup; Node dependencies are development-only. Changes are stored in the current browser.

See [implementation and validation notes](docs/fieldwork-operations.md) and the [baseline audit](docs/fieldwork-audit.md). GitHub Pages still deploys `Fieldwork.dc.html` as `app.html` from `main`, with the existing password configuration.
