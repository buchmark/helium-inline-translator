// src/background.js
import { findTranslationProvider } from "./translation/providerRegistry.js";
import { translateTexts } from "./translation/translateTexts.js";

console.log("Background script starting...");

const BADGE_TIMEOUT_MS = 4000;
const badgeTimers = new Map();

function setBadgeState(state, tabId) {
  const key = typeof tabId === "number" ? tabId : "global";
  if (badgeTimers.has(key)) {
    clearTimeout(badgeTimers.get(key));
    badgeTimers.delete(key);
  }

  const target = typeof tabId === "number" ? { tabId } : {};

  if (state === "success") {
    chrome.action.setBadgeText({ text: "✓", ...target });
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e", ...target });
  } else if (state === "error") {
    chrome.action.setBadgeText({ text: "!", ...target });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444", ...target });
  } else {
    chrome.action.setBadgeText({ text: "", ...target });
    return;
  }

  const timeoutId = setTimeout(() => {
    chrome.action.setBadgeText({ text: "", ...target });
    badgeTimers.delete(key);
  }, BADGE_TIMEOUT_MS);
  badgeTimers.set(key, timeoutId);
}

function setupContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      console.log("Context menus (re)created.");
      // This menu appears only when you right-click on the page without selecting text
      chrome.contextMenus.create({
        id: "translate-page",
        title: chrome.i18n.getMessage("contextTranslatePage"),
        contexts: ["page"],
      });
      // This menu appears only when you right-click on selected text
      chrome.contextMenus.create({
        id: "translate-selection",
        title: chrome.i18n.getMessage("contextTranslateSelection"),
        contexts: ["selection"],
      });
      resolve();
    });
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log("Extension installed/updated.");

  if (details.reason === "install") {
    chrome.i18n.getAcceptLanguages((languages) => {
      if (languages && languages.length > 0) {
        const primaryLang = languages[0].split("-")[0];
        console.log(
          `Helium Inline Translator: Detected primary language: ${primaryLang}. Setting as default.`
        );
        chrome.storage.sync.set({ targetLanguage: primaryLang });
      } else {
        chrome.storage.sync.set({ targetLanguage: "en" });
      }
    });
  }
});

const contextMenusReady = setupContextMenus();
contextMenusReady.then(refreshPageMenuForActiveTab);

async function translateWithStoredSettings(texts) {
  const { translationProvider, targetLanguage } =
    await chrome.storage.sync.get(["translationProvider", "targetLanguage"]);
  const provider = findTranslationProvider(translationProvider);
  const targetLang = targetLanguage || "en";

  console.log(
    `Helium Inline Translator: Translating to '${targetLang}' with ${provider.name}`
  );

  return translateTexts(provider, texts, targetLang);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getTranslation") {
    const tabId = sender?.tab?.id;
    translateWithStoredSettings(request.texts)
      .then((translatedTexts) => {
        setBadgeState("success", tabId);
        sendResponse({ translatedTexts });
      })
      .catch((error) => {
        console.error("Translation Error:", error);
        setBadgeState("error", tabId);
        sendResponse({ error: error.message });
      });
    return true;
  }
  if (request.action === "page-translation-changed" && sender.tab?.active) {
    updatePageMenuTitle(request.isPageTranslated);
  }
});

async function updatePageMenuTitle(isPageTranslated) {
  await contextMenusReady;
  chrome.contextMenus.update("translate-page", {
    title: chrome.i18n.getMessage(
      isPageTranslated ? "contextTranslateToOriginal" : "contextTranslatePage"
    ),
  });
}

async function isPageTranslatedInTab(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: "get-page-state",
    });
    return response?.isPageTranslated === true;
  } catch {
    return false;
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tab;
}

async function refreshPageMenuForTab(tabId) {
  const isPageTranslated = await isPageTranslatedInTab(tabId);
  const activeTab = await getActiveTab();
  if (activeTab?.id === tabId) {
    updatePageMenuTitle(isPageTranslated);
  }
}

async function refreshPageMenuForActiveTab() {
  const tab = await getActiveTab();
  if (tab) {
    refreshPageMenuForTab(tab.id);
  }
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  refreshPageMenuForTab(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    refreshPageMenuForTab(tabId);
  }
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    refreshPageMenuForActiveTab();
  }
});

async function ensureContentScript(tabId) {
  const [{ result: isLoaded }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => globalThis.heliumInlineTranslatorLoaded === true,
  });
  if (!isLoaded) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/content.js"],
    });
  }
}

async function handleTranslationTrigger(triggerId, tabId) {
  try {
    await ensureContentScript(tabId);
    if (triggerId === "translate-page") {
      await chrome.tabs.sendMessage(tabId, { action: "translate-full-page" });
    } else if (triggerId === "translate-selection") {
      await chrome.tabs.sendMessage(tabId, { action: "translate-selection" });
    }
  } catch (error) {
    console.error("Translation trigger error:", error);
  }
}

chrome.commands.onCommand.addListener((command, tab) => {
  handleTranslationTrigger(command, tab?.id);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  handleTranslationTrigger(info.menuItemId, tab?.id);
});
