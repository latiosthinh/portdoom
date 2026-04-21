# Project: Local Port Dashboard

## What This Is

A small desktop dashboard that lists all non-system local ports with process details and provides one-click kill functionality. Built with Electron + Express for cross-platform developer use.

## Core Value

Developers can instantly see what processes are using local ports and kill orphaned processes with one click — solving the daily friction of port conflicts and orphaned processes.

## Context

**Type:** Brownfield (existing code detected)

**Current State:**
- Express backend (`server.js`) running on port 8765
- Static HTML frontend (`public/index.html`) with dark theme dashboard
- Port detection via `netstat -ano` (Windows)
- Process lookup via `tasklist` (Windows)
- Kill functionality via `taskkill /F`
- System process filtering built-in
- Search/filter UI implemented
- Toast notifications for actions

**Tech Stack:**
- Node.js + Express (backend API)
- Vanilla HTML/CSS/JS (frontend)
- Electron (desktop wrapper — declared in package.json)
- Windows-specific commands (netstat, tasklist, taskkill)

## Requirements

### Validated

- ✓ Detect listening TCP ports — existing (netstat parsing)
- ✓ Display port details (port, process name, PID, protocol) — existing
- ✓ Filter system processes — existing (SYSTEM_PIDS + SYSTEM_PROCESS_NAMES)
- ✓ Kill processes by PID — existing (taskkill endpoint)
- ✓ Search/filter ports — existing (client-side search)
- ✓ Toggle system process visibility — existing (Show System button)
- ✓ Display stats (active ports, unique processes) — existing

### Active

- [ ] Cross-platform support (macOS, Linux) — currently Windows-only
- [ ] UDP port detection — only TCP LISTENING currently
- [ ] Auto-refresh capability — manual refresh only
- [ ] Electron app packaging — package.json declares electron but no main.js
- [ ] CLI entry point — package.json declares bin/cli.js but file doesn't exist

### Out of Scope

- Remote port monitoring — this is local-only by design
- Port forwarding/routing — dashboard is read-only + kill, not a proxy

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Express + vanilla JS | Simple, no build step needed | Implemented |
| Windows-first | netstat/tasklist/taskkill | Implemented, needs cross-platform |
| Dark theme dashboard | Developer tool aesthetic | Implemented |
| System process filtering | Avoid noise from OS processes | Implemented |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-21 after brownfield initialization*
