# Appointments and reminders — 2026-10-30

Published app: https://traxio-preview.vercel.app/
Release commit: `769cad7e264fc1fa244d704f3547c4621bb0ff8e`
Deployment: `dpl_C8hLunKyaAGzfDQo8qZoiBMQsgAx` (READY).

The new Agendamentos destination follows Mapa e Rotas. Agendar visita accepts the marked clients or a searchable selection, individual times, date, time zone, visit duration and up to ten custom reminders (minutes/hours/days, up to 30 days ahead). Meus agendamentos filters appointments by date and supports editing, deletion, map review and route selection. Existing weekly/monthly schedules remain compatible.

The header bell contains in-app reminders. They refresh while the document is visible and on returning to the app; this release does not register OS push/background alarms. Yellow covers the next three calendar days, orange the next day, red the appointment day, in the saved time zone. Multiple due reminders for one occurrence are grouped. Swiping either direction, the explicit dismiss button and Apagar tudo preserve appointment records. Dismissals persist on this device, scoped to the account and the loaded portfolio; later reminder thresholds can create a new alert. Notices expire at midnight after the appointment day. Past appointments remain available.

Daily routes use the existing street-routing engine and three strategies. Fixed appointment times take precedence; the chosen strategy optimizes equal-time groups. Estimated arrivals include road-leg times, waiting and the editable visit duration. Timing conflicts are shown; missing leg times produce an explicit unavailable-estimate message. Unconfirmed pins and duplicate selected appointments for one client require review. The origin is current GPS. No appointment or planned route creates a confirmed visit or sale.

Storage reuses the existing revision-checked schedule workspace, account authentication and portfolio headers. No schema migration or production customer write was needed. Read-only Supabase checks confirmed workspace RLS, portfolio guards, schedule validation and no anonymous write permission. Original scenic assets, branding and original installer are unchanged.

Verification:

- [Release run 40988356856](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/40988356856): 104 unit checks, 78 appointment/interface browser checks across six profiles, and 16 existing premium/route checks passed.
- WebKit Safari/small-iPhone checks and Chromium Android/desktop checks passed locally. Covered cloud fixtures, partial batch retry, new clients arriving after synchronization, recurrence, timezone/DST boundaries, reminder dismissal/expiry, portfolio filtering, Free read-only access, all three strategies, travel-time conflicts and unconfirmed coordinates.
- Public browser smoke checks passed at 390px and 320px: six destinations, bell, marked-client scheduling, fixture-backed save, route generation and timing report, no visit creation, no page errors or horizontal overflow. Actual customer accounts and external routing providers were replaced with fixtures in browser tests.
- Downloaded public HTML/assets match source. Public APK and update ZIP hashes match their manifests; all 95 APK public files match the compatible update manifest.

Android update: `8811f874231943f93d9444cae9c87d5a22ee9aac2fc705964798dae606073265`
Runtime: `capacitor8-20261026`, native compatibility version 2.
APK: 17177045 bytes; SHA-256 `ba12326b2c2b8dd0db54b264c900c9a4a293a1415bbf94ac6ae8fa693eb2bb15`.

The APK is for first installations. Existing compatible installations use the internal web update and retain local data. This release was not physically tested on an iPhone or installed into an Android emulator; browser profiles and compiled bundle checks were used.
