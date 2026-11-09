# Android (Java + WebView) notes

The delivered ZIP contains a working website/PWA, **not** an Android Studio project, APK or AAB. You may use your existing BillBanao Java/WebView wrapper as a starting point but keep KhataBanao as a SEPARATE Android project and a separate Google Play application ID (e.g. `com.khatabanao.app`, subject to availability).

## Basic setup

1. Upload web files to a new HTTPS URL (GitHub Pages is supported).
2. In your new `MainActivity.java`, set `APP_URL` to that new deployed HTTPS link; **do not point it at BillBanao**.
3. Keep the `INTERNET` permission if loading the hosted site. Enable JavaScript and DOM storage only for your trusted site. Do not allow mixed content or arbitrary HTTP origins.
4. If `MainActivity extends AppCompatActivity`, the manifest application theme **must inherit from an AppCompat theme** such as `Theme.AppCompat.Light.NoActionBar`. A framework `android:style/Theme.Material.Light.NoActionBar` parent with AppCompatActivity may crash at startup.
5. AndroidManifest should refer to your own `.MainActivity`, launcher icon, proper `android:exported` value, and new application/package ID.
6. Configure WebView error handling, device back, safe areas, external links and keyboard resizing; test first launch with internet and on older Android devices.

## Why plain WebView needs extra work

The **web app** can export backup JSON and CSV using Blob URLs and can print statements with `window.print()`. A plain `WebView` does **not reliably save generated Blob downloads** and doesn't automatically implement browser printing. Before Play release:

- Implement safe native save/share with Android's document picker and user-controlled destination for JSON/CSV.
- Implement `WebView.createPrintDocumentAdapter()` and Android's PrintManager if statement printing is advertised in the native build.
- Handle `WebChromeClient.onShowFileChooser` for importing a JSON backup; validate size and type in web code (already present).
- Avoid unrestricted `addJavascriptInterface`; validate the trusted origin and data if you use native bridges.
- Test with the actual APK that you will distribute, including restore, print, offline, rotations and keyboard, and no-internet startup.

The localStorage data can be deleted on app uninstall or clearing Android app data. Backups contain personal customer information and are **not encrypted**. If you add cloud login, analytics, ads, crash SDKs or other code, re-evaluate privacy/data disclosures accordingly.
