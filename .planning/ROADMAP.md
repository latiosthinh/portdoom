# Roadmap: Local Port Dashboard

## Milestone: v1.0 — Core Dashboard + Packaging

### Phase 1: Core Dashboard (COMPLETE)

**Goal:** Working dashboard that displays local ports with process details and one-click kill

**Status:** ✅ COMPLETE — All core requirements validated in existing code

**Requirements:** CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, MGMT-01, MGMT-02, MGMT-03, UI-01, UI-02, UI-03

**Success Criteria:**
1. User can see all non-system listening ports with port number, process name, PID, and protocol
2. User can toggle system process visibility
3. User can search/filter by port, process name, or PID
4. User can kill a process with confirmation and see success/error toast
5. Stats show active port count and unique process count

**Verification:** All requirements validated against existing `server.js` and `public/index.html`

---

### Phase 2: Electron Packaging & CLI

**Goal:** Package as distributable Electron desktop app with CLI entry point

**Requirements:** PKG-01, PKG-02

**Success Criteria:**
1. `npm start` launches Electron window with dashboard
2. `local-port-dashboard` CLI command opens the app
3. App can be built for Windows/macOS/Linux via electron-builder
4. No build errors or missing dependencies

**UI hint:** yes — Electron main process needs to be created

---

### Phase 3: Cross-Platform Support

**Goal:** Support macOS and Linux alongside Windows

**Requirements:** PLAT-01

**Success Criteria:**
1. Port detection works on macOS (lsof equivalent)
2. Port detection works on Linux (/proc/net or ss equivalent)
3. Process kill works on all three platforms
4. System process filtering adapts per platform
5. No platform-specific crashes or errors

---

### Phase 4: Enhanced Features

**Goal:** Add UDP detection and auto-refresh

**Requirements:** PLAT-02, PLAT-03

**Success Criteria:**
1. UDP ports appear in dashboard alongside TCP
2. Auto-refresh toggle in UI (default: off)
3. Configurable refresh interval (5s, 10s, 30s)
4. No performance degradation during auto-refresh

---

## Backlog

(No backlog items yet)
