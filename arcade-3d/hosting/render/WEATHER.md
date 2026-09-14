# Living world weather

World location is a core game setting. Manual search uses Open-Meteo geocoding (GeoNames). Country-only searches resolve to that country's capital; city searches retain region/country disambiguation. Country-capital data comes from https://download.geonames.org/export/dump/countryInfo.txt (GeoNames, CC BY 4.0). No GPS or weather API secret is used.

The server fetches current weather and sunrise/sunset by coordinates and IANA timezone, maps WMO codes through WeatherAdapter (with MET Norway location forecast and sunrise as a backup provider), and shares a 20-minute memory/SQLite cache across rooms. Failed requests retain stale conditions or use explicitly labelled partly cloudy fallback with unknown temperature. The data is an approximation of current conditions from the weather provider, not a sensor at the exact map point.

Solo/private locations, recent places, favourites, inventory, decorations and garden progress persist on each player's device. Joining a room switches rendering to its server-authoritative world; it never overwrites the private world. Shared location, weather, time mode, proposals and inventory are stored in the existing rooms JSON transaction, preserving atomic compare-and-swap updates rather than duplicating authority across tables. Cached weather is stored in weather_cache. No account identities are invented.

Either player can propose a location/time-mode change; only the other player can accept. Proposals expire in five minutes. A one-player room can select directly. Every client receives the same weather snapshot, server clock, location and time mode. Particle positions are rendered locally. All twelve scenes use WeatherEffects; rain improves new plant growth, warm weather gives a small growth bonus, fishing offers weather species, and weather quests award resources and persistent decorations. Sound is opt-in; reduced-motion preferences reduce effects.

The current game offers a shared garden challenge and temporary rooms, not permanent account-backed estates. Render Free loses its SQLite data on restart, sleep, or deployment. Private device saves survive those server events. Open-Meteo's free endpoint is intended for non-commercial use; consult its terms before monetizing.

Verification: TypeScript; existing game/runner tests; tests/weather.test.cjs covers normalized weather codes, timezone and hemisphere, cache/fallback behavior, multiplayer consent, matching weather state, declines, and duplicate collection requests. Real-device visual testing is still required for phone-specific GPU/audio behavior.
