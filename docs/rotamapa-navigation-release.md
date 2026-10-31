# RotaMapa: approved identity and course-up navigation

The new display name is RotaMapa. The approved full logo uses the RM emblem with the location pin inside R and a solid M, with the original petroleum/lime palette and “Sua rota com inteligência.” The header and login use a lossless crop of the approved lettering, keyed at display time; no replacement font is used. All five scenic backgrounds, menu icons, layout, client records and account identifiers are preserved.

## Navigation

While foreground navigation is tracking GPS, the camera centers on the latest usable fix and rotates to the course of travel. This uses GPS heading when available and moving; otherwise meaningful recent displacement supplies the course. Road direction initializes the first view when a device has no heading yet. Small stationary coordinate jitter does not turn the map, and the last known course is retained at stops. This is course of travel, not the phone's compass orientation.

Dragging, zooming, rotating or tilting the map switches the camera to manual exploration while GPS and route recalculation continue. A visible, accessible “Recentralizar” action restores the latest position, direction and navigation zoom. Recalculation updates the road line without fitting the whole route or taking the camera out of exploration. The same map and action remain available in the in-app mini-map.

## Installation compatibility

The web/PWA URL remains https://traxio-preview.vercel.app/. The iPhone manifest keeps the original application id, origin, start URL and scope, with new RotaMapa names and versioned icon paths. iOS can retain an existing Home Screen icon/name until the shortcut is added again; do not clear browser data or customer storage. The service worker still caches only a generic offline notice and never reloads an active navigation session.

The new first-install Android APK uses the existing package app.traxio.mobile, compatible native runtime and unchanged OAuth scheme/local storage keys. Its launcher name/icon are RotaMapa. The original signed installer is retained byte for byte. Its signing key is unavailable; the newly built test APK is not promised as an in-place replacement for an old differently signed installation. Existing users should keep their installation and receive the compatible web update for the new internal logo and navigation. Launcher artwork/name require a compatible signed native package; OTA cannot replace launcher resources.

## Verification

Unit tests cover bearings, north wrap, missing heading, movement inference and stationary/poor GPS. Browser tests cover course-up, actual MapLibre controls, manual exploration, recalculation, recentering, mini-map, safe areas, unchanged themes/scenes and PWA identity. Android evidence uses an isolated emulator and synthetic records/GPS; it is not a physical road test. Installation proofs cover the original APK's data-preserving update and the new first-install APK.
