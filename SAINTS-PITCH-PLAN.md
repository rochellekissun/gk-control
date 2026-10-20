# SAINTS PITCH — build notes

## Current foundation

`saints-pitch/index.html` is a standalone, computer-first prototype styled with the chosen palette: obsidian `#09090B`, electric purple `#8B5CF6`, and turquoise `#2DD4BF`. It has responsive navigation and local interactions for:

- dashboard and development shortcuts
- position exploration
- rule-based training session outlines
- meal idea suggestions with preference and avoid filters
- recovery check-ins
- progress entries and JSON export
- a basic local profile

The app stores this prototype's profile, logs and check-ins in the browser's `localStorage`. It has no login, password reset, cloud backup, email notifications, or secure multi-account boundary. Browser storage is not encrypted and can be seen by someone with access to the same browser profile. Do not use it for sensitive medical information or as a production athlete record system.

## Product decisions carried forward

- Computer-first, with a usable small-screen layout.
- The product name is **SAINTS PITCH**. Text only: SAINTS in purple and PITCH in turquoise. No logo or tagline.
- This is a private personal trial; there is no subscription or public launch in this first slice.
- Build the full intended scope over stages: private account and recovery, profile, dashboard, training and position generators, nutrition preferences, recovery, saved progress, and eventually email notifications.
- Training ideas are educational and rule-based, not medical advice. Until movement-based training is cleared, the generator only creates a video, notes and reflection plan.
- Meal ideas are general suggestions, not guaranteed allergy-safe or clinically tailored. Labels and cross-contact must be checked; medical nutrition needs belong with a qualified clinician or dietitian.

## Staged implementation plan

1. **Foundation (current):** standalone interface, local-only prototype data, navigation and usable generator flows.
2. **Private account:** choose a backend that supports authentication, password reset and per-user data access; define the data model and privacy rules before moving personal records online.
3. **Product depth:** expand position-specific training, progress views, schedule planning, and nutrition preference handling; add user controls for export and deletion.
4. **Notifications:** add email only after account ownership, consent, and notification settings are designed.
5. **Release:** connect the replacement to the existing `gk-control` repository only after the repo is available and the new version is reviewed. Keep the current GitHub Pages prototype live until then.

## Cost and hosting reality

This prototype can be opened locally without paying for a hosting or backend service. A static site host can publish the interface, but static hosting alone does not provide secure login, password reset, private database records, or outbound email. Those features require backend services. Some providers offer free allowances, but quotas, feature limits and terms vary and can change; free availability should be confirmed against current provider pricing before choosing a stack. A free trial also does not guarantee ongoing availability, backup, or production-grade privacy controls.

## Repository and live site

This foundation lives on the `saints-pitch-foundation` branch in `rochellekissun/gk-control`, under `saints-pitch/`. The existing root `index.html` and `main` branch are left unchanged. GitHub Pages continues to publish the existing root site from `main`; this branch is not configured as a deployment. Review this isolated version before deciding whether and how to replace the current page.
