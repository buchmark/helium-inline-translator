# Privacy Policy for Helium Inline Translator

Updated: September 14, 2026

Helium Inline Translator ("Extension") is maintained by buchmark and is based on Helium Inline Translator by Wesley Martins. This privacy policy explains how the Extension handles data when you install and use it in Chromium-based browsers such as Google Chrome or Microsoft Edge.

## Data Sent to Google Translate

- When you trigger a translation with a keyboard shortcut or the context menu, the Extension sends text to Google Translate (`translate.googleapis.com`):
  - Selection translation: the selected text.
  - Page translation: the visible text of the current page, which may include personal information displayed on that page.
- Text is sent only after you trigger a translation. Nothing is sent in the background.
- Google processes these requests under the [Google Privacy Policy](https://policies.google.com/privacy).

## Data Stored in Your Browser

- Preferences (theme, favorite languages, selected target language, UI language) are saved using `chrome.storage.sync` and synchronized between your signed-in devices, subject to the browser vendor's policies.
- Translated text is kept in memory only while the page is open, so the translation can be reverted.
- The Extension does not collect browsing history, form input, or keystrokes.

## Permissions Justification

- `activeTab` and `scripting`: inject the translation script into the current tab only after you use a shortcut or the context menu.
- `contextMenus`: used to expose translation actions via the right-click menu.
- `storage`: required to persist your preferences (`chrome.storage.sync`).
- `https://translate.googleapis.com/*`: sends the text you choose to translate to Google Translate.

## Third-Party Services

The Extension uses Google Translate to translate text. It does not integrate analytics, advertising, or tracking services.

## Data Sharing

Text you choose to translate is shared only with Google Translate, as described above. No other information is sold, traded, or transferred to outside parties. Browser vendors may access synchronized storage data according to their own privacy policies.

## Security

Translation requests are sent over HTTPS. Avoid translating pages that contain information you do not want to share with Google. Keep your browser up to date and only install the Extension from trusted sources.

## Children’s Privacy

The Extension is not directed to children under the age of 13. It does not knowingly collect personal information from children.

## Changes to This Policy

This privacy policy may be updated from time to time. Changes will be posted in the public repository, and the "Updated" date will reflect the most recent revision.

## Contact

For questions about this policy or the Extension, open an issue at <https://github.com/buchmark/helium-inline-translator/issues>.
