# Free Render deployment

This target serves the same 12-game React/Three.js arcade and authoritative multiplayer engine on Node 22. It is independent of the Cloudflare/Sites deployment.

Build from the arcade-3d directory: `npm install --include=dev && node hosting/render/build.mjs`

Start: `node dist-render/server.mjs`

Set NODE_VERSION to 22.22.0. Health endpoint: `/health`.

The free service uses temporary SQLite storage. Rooms expire after 24 hours or whenever Render sleeps, restarts, or deploys. Room scores are temporary; solo garden saves remain in the player's browser. Render may take about a minute to wake after 15 idle minutes. Free service hours are shared with other free services in the workspace.
