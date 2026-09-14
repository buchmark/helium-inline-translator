# Privacy Policy for Helium Inline Translator

Updated: September 14, 2026

Helium Inline Translator ("Extension") is maintained by buchmark and is based on Helium Inline Translator by Wesley Martins. This privacy policy explains what data the Extension sends, when, to whom, and why, when you use it in Chromium-based browsers such as Helium, Google Chrome, or Microsoft Edge.

## Summary

- The Extension has no server of its own. The maintainer never receives, stores, or sees any of your data.
- Text leaves your browser only when you ask for a translation, and only to the translation service you selected.
- The Extension sends only the text to translate and the target language. It never sends information about who you are: no name, email address, account, cookies, browsing history, page address, or form input.

## Warning: Personal and Sensitive Pages

Do not translate pages or selections that contain personal or sensitive information, such as:

- online banking, payment, or tax pages;
- medical, legal, or identity documents;
- email, chats, and other private messages;
- passwords, recovery codes, or security keys;
- confidential work documents.

Everything you translate is sent to a third-party translation service, and the Extension cannot control how that service stores or uses it. If you need to understand part of such a page, select and translate only text that contains no sensitive details instead of translating the whole page.

## When Data Is Sent

Text is sent only after you trigger a translation with a keyboard shortcut or the right-click menu.

Nothing is sent when you install the Extension, open the popup, change settings, browse, or revert a translation. Reverting restores the original text kept in memory. Translating the same page again with the same service and language reuses translations kept in memory instead of sending the text again.

## What Data Is Sent

| Action | Text sent |
|--------|-----------|
| Selection translation | The full text of every text element your selection touches. This can be slightly more than the highlighted part, for example the rest of the sentence. |
| Page translation | All displayed text in the current page's main document, including parts you need to scroll to see. Long pages are split into several requests; if you revert before the translation finishes, parts not yet sent are skipped. |

Neither action sends hidden text (such as closed menus), scripts, styles, text areas, editable areas such as rich text editors and message drafts, form field values (including passwords), or content inside embedded frames.

Together with the text, each request contains only:

- the target language code, for example `de`;
- fixed technical parameters required by the service, for example `client=gtx` for Google or `srv=android` for Yandex;
- for Yandex only, a random identifier required by the service. It is generated again each time the Extension's background process starts and is not linked to you or your device.

## Why Data Is Sent

The text is sent for one purpose only: to translate it into the language you chose and show the translation in place on the page. The Extension uses only the translated text from the response and does not use your data for any other purpose.

## Where Data Is Sent

The text goes directly from your browser to the service selected in the popup:

| Service | Address | Privacy policy |
|---------|---------|----------------|
| Google Translate | `translate.googleapis.com` | [Google Privacy Policy](https://policies.google.com/privacy) |
| Microsoft Translator | `edge.microsoft.com` | [Microsoft Privacy Statement](https://privacy.microsoft.com/privacystatement) |
| Yandex Translate | `translate.yandex.net` | [Yandex Privacy Policy](https://yandex.com/legal/confidential/) |

## What Is Never Sent

The Extension never sends:

- your name, email address, or any account information;
- cookies or login sessions, because requests are made without cookies;
- the address (URL) or title of the page you translate;
- your browsing history, open tabs, or keystrokes;
- form input, passwords, or clipboard content;
- your preferences, analytics, or tracking identifiers.

## Information Your Browser Shares Automatically

As with any website you visit, the translation service receives technical information that the browser includes in every request and the Extension cannot remove:

- your IP address, which a service may use to estimate your approximate location;
- your browser's user agent (browser and operating system version);
- your preferred browser languages (`Accept-Language`);
- the Extension's identifier (`Origin`).

## Data Stored in Your Browser

- Preferences (theme, favorite languages, target language, translation service, UI language) are saved with `chrome.storage.sync` and synchronized between your signed-in devices, subject to the browser vendor's policies.
- Original and translated text is kept in the tab's memory only until the page is closed or reloaded, so the translation can be reverted.
- The Extension does not collect browsing history, form input, or keystrokes.

## Permissions Justification

- `activeTab` and `scripting`: inject the translation script into the current tab only after you use a shortcut or the right-click menu.
- `contextMenus`: show the translation actions in the right-click menu.
- `storage`: save your preferences with `chrome.storage.sync`.
- `https://translate.googleapis.com/*`, `https://edge.microsoft.com/translate/*`, `https://translate.yandex.net/*`: send the text you choose to translate to the selected translation service. These permissions are not used for anything else.

## Third-Party Services

The translation services are free and require no account or API key. They are operated by Google, Microsoft, and Yandex, not by the maintainer, and are not affiliated with the Extension. Each service may log, store, or use the text it receives according to its own privacy policy.

The Extension does not integrate analytics, advertising, or tracking services.

## Data Sharing

The maintainer does not collect, sell, or share any data. Text you choose to translate is sent only to the selected translation service, as described above. Browser vendors may access synchronized preferences according to their own privacy policies.

## Security

Translation requests are sent over HTTPS and without cookies. Keep your browser up to date and install the Extension only from trusted sources.

## Children’s Privacy

The Extension is not directed to children under the age of 13. It does not knowingly collect personal information from children.

## Changes to This Policy

This privacy policy may be updated from time to time. Changes will be posted in the public repository, and the "Updated" date will reflect the most recent revision.

## Contact

For questions about this policy or the Extension, open an issue at <https://github.com/buchmark/helium-inline-translator/issues>.
