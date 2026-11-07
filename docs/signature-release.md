# Membership presentation and Signature release — 1.7.0

## Behavior

The account avatar has a plan badge: Essencial (slate), Executivo (cyan), Elite (gold), or the private Signature designation (champagne). The profile menu has one subscription entry, **Gerenciar assinatura**. The hub has keyboard accessible tabs for **Meu plano**, **Minha assinatura**, and **Conhecer planos**. Existing profile photo controls, preferences, security, support and update entry remain available.

Public prices are presentation only: Executivo R$ 29,90/month or R$ 299/year; Elite R$ 59,90/month or R$ 599/year. Annual billing is explicitly described as one annual payment. No payment provider, card fields, fake receipts, billing history, renewal dates or cancellation of nonexistent charges are introduced. Test accounts alone can use the existing server-controlled simulated upgrades.

## Signature

Signature is an account-specific designation, not a fourth public subscription. Only the two user-authorized founder accounts were provisioned administratively. The server checks administrator-controlled Auth app metadata plus an explicit permanent Pro entitlement; user-editable metadata cannot grant Signature or paid permissions. Client source and migration contain no founder email addresses or IDs. Existing account UUIDs, portfolios, customers, photos, visits, sales and routes are preserved.

The UI says **RM Signature — Edição Fundadores**, **Membro VIP - Sem cobrança**, and **Sem vencimento**. Founders retain all Elite permissions without a subscription or payment obligation. The dedicated test email remains separate; the existing private invite is preserved, and the operator can generate another email-bound invite through the test panel if necessary. Labels change, internal free/plus/pro keys and security boundaries stay stable. Global prelaunch access for other existing users is preserved.

## Validation and delivery

Model tests cover prices, honorary identity and permitted test progression. Browser scenarios cover all plan badges, monthly/annual comparisons, no real checkout, Signature billing, forged user metadata, account switching, keyboard tabs, both themes and responsive layouts. Existing account/profile and QA progression suites are regression checks. Original art is hash checked.

A real server RPC check confirms exactly two founders with permanent Pro access, Signature identity, no billing and unlimited stored-route/portfolio quotas; other accounts cannot obtain Signature by supplying user metadata. Private QA tables intentionally have RLS with no client policies; no new exposed tables were added. The preexisting leaked-password-protection advisory remains unchanged.

CI builds and compares every bundled file in the OTA archive and the native installer, checks package ID/name/version, original launcher pixels and signing certificates. The existing stable installer is only replaced when its signing identity matches. Existing installations should use the internal update flow to preserve data.

## Published result

- Source commit: `7d5e3c479b428ae86ee73878a69015cb97bbeb99`.
- Artifact commit: `f7a2a5f0d6c335ae65ccf0457f86c1f8a21282cc`.
- [Release CI 42336400446](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/42336400446): all jobs successful; 148 model tests, 32 responsive subscription cases, 24 account regressions and six authorized test-progression cases.
- Local WebKit: 16 subscription scenarios passed. The final public Safari check also verifies sidebar navigation and direct comparison opening after the last navigation fix.
- Deployment `dpl_715HtTwpkZ1XyAaND5UzmPv4jkXd` is READY at https://traxio-preview.vercel.app/ with the exact artifact commit.
- Public tests use isolated synthetic identities, not the founders' sessions. Server RPC checks independently verify the two actual founder grants and exclusion of other accounts.
- Remote migration version `20261107035047` is reflected in the repository filename; no additional database change is required for this filename alignment.
- The versioned APK has a different signing identity from 1.6.0 and the stable installer. Existing installers were preserved. Existing devices should use **Conta → Sobre e atualizações → Verificar atualizações** instead of reinstalling. Physical-device installation was not performed during this release.
- The preexisting [leaked-password-protection advisory](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) is unrelated to this release. Private QA tables intentionally deny direct client access; no new exposed tables or permissive RLS policies were added.
