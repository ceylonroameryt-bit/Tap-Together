# Tap Together

A lightweight real-time two-player browser game for couples and friends who are in different locations.

## Games

- **Tap Rush** — 10-second tapping speed battle
- **Reaction Duel** — wait for green and react faster than your opponent
- **RPS Arena** — online rock-paper-scissors

## Multiplayer

Tap Together uses PeerJS/WebRTC for direct browser-to-browser connections. One player creates a six-character room code and sends it to the other player. No account or dedicated game backend is required.

## Run locally

Because the project is static, you can serve it with any local HTTP server. For example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Deployment

The repository includes a GitHub Pages Actions workflow in `.github/workflows/pages.yml`. Pushes to `main` automatically deploy the current site once GitHub Pages is enabled for the repository with **GitHub Actions** as its source.

## Files

- `index.html` — application structure
- `styles.css` — responsive interface and game styling
- `app.js` — room connection, synchronization, scoring, and game logic

## Notes

Peer-to-peer connectivity depends on WebRTC support and the networks used by both players. Some restrictive corporate, school, carrier, or VPN networks can block direct peer connections.

## Redesigned 12-game 3D arcade

The complete redesigned React/Three.js arcade is in [arcade-3d/](arcade-3d/README.md). It includes twelve distinct game worlds, three solo modes, online rooms, and the gardening and fishing games. This version uses a Cloudflare Worker and D1 database; it needs its own server deployment. The existing root app and its deployment setup are retained.

The latest hosted version is at https://bunny-turtle-race.sujampathir.chatgpt.site (currently owner-private). Public hosting instructions are in [arcade-3d/hosting/cloudflare/START-HERE.md](arcade-3d/hosting/cloudflare/START-HERE.md).
