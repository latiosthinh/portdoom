# Requirements

## v1 Requirements

### Core Dashboard
- [x] **CORE-01**: Display all listening TCP ports with process details (port, process name, PID, protocol) — validated
- [x] **CORE-02**: Filter out system processes by default — validated
- [x] **CORE-03**: Toggle visibility of system processes — validated
- [x] **CORE-04**: Search/filter by port number, process name, or PID — validated
- [x] **CORE-05**: Display summary stats (active ports, unique processes) — validated

### Process Management
- [x] **MGMT-01**: Kill processes by PID with confirmation — validated
- [x] **MGMT-02**: Show toast notifications for kill actions — validated
- [x] **MGMT-03**: Distinguish system process kill buttons (Force Kill) — validated

### UI/UX
- [x] **UI-01**: Dark theme dashboard with clean layout — validated
- [x] **UI-02**: Manual refresh button — validated
- [x] **UI-03**: Loading and empty states — validated

### Platform
- [ ] **PLAT-01**: Cross-platform support (macOS, Linux) — Windows-only currently
- [ ] **PLAT-02**: UDP port detection — TCP only currently
- [ ] **PLAT-03**: Auto-refresh capability — manual only currently

### Packaging
- [ ] **PKG-01**: Electron app packaging — package.json declares electron but no main.js
- [ ] **PKG-02**: CLI entry point — package.json declares bin/cli.js but file doesn't exist

## v2 Requirements (Deferred)

- Remote port monitoring — out of scope by design
- Port forwarding/routing — dashboard is read-only + kill
- Port history/logging — nice to have but not core
- Custom process allowlists — advanced feature

## Out of Scope

- Remote port monitoring — this is local-only by design
- Port forwarding/routing — dashboard is read-only + kill, not a proxy
- Mobile app — desktop dev tool only

## Traceability

| Phase | Requirements Covered |
|-------|---------------------|
| Phase 1: Core Dashboard | CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, MGMT-01, MGMT-02, MGMT-03, UI-01, UI-02, UI-03 |
| Phase 2: Cross-Platform & Packaging | PLAT-01, PLAT-02, PLAT-03, PKG-01, PKG-02 |
