# Phase 11 — Profile, Settings & Data Management

## Profile

- The Today avatar opens `/settings`.
- Display name works locally and syncs to `public.profiles` when signed in.
- Profile photos are stored locally in IndexedDB for preview mode.
- Cloud profile photos use the private `kean-profile` Supabase Storage bucket.
- Cloud profile photos are displayed with short-lived signed URLs; there is no permanent public avatar URL.
- Cloud uploads are limited to 5 MB by the bucket and the client.

## Account sessions

- **Sign out this device** uses Supabase `signOut({ scope: "local" })`.
- **Sign out everywhere** requires an extra confirmation and uses the global scope.
- Local reviewer data is not automatically erased merely by signing out.

## Study preferences

The Settings screen can edit the existing Phase 2 study setup after onboarding:

- target CELE date
- daily target
- study/rest days
- initial confidence ratings
- notification settings entry point

Changes are local-first and cloud-sync to `cele_settings` when authenticated.

## Appearance & accessibility

Phase 11 adds `user_preferences` with:

- System / Light / Dark appearance
- Reduce Motion override
- Standard / Large text mode

The app still respects operating-system preferences when System mode is selected.

Jace personality controls also expose:

- Daily Message from Jace
- Talking sticker reactions

Turning sticker reactions off prevents new contextual sticker events from being emitted.

## Backup/export

**Download study-data backup** produces JSON containing:

- all `kih:` localStorage records
- local Library metadata
- available cloud database rows for the authenticated user

For privacy/security, push-subscription encryption material is not exported.

Original uploaded file binaries are intentionally not embedded in the JSON export. Cloud originals remain in the private Library bucket; local-only originals should be downloaded separately before clearing the device.

## Restore

Import restores compatible local `kih:` records only. It does not silently overwrite cloud database tables and does not fabricate missing Library file binaries.

## Reset this device

This removes only Kean I Help? device data:

- `kih:` localStorage records
- local Library IndexedDB
- local profile IndexedDB
- Kean I Help? service-worker caches

It does **not** delete the cloud account or cloud records.

## Delete cloud account

Deletion requires typing `DELETE`.

The server route:

1. authenticates the current user;
2. removes the user's objects from `kean-library`;
3. removes the user's objects from `kean-profile`;
4. calls Supabase Admin `deleteUser()` with the service-role key;
5. the client clears local app data and returns to onboarding.

The service-role key never enters browser code.
