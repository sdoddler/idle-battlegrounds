# Validation Record

Validation performed in the ChatGPT build environment on 2026-08-20.

## Passed

- `npm run validate`
  - syntax-checks all project `.js`, `.mjs`, and `.cjs` files;
  - checks required project files;
  - checks relative ES-module imports resolve to project files;
  - rejects `Math.random()` usage inside the deterministic simulation folder.
- `npm test`: **6/6 tests passed**
  1. same manifest + no human decisions reproduces identical state;
  2. different human choices through the DecisionSystem produce divergent match histories;
  3. different render-frame cadence produces identical fixed-timestep state;
  4. mock manifests instantiate 25 squads / 100 characters;
  5. ignored decisions auto-resolve through their default option;
  6. the modular rig builds with an independent weapon layer and samples all required animations using a lightweight Pixi-compatible test stub.
- Full-match simulation soak tested with five independent seeds. Every run completed to one surviving squad without exceptions or simulation deadlock.
- The project was copied to a different arbitrary filesystem path and `npm run validate` passed again there.
- Source scan found no Idle Space Company repository/path imports or dependencies.

## Dependency installation / GUI limitation

`npm install --no-audit --no-fund` was attempted twice. The build environment could not resolve `registry.npmjs.org`; npm reported `EAI_AGAIN` while requesting the PixiJS package manifest. Because the real Electron/Pixi dependencies could not be downloaded here:

- a real Electron GUI startup smoke test could **not** be performed;
- `electron-builder` packaging could **not** be executed;
- no `package-lock.json` was generated.

The source ZIP intentionally does not contain `node_modules`. On a normal networked development machine, run:

```bash
npm install
npm run validate
npm start
```

Then use `npm run build` when ready to test packaging.
