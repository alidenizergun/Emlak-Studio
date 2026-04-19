# iOS Shell (Capacitor)

This directory contains the generated Capacitor iOS project baseline committed for `STU-18`.

## Baseline workflow

1. Install dependencies:

   ```bash
   npm install
   ```

2. Sync web/native configuration updates:

   ```bash
   npm run cap:sync
   ```

3. Open in Xcode:

   ```bash
   npm run cap:open:ios
   ```

## Regeneration

If you intentionally need to replace the committed native scaffold from scratch, remove `ios/` and run:

```bash
npm run cap:add:ios
```

## Notes

- `capacitor.config.ts` points to the deployed app URL by default so the native shell boots production content.
- `capacitor-shell/` is a minimal local bundle kept only so Capacitor sync stays valid for this hosted-shell setup.
- Override `CAPACITOR_SERVER_URL` per environment when needed.
