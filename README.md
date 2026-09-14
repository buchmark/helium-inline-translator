# Helium Inline Translator

The project started when moving from Microsoft Edge to Helium Browser revealed the lack of a translation flow comparable to Edge’s native feature, so the extension was built to fill that gap—and it works seamlessly in any Chromium browser, including Chrome and Edge. Fast shortcuts keep the workflow fluid while the interface stays clean.

- Helium Browser and most other Chromium-based browsers
- Google Chrome
- Microsoft Edge

![A screenshot from the extension pop-up page](https://i.ibb.co/B23N9mVs/Camada-1.jpg)

<p align="center">
  Based on Helium Inline Translator by Wesley Martins
</p>


## Features

- Inline translation for full pages and highlighted passages
- Free translation services without an API key: Google, Microsoft, and Yandex, selectable in the popup
- Keyboard shortcuts: `Shift + Alt + Q` (selection) and `Shift + Alt + W` (page), customizable at `chrome://extensions/shortcuts`
- Minimal popup with light and dark themes
- Favorite languages, quick search, and complete UI localization
- Store metadata localized via `_locales/<lang>/messages.json`

## Supported Languages (49)

| Region | Languages |
|--------|-----------|
| **Portuguese** | Português (Brasil) 🇧🇷, Português (Portugal) 🇵🇹 |
| **Western Europe** | English 🇺🇸, Español 🇪🇸, Français 🇫🇷, Deutsch 🇩🇪, Italiano 🇮🇹, Nederlands 🇳🇱, Català 🇦🇩, Gaeilge 🇮🇪 |
| **Central Europe** | Lëtzebuergesch 🇱🇺, Malti 🇲🇹 |
| **Eastern Europe** | Русский 🇷🇺, Українська 🇺🇦, Polski 🇵🇱, Čeština 🇨🇿, Slovenčina 🇸🇰, Magyar 🇭🇺, Română 🇷🇴, Български 🇧🇬, Hrvatski 🇭🇷, Slovenščina 🇸🇮, Српски 🇷🇸 |
| **Scandinavia & Baltics** | Svenska 🇸🇪, Dansk 🇩🇰, Norsk 🇳🇴, Suomi 🇫🇮, Íslenska 🇮🇸, Eesti 🇪🇪, Latviešu 🇱🇻, Lietuvių 🇱🇹 |
| **East Asia** | 日本語 🇯🇵, 한국어 🇰🇷, 中文 (简体) 🇨🇳, 中文 (繁體) 🇹🇼 |
| **Southeast Asia** | Tiếng Việt 🇻🇳, Bahasa Indonesia 🇮🇩, ไทย 🇹🇭, Bahasa Melayu 🇲🇾, Filipino 🇵🇭 |
| **South Asia** | हिन्दी 🇮🇳, বাংলা 🇧🇩, اردو 🇵🇰 |
| **Middle East** | العربية 🇸🇦, עברית 🇮🇱, فارسی 🇮🇷 |
| **Mediterranean** | Türkçe 🇹🇷, Ελληνικά 🇬🇷 |
| **Africa** | Afrikaans 🇿🇦 |

## Disclaimer

This extension uses Google Translate, Microsoft Translator, and Yandex Translate to provide translations but is not affiliated with, endorsed, or sponsored by Google, Microsoft, or Yandex. All copyrights and trademarks belong to their respective owners.

## Known Limitations

- Due to browser security restrictions, this extension cannot run on internal pages (e.g., `chrome://`, `edge://`) or on the Chrome Web Store / Edge Add-ons website itself.
- Translation relies on an external service and requires an active internet connection.

### Manual installation (development build)

1. Clone this repository or download the latest release ZIP.
2. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
3. Click **Load unpacked** and choose the project root (`heliumExtension`).
4. Use the refresh icon whenever you change local files.

## Development

- Popup assets live in `ui/` and shared styles in `css/`.
- `src/background.js` handles keyboard shortcuts and the context menu, and injects `src/content.js` into the active tab on demand; `src/content.js` applies inline translations.
- `src/translation/providers/` holds one adapter per translation service; register new ones in `src/translation/providerRegistry.js`.
- UI strings are defined in `ui/i18n.js`; store messages mirror them under `_locales/`.
- Preferences persist via `chrome.storage.sync` and are restored on load.
- Use the service worker inspector in `chrome://extensions` to review logs.

## Repository Structure

```text
manifest.json
src/
ui/
css/
icons/
_locales/
docs/
```

## Privacy and Support

- Privacy policy: `docs/PrivacyPolicy.md`
- Issues: <https://github.com/buchmark/helium-inline-translator/issues>

## License

Licensed under [GPL v3](LICENSE).
