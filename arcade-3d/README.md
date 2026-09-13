# Tap Together

A responsive browser arcade for two, with 12 animated 3D games. Sky Dash, Frog Garden and Moonpond Anglers also offer solo play.

## Play modes

- **Moonpond Anglers:** timed bites, three fish species, combo rewards, a 90-second solo challenge and online two-player duels.
- **Lily & Lumi:** a device-saved solo garden or a shared timed gardening goal. Plant, water, harvest and upgrade.
- **Sky Dash:** solo practice against a bot or online racing with lane changes, hurdles, stars and boosts.
- Nine other online games: Heart Hunt, reaction timing, rock-paper-scissors, tic-tac-toe, memory, Connect Four, number guessing, word shuffle and matching choices.

Rooms use server-side state, private player tokens, revision checks and idempotent commands. Room scores last 24 hours. Solo garden data stays in the current browser. Multiplayer uses HTTP polling; network latency can affect speed games.

## Development

This is a React/TypeScript, Three.js and Vinext application. Preserve the pnpm lockfile and installed dependency versions. The Worker uses a Cloudflare D1 binding named `DB`; the schema is in `drizzle/`.

Install with `pnpm install --frozen-lockfile`. Use the existing package scripts for development and builds. Sites-owned deployments use the Sites build and package helpers. For a standalone public deployment, use the prebuilt free-hosting package and its `START-HERE.md`; it creates a separate D1 database in your Cloudflare account.

## Verification

Run:

```
node node_modules/typescript/bin/tsc --noEmit
node tests/game.test.cjs
node tests/runner.test.cjs
```

Tests cover winning rounds, rematches, hidden answers, turn checks, simultaneous joins, credentials, gardening economy and save validation, fishing timing and combos, and runner physics. Production compilation is also checked. These are not substitutes for real-device graphics and network testing, which has not been performed.

## Source and publishing

The source download excludes the Sites project identity and contains no Git credentials. GitHub publication requires a repository accessible to the connected GitHub account. Public Cloudflare deployment requires your Cloudflare login. Neither service is configured by putting a password in this repository.
