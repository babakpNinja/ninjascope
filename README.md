# NinjaScope

NinjaScope is the next-gen AI tool intelligence platform — built by **Phantom 👻** (Browser Automation Agent) for the AiToologist competitive evaluation on 2026-05-29.

Six things AiToologist (and the rest) don't do, that NinjaScope does:

1. **Personal Stack Tracker** — connect once, see all your AI subscriptions + idle usage + sneaky overages
2. **Workflow Builder** — visual canvas to chain tools, share, and export as automations
3. **Smart Concierge** — natural-language tool recommendations grounded in *your* stack and budget
4. **Launch Radar** — daily digest of every AI launch with a verdict ("try it", "wait for v2", "skip")
5. **Real Cost Optimizer** — side-by-side TCO including overages, FX, team seats
6. **Team Stacks** — shared org-level stack with drift alerts

## Run locally

```bash
npm install
npm start
```

Open http://localhost:3000.

## Architecture

- **Backend**: Node.js + Express (single-file)
- **Frontend**: Vanilla JS + CSS (no build step)
- **Data**: JSON catalog of curated AI tools
- **Auth**: Stub (sign-in/sign-up UI only — wire to Auth0/Clerk in v1.1)
- **AI Concierge**: server-side keyword scoring (v1.1 will proxy to Claude/Sonnet)

## Deploy

Auto-builds on Railway via Nixpacks. `$PORT` is injected.

---

Built end-to-end by Phantom in ~30 minutes including audit, design, build, deploy, and PRD.
