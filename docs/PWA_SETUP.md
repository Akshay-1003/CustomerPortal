# PWA Setup

This app now uses `vite-plugin-pwa` to make the existing React + Vite portal installable on supported mobile and desktop browsers.

## Change the app name

- Update the PWA manifest values in [vite.config.ts](/Users/akshayprakashpatil/project/customerportal/vite.config.ts).
- Update the page title and Apple app title meta tags in [index.html](/Users/akshayprakashpatil/project/customerportal/index.html).

## Change the app icon

- Replace these files in [public/icons](/Users/akshayprakashpatil/project/customerportal/public/icons):
  - `icon-192.png`
  - `icon-512.png`
  - `apple-touch-icon.png`
  - `maskable-icon-512.png`
- Keep the same filenames unless you also update the manifest config in [vite.config.ts](/Users/akshayprakashpatil/project/customerportal/vite.config.ts).

## Test on Android Chrome

1. Deploy the app over HTTPS.
2. Open the app in Chrome on Android.
3. Use the browser menu or the in-app `Install App` button when it appears.
4. After install, launch it from the home screen and verify standalone mode, login flow, and route navigation.

## Test on iPhone Safari

1. Deploy the app over HTTPS.
2. Open the app in Safari on iPhone.
3. Use `Share > Add to Home Screen`.
4. Launch it from the home screen and verify standalone mode, login flow, and route navigation.

## HTTPS requirement

- PWA install and service worker support require HTTPS in production.
- `localhost` works for development, but production installs will not work on plain HTTP.

## AWS / Nginx SPA fallback

- Because the app uses `BrowserRouter`, direct refreshes on nested routes must return `index.html`.
- Configure your frontend host or reverse proxy to rewrite unknown non-file routes to `index.html`.
- Do not rewrite real asset files or API routes.

Example Nginx behavior:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## API caching policy

- The service worker precaches the app shell and static build assets.
- FastAPI API requests are configured as `NetworkOnly` to avoid stale auth, stale gauge records, or stale dashboard data.
- If the device is offline, the UI shell can still open, but live API-backed data will continue to depend on network availability.
