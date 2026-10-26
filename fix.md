# Security fixes

This document records the security changes made before launch and the configuration required in production.

## Changes made

- **Explicit call consent:** The client now sends a call request first. The recipient sees the caller's name and must accept or decline. Microphone and camera tracks are not added to a peer connection until a call has been accepted and a participant starts the call.
- **Peer-bound signaling:** The server records a pending request and an accepted peer pair. Offers, answers, and ICE candidates are relayed only to the other member of that pair. A participant can end only their active call; the server no longer trusts client-supplied recipient IDs for signaling or hang-up events. The server clears call state on decline, hang-up, room exit, and disconnect.
- **Call request expiry:** Unanswered call requests expire after 30 seconds, and each participant can only be involved in one pending request at a time.
- **Unpredictable private rooms:** Room codes are generated from 16 cryptographically random bytes (128 bits), shown as 32 hexadecimal characters. The server rejects human-readable or malformed codes. Share these codes privately; anyone who has the code can join the room.
- **Origin restriction:** The server checks the browser `Origin` on both the Socket.IO CORS layer and the connection request. Missing origins and origins outside the configured allowlist are rejected.
- **Input and resource bounds:** Names are limited to 1–40 non-whitespace characters; room codes, SDP descriptions, and ICE candidate strings are validated and bounded. Socket.IO payload size is capped at 100 KB, and each connection is limited to 40 events per 10 seconds.
- **Container port correction:** The backend container and Compose mapping now expose the actual signaling port, 3000.

## Production configuration

Set the backend environment variable `FRONTEND_ORIGINS` to a comma-separated list of the exact origins serving the frontend. Include the scheme and port when present, with no path, for example:

```text
FRONTEND_ORIGINS=https://calls.example.com
PORT=3000
```

For multiple frontend origins:

```text
FRONTEND_ORIGINS=https://calls.example.com,https://www.example.com
```

The backend defaults to `http://localhost:5173` and `http://127.0.0.1:5173` for local development. Production must set the allowlist on the PM2 process (or its ecosystem configuration) and restart it with the updated environment. Keep this setting out of the checked-in source if it contains private hostnames.

Set `VITE_SOCKET_SERVER_URL` when building the frontend so it points to the public HTTPS/WSS signaling endpoint used by the browser, for example `https://api.example.com`. Vite embeds this value into the built assets, so rebuild and redeploy the frontend whenever it changes. Serve the site and signaling endpoint over TLS in production; browsers require a secure context for camera and microphone access.

The existing deployment workflow does not define either of these production values. Configure them in the deployment environment before publishing; the frontend's current localhost fallback is only suitable for local development.

## Verification

- Backend TypeScript compilation passed with `backend/node_modules/.bin/tsc -b`.
- Frontend production build passed with `npm run build`.
- Local Socket.IO probes against the rebuilt backend confirmed that arbitrary `cutCall` and `createOffer` events are ignored, weak room codes are rejected, a valid request requires explicit acceptance before signaling is relayed, and an untrusted browser origin is rejected.

## Remaining product limits

The app still has anonymous profiles rather than registered accounts. Lobby display names are self-selected and should not be treated as verified identities. A room code is a bearer invite: anyone who obtains it can use an available room slot. The event limit is per connection, not a global or per-IP denial-of-service defense; use infrastructure-level connection limits and monitoring for a public launch.
