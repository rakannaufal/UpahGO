# Upahgo development

- Android first, React Native + Expo + TypeScript in apps/mobile. Preserve DESIGN.md and design/tokens.json; logo comes from assets/brand/exports.
- User-visible copy Indonesian. Code identifiers/comments English. Use Node 22.13+ (22.x), npm workspaces, package-lock.json.
- Commands from root: npm run typecheck, npm run lint, npm test, npm run test:db, npm run test:web, npm run build:web, npm run build:android. DB test needs a disposable PostgreSQL database; see docs/DEVELOPMENT.md.
- Demo is explicit, synthetic, in-memory. Never make demo approval, OTP, phone numbers, maps or COD acknowledgements look like real service results. Live mode never falls back to demo after a failure.
- Supabase migrations own identity, visibility expiry, consent, blocking, monetary state and authorization. UI and client roles are not authority. All privileged functions have a fixed search_path, trusted actor and bounded inputs.
- Persistent native sessions use SecureStore; web preview sessions stay in memory. Never log secrets, phone numbers, OTPs or private user content.
- Do not activate paid services, provision cloud accounts, send SMS to real users, deploy migrations remotely, publish builds or commit through the parent Git repository without authorization.
- Scope for this slice: map/contact/explicit work agreement/COD core, reports and blocking. Job publication/applicant marketplace and operator web remain deferred.
- UI workflow: use impeccable as primary, antislop core as filter, ponytail for implementation. Existing direction and screen studies are authority, no alternative identity. Antislop mode follows the saved/session preference; do not install optional modules.
