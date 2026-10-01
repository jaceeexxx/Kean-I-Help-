# Phase 11 — Profile, Settings & Data Management

Status: **Complete in this package**

## Delivered

- Profile & Settings hub at `/settings`
- Today profile/avatar entry point
- Display-name editing
- Local profile-photo persistence
- Private cloud profile-photo bucket + signed URL display
- private cloud account status
- Sign out current device
- Sign out every device with confirmation
- Post-onboarding CELE study preference editing
- System / Light / Dark appearance override
- Reduce Motion override
- Standard / Large text mode
- Daily Jace message toggle
- Talking sticker reaction toggle
- Notification Settings bridge
- JSON study-data export
- Compatible local backup restore
- Device-only reset that leaves cloud data untouched
- Typed-confirmation permanent cloud-account deletion
- Server-side private-storage cleanup before Auth deletion
- Cloud-ready `user_preferences` table with owner-only RLS
- Private `kean-profile` Storage bucket with owner-folder RLS
- Phase 9/10 adaptive + notifications regression preserved

## Deliberate data boundary

The JSON backup does not embed original uploaded file binaries or Web Push subscription secrets. Cloud originals remain in private Storage and local-only originals should be downloaded separately before a device reset.
