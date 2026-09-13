# Tap Together — Sky Dash 3D, free-tier hosting

This folder contains the complete built game. No ChatGPT sign-in is used by this copy.
It is ready to publish but is not already live on Cloudflare.

## Windows

1. Create a free account at https://dash.cloudflare.com/sign-up.
2. Install Node.js 22.13 or newer from https://nodejs.org if needed.
3. Extract this entire ZIP into a folder. Double-click **Deploy-Windows.cmd**.
4. Sign in to Cloudflare in the browser opened by the setup. Select your account if asked.
5. Follow the terminal prompts to create the room database and apply its migration.
6. Open the **workers.dev** URL shown after deployment. Create a room and copy its invite link to your partner.

The published game is publicly reachable. A room needs its 8-character code and accepts only two players. Keep your room invite between you. Player tokens are private to each browser. Names, round scores and game state are stored in the room database; rooms expire after 24 hours. Closing the browser does not immediately remove the stored room. Expired records remain in your database until you delete them.

## macOS / Linux / terminal

From this folder, run:

    npm install
    npm run deploy

No game build is needed. Setup logs you in, creates a D1 database, applies the included SQL migration and publishes the Worker. It reuses the saved database on later runs. Keep the folder after deployment, especially wrangler.json.

## Twelve animated 3D games

Sky Dash is an animated WebGL 3D runner with a bunny, a turtle, floating gardens, lane changes, jumping, pink hurdles, collectable stars, recharging boosts, chase/wide cameras, and online two-player races. The other nine games also have interactive 3D play tables: bouncing hearts, a reaction beacon, rock-paper-scissors objects, heart and star pieces, flipping memory cards, falling Connect Four discs, a floating crystal ball, letter blocks, and mood ornaments. All have equivalent keyboard-accessible buttons or input controls.

Click **Try solo practice** to play against the turtle immediately without creating a room. For online play, create a room and invite your partner. Both players tap **I’m ready**. Controls: A/Left, D/Right, Space/Up to jump, Shift to boost; touch buttons work on phones. All games adapt to portrait and landscape layouts; device pixel density is capped to reduce graphics load. First to 240 metres wins.

Use a modern browser with WebGL2 and hardware acceleration. Graphics run on each device. Solo practice is temporary on-device gameplay; online race results live in the room.

## Frog garden: solo or together

Lily & Lumi is an original frog garden inspired by cosy gardening games. Plant three flower varieties, water and harvest, spend petals on growth upgrades, and enjoy sunshine, rain and moonlight. Rain speeds up newly planted seeds. Solo progress saves in this browser on this device; clearing browser storage removes it. Growth continues while you are away. Solo progress is separate from online room scores.

For co-op, create a room, invite your partner, and both ready up. Harvest 12 flowers together in three minutes to earn two room points each. You share plots, petals and upgrades. A new round starts a fresh garden; room scores stay for 24 hours. This is an original game, not an embedded Google game.

## Moonpond Anglers

A new 3D fishing challenge supports 90-second solo rounds and two-player online duels. Cast, watch for green, then reel within the bite window. Three fish species award different pond points. Catch streaks earn bonuses while making the bite window shorter. First to six catches wins online; at timeout, most pond points wins. Solo fishing rounds are temporary. Keyboard: Space to cast/reel, or use touch buttons.

## What is included

Moonpond Anglers, Lily & Lumi: Frog Garden, Bunny & Turtle: Sky Dash 3D, Heart Hunt, Ready Set Love, Paw Paper Scissors, Hearts & Stars, Berry Good Memory, Four in Bloom, Lucky Little Number, Love Letter Shuffle, Same Wavelength.

Room scores: win +3, tie +1, matching emoji choices +2 each. Both players can send emoji reactions, reconnect to their saved room, and vote to end a stuck round. New rounds preserve the room score.

## Free plan limits (checked 11 September 2026)

Choose **Workers Free**, not Workers Paid. Setup does not upgrade your account or add a paid subscription. If your account is already on a paid plan, check its billing before publishing.

- Workers: 100,000 requests per day, 10 ms CPU per invocation.
- D1: 5 million rows read/day, 100,000 rows written/day, 5 GB total storage.
- workers.dev address: no custom domain purchase needed.

Limits are account-wide. This is intended for a small personal arcade, not a large public game service. Exceeding free daily quotas may temporarily prevent play. Speed games show device-measured reactions and server-synchronised progress; network latency can affect races. This is a friendly arcade, not a competition with cheat protection.

Official pricing:
https://developers.cloudflare.com/workers/platform/pricing/
https://developers.cloudflare.com/d1/platform/pricing/

## Validation

The 3D runner was checked for hurdle collisions, jump clearance, lane limits, boosts, star collection and tied finishes. All twelve game engines were checked for winning rounds and score-preserving rematches. Additional checks cover hidden answers, turn enforcement, memory-card delays, concurrent room joins, wrong credentials, and unchanged-state polling. The app passed its TypeScript check and production build. Live browser and real two-country latency tests were not performed. The publishing workflow was prepared and its bundle was checked locally; external publication requires your Cloudflare sign-in.

## Troubleshooting

- If a room expires, create a new room and invite your partner again.
- Keep both tabs visible during speed games. Background tabs poll less often to reduce free-tier usage.
- If the connection drops, keep the same browser and reopen the site. Your saved player token reconnects you.
- If setup fails after creating the database, keep wrangler.json and rerun npm run deploy; do not delete it and create duplicate databases.
- If you own multiple Cloudflare accounts and setup asks for an account ID, add the intended account_id to wrangler.json using the ID shown in your Cloudflare dashboard.

## Source code

The `source/` folder contains the application source and its dependency lockfile for a GitHub repository. It excludes the private Sites project identity. The top-level prebuilt deployment remains ready to publish without rebuilding the source. GitHub access and Cloudflare login are separate connections.

Recent fixes protect startup when browser storage is blocked, validate saved garden data, preserve failed guesses, dispose replaced 3D pieces, and improve tablet layouts and race keyboard controls.

The redesigned arcade includes a top game switcher, distinct world palettes and motions, clearer solo/online labels, a three-step room setup, keyboard focus styles and a responsive game library. Selecting a library game returns to its play area. Saved-room restoration prevents competing room creation, and malformed requests return a clear client error.
