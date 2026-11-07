# Account menu, profile photos and personal preferences

## User story

The representative opens the account menu beside the bell, changes their own identity/photo or preferences, and sees the saved values after returning on another device. The menu contains only account tools; customer, map, scheduling, history and portfolio destinations remain in the sidebar.

## Behavior

- Profile: display name, company, role, phone, address, email-change confirmation and provider/gallery photo. Provider photos appear when the identity supplies an HTTPS photo URL; Microsoft identities without a photo can use the gallery without additional Graph permissions.
- Gallery images: preview with zoom and horizontal/vertical framing; normalized 512×512 JPEG (no original EXIF), immutable per-account UUID path. Uploads are private, at most 1 MiB. Signed photo links last one hour and are cached in memory only.
- Account-wide light/dark mode, text size, preferred individual navigation provider and reminder defaults synchronize as nonprivileged Auth metadata. Offline preference changes stay pending locally and retry on reconnect. Existing portfolios, addresses, visits, sales, routes and scenic artwork are preserved.
- Confirmed individual destinations use internal navigation, Google Maps or Waze according to the preference; routes with multiple stops keep the internal planner. Unconfirmed coordinates still require review.
- New appointments inherit the reminder default. A customized unsaved appointment keeps its own reminders. A successfully saved batch resets the next batch to the current account default.
- Plan and route count come from the authenticated workspace entitlement. User-editable metadata cannot grant permissions. The existing plan comparison remains available; billing is explicitly unavailable during testing.
- Email/password identities can change their password and optionally reauthenticate. Social-only identities are directed to their provider. Other-session logout uses `scope: others`; this-device logout uses `scope: local`. Passwords and signed URLs are never saved by the account module.
- Support uses reserved demonstration address **suporte@rotamapa.example**, marked as fictitious and nonreceiving. Share, copy and download work with a user-written report. Only app version and device category are optionally attached; customer/account/session records are not attached automatically. Replace the email and demonstration flag before the commercial release.
- About exposes the actual web release version, release notes, explicit update checking and the existing safe installation/name/icon guide. No forced reload interrupts a route or form.

## Data boundaries

`docs/sql/enable-private-account-avatars.sql` / `supabase/migrations/20261102025509_private_account_avatars.sql` creates only a private `rotamapa-avatars` bucket and five Storage policies. The migration has been applied to project `ggsptbcgpdakxsdjrldd` and its privacy/MIME/size configuration read back successfully. Restrictive boundaries keep unrelated broad permissive policies from opening this bucket. The owner UUID and immutable JPEG filename are validated; anonymous Auth sessions and anon access are denied. Other buckets are unaffected.

The photo is account-wide rather than portfolio-specific. Account changes clear open profile forms, crop buffers, signed URLs and photos. An upload completing after an account switch cannot write metadata to the new account. A failed metadata save cleans up its own new upload and preserves the old photo. The client does not have permissions to delete another account's orphan, so interrupted uploads may remain private until administrative cleanup.

## Verification

- Pure model tests validate crop bounds, owned paths, safe provider URLs, input whitelisting, navigation URLs and preferences.
- Browser cases cover the menu, profile reload, gallery cropping/private upload, photo removal/provider restore, storage/metadata failure, account change during upload, session scopes, report privacy, themes/keyboard/small screens, actual navigation preference, scheduling reminder defaults, offline retry without repeated writes and authenticated plan counts.
- Mocked account browser tests block service workers to keep synthetic Auth/Storage routes authoritative after reload; public PWA installation behavior remains in its dedicated suite. No real account is mutated by browser fixtures.
- Local PostgreSQL fixture and CI exercise owner read/upload/delete, foreign-account rejection, path traversal, wrong extension, authenticated anonymous and anon denial even in the presence of an unrelated permissive policy. Fixtures always roll back.
- Release CI verifies the six browser profiles, affected theme/install/scheduling flows, all model tests, art hashes, native package label/runtime and every bundled file against the OTA manifest before publishing.
- Public deployment and generated artifact checks passed as recorded below. Browser/device emulation does not claim physical-phone installation testing.

## Android delivery

The established package remains `app.traxio.mobile`, RotaMapa launcher name, native version 2 and compatible runtime `capacitor8-20261026`. Existing compatible installations use the internal web update and retain local data. The generated test APK is for new installations because the original signing key is unavailable. The original installer remains byte-for-byte unchanged.

## Published verification

Published web/PWA: https://traxio-preview.vercel.app/ — version **1.1.0**, artifact commit `43bc248fe8c58096efda8a093d9419b92fd961ce`, Vercel deployment `dpl_7sxssB1XpUTLNcX6WgVU9X1jkSqi` READY with the canonical alias.

[CI run 41383444713](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/41383444713) passed all jobs: 119 unit cases, 72 new account browser cases across six profiles, nine existing interface/theme checks, three installation/backup checks, four appointment batch checks, isolated PostgreSQL ownership tests, native compilation and all **106 bundled-file hashes**. Original scenic/brand files and the original Android installer passed their unchanged-byte checks.

Public browser verification passed in emulated iPhone standalone PWA and Android Chromium using the actual deployed HTML, CSS, scripts and release JSON. Provider/private photos and Auth writes use isolated synthetic SDK/storage fixtures; no real account, password, photo or customer was changed. The checks exercised crop/upload/reload, account preferences, support labelling, the update button and unchanged customer storage, with zero page errors. The local browser environment trusted its configured session CA for TLS; certificate verification was retained.

The downloaded public APK and OTA ZIP match their manifests. Every one of the 106 APK/ZIP files matches the manifest hash; 12 public source/PWA files match the checked-out source bytes. APK content type and no-store delivery were verified.

- Compatible update: `54b51b4895299e28e93720985cd974436fafe9ae7c90965de5f4e7a5845e1816`.
- Runtime: `capacitor8-20261026`, native version 2.
- APK: 17,839,013 bytes; SHA256 `76f08cfe3de71ade37da3e6db9a64c1749da0968c8870d1aa1382e3b22637b92`.
- ZIP: 12,049,300 bytes; SHA256 `f5846690caa8659b3a1fead8ff1c8217a489e17e8bf28e3d19aeae77f96af2a8`.

Supabase readback confirmed the private bucket, JPEG-only 1 MiB limit and five avatar policies. The security advisor reported only the unchanged preexisting leaked-password-protection notice. No customer, portfolio, sales or visit schema or rows were modified for this feature. The previously paused CEP/manual-pin request remains excluded.
