# Red Zone Chibi Prototype

A standalone Electron + PixiJS 8 prototype for a deterministic 2D side-scrolling squad battle royale. It is intentionally **not** part of Idle Space Company and has no repository/path dependency on it.

## What the prototype demonstrates

- 25 squads × 4 characters = 100 simulated characters.
- One local human squad; 24 deterministic rival bot squads.
- Versioned `MatchManifest` and namespaced seeded PRNG streams.
- Fixed 100 ms simulation tick independent of renderer FPS.
- Deterministic POIs, loot, bot routes, zone movement, combat and utility outcomes.
- A shrinking six-phase Red Zone that damages squads and forces routing inward.
- Automatic movement and combat with player micro-decisions for loot, vehicles, contact posture, utilities and revives.
- Weapons: Pistol, SMG, Assault Rifle, Shotgun, DMR, LMG.
- Utilities: frag, smoke, deployable barrier, medkit and boost.
- Basic cars with faster travel and destructible HP.
- Fully layered placeholder chibi rig with weapons kept separate from body/arms.
- Animations for idle, walk, run, shoot, crouch-shoot, prone-shoot, knocked and dead.
- Squad cosmetic customisation through item IDs rather than baked sprites.
- Rig debug/asset-authoring panel with layer selection, animation preview/scrub, X/Y/rotation/scale/pivot edits and JSON copy.
- Mock matchmaking and inventory providers that can later be replaced by Steam-backed implementations.
- Frameless/resizable/transparent-capable Electron desktop window with persisted position, alpha, opacity, always-on-top and optional click-through.

## Run

Requirements: Node.js 20+ recommended.

```bash
npm install
npm start
```

The mock lobby launches immediately when **PLAY BOT LOBBY** is pressed.

## Validation

```bash
npm test
npm run validate
npm run build
```

`npm test` verifies:

1. identical seed + manifest + no human decisions produces the same state checksum;
2. a different player decision produces an intentional branch;
3. different render-frame cadence produces the same fixed-timestep simulation result.

`npm run validate` also syntax-checks project JavaScript, checks required paths and rejects `Math.random()` inside the match-simulation folder.

## Controls / UX

This is an indirect-control game. Characters move and shoot automatically. When opportunities appear, a decision card presents short choices. Ignoring the card lets its deterministic/default choice resolve automatically, so the match can continue almost idle.

The top-right menu during a match opens desktop settings. From the main menu you can open squad customisation and Rig Debug.

## Deterministic architecture

A match starts with a manifest containing a seed plus simulation/map/loot/rules versions and the 25-squad roster. Random work is namespaced (`WORLD`, `LOOT`, `ZONE`, squad IDs, combat events, etc.) so unrelated random calls do not shift a single global PRNG stream.

This supports the intended future model: 25 real entrants can receive the same manifest, then each machine independently simulates its own 100-character reality. The local human's decisions are allowed to branch that reality. There is no requirement for all 25 resulting histories to remain authoritative or identical.

## Steam matchmaking transition

`renderer/game/platform/MatchmakingProvider.js` defines the boundary. `MockMatchmakingProvider` currently makes a manifest instantly. A future `SteamMatchmakingProvider` should only need to obtain the real lobby roster and agreed manifest, then return the same shape to `Game`. Core simulation should not care where entrants came from.

## Steam Inventory transition

`InventoryProvider` is likewise abstracted. `MockInventoryProvider` stores development item IDs and can simulate a free cosmetic drop. A future Steam Inventory implementation should return the same item definition IDs/slot metadata. Character customisation consumes IDs, not Steam-specific objects.

The intended commercial direction is compatible with a low-cost paid Steam title with free random cosmetic drops; this prototype does not implement paid keys or loot-box purchases.

## Replacing placeholder body parts with PNG sprites

`RigRenderer` owns one Pixi container per layer. Replace each vector-drawing block in `redraw()` with a `PIXI.Sprite` loaded from your sprite atlas while retaining the layer container and pivots. Suggested production layers are:

`backpack → rearLeg → frontLeg → torso → vest → rearArm → head → face → hair → helmet → weapon → frontArm → hands`

The weapon is deliberately its own layer. Cosmetic item definitions already resolve by slot, so a sprite-atlas asset ID can replace the current placeholder colour/shape metadata without changing animation definitions.

Use **Rig Debug** to fit each imported sprite. Copy/export the transform JSON and make those offsets the default for that asset or animation.

## Save data

Electron writes JSON under its normal `userData` directory. It persists:

- window size/position;
- transparency/opacity/view-scale/always-on-top/click-through settings;
- mock inventory IDs;
- four squad members' cosmetic selections;
- rig transform adjustments.

No database is used.

## Known MVP limitations

- Side-scroller AI uses a 1D world coordinate and squad-level routing rather than navmesh/pathfinding.
- Buildings are visual POIs rather than enterable interiors.
- Combat intentionally abstracts ballistics, individual vertical positions and line-of-sight.
- Revives are simplified; there is no explicit crawl animation or manual flush action yet.
- Car noise/encounter weighting is only partially represented by faster movement/contact frequency.
- The mock inventory does not implement real Steam tradability/marketability.
- Placeholder rig pieces are vector shapes, not the production chibi art.

## Highest-value next steps

1. Import the modular chibi PNG rig and turn debug transforms into asset-specific anchor metadata.
2. Add deterministic replay/input logging and compact post-match result validation.
3. Improve combat with explicit cover segments, vertical stance hitboxes, suppression and clearer grenade/barrier effects.
4. Expand vehicles with motorbikes, seats, vehicle-specific rig poses and vehicle destruction decisions.
5. Replace mock platform adapters with Steamworks lobby/inventory implementations only after the offline simulation and replay contract are stable.
