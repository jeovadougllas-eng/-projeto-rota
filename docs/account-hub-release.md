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
- Public deployment and generated artifact verification will be recorded after the release completes. Browser/device emulation does not claim physical-phone installation testing.

## Android delivery

The established package remains `app.traxio.mobile`, RotaMapa launcher name, native version 2 and compatible runtime `capacitor8-20261026`. Existing compatible installations use the internal web update and retain local data. The generated test APK is for new installations because the original signing key is unavailable. The original installer remains byte-for-byte unchanged.
