# Cryptra phase status (codebase)

Last updated via automated completion pass on GitHub.  
**Production VPS verification is separate** — requires SSH to `5.75.205.142`.

## Phase checklist

| Phase | Scope | Code status | Runtime verified |
|-------|--------|-------------|------------------|
| 1 Deploy recover | `scripts/recover-server.sh` | DONE | NO (no VPS) |
| 2 Schema align | activity `fromToken`/`toToken`, rewards `userReward` | DONE | NO |
| 3 Tests | core fees, levels, liquidation, security idempotency | DONE in repo | CI on push |
| 4 Hyperliquid | public info + agent key documented; live signer not bundled | PARTIAL | NO live order |
| 5 Stub cleanup | fees package re-exports | DONE | — |
| 6 Hardening | CORS default cryptraa.ir, production assert, timing-safe TG | DONE | NO |
| 7 Launch | smoke/launch-check scripts already present | READY | NO |

## When VPS is back

```bash
ssh root@5.75.205.142
cd /opt/cryptra
bash scripts/recover-server.sh
node scripts/smoke.mjs
# optional menu:
# TELEGRAM_BOT_TOKEN=... TELEGRAM_MINI_APP_URL=https://cryptraa.ir node scripts/set-menu-button.mjs
```

## Open product / credential items

- `HYPERLIQUID_AGENT_PRIVATE_KEY` — only if live exchange orders are required
- Full HL action signer SDK (`@nktkas/hyperliquid` or official) — not inventing signatures
- Partner fee share BPS (currently 0 until configured)
