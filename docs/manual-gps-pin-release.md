# RotaMapa 1.2.3 — manual pin from current position

When CEP lookup fails, **Usar minha posição** now opens the existing map adjustment flow directly. GPS accuracy above 100 metres is accepted as an initial position for this manual workflow; dragging or tapping the map refines the pin, and the existing explicit confirmation persists the customer location. No geocoder result or valid CEP is required.

Pending address searches are invalidated before requesting location so a delayed response cannot replace the draft pin. The button prevents duplicate requests while awaiting GPS, becomes available again after errors, and explains how to retry when permission is denied. Closing or changing the editor discards stale GPS completion. Cancel preserves the customer's saved position and address. Route origins keep their existing GPS accuracy validation and are not populated from approximate manual-pin requests.

Validation: 24 Chromium desktop/phone cases (new fallback cases and existing location workflow), five WebKit phone cases, and `npm run check` passed. Scenarios cover missing CEP, ±123 m accuracy, dragging and saving, cancellation, permission refusal and retry, late address results, and route-origin validation. Browser services and accounts are test doubles; no production client records were changed. Native bundle archive verified against all 114 file hashes, retaining the existing runtime and native version. Physical devices were not exercised.

Delivery uses the existing web/PWA URL and compatible Android in-app update. Existing APK installers and native identifiers remain unchanged.
