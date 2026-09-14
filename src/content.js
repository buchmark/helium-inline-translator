// src/content.js
console.log("Helium Inline Translator: Content script v8 loaded and active!");
globalThis.heliumInlineTranslatorLoaded = true;

// Global state for full-page translation
let pageOriginals = new Map();
let isPageTranslated = false;

// Global state for selection translation
let selectionOriginals = new Map();
let lastTranslatedNodes = [];
let isSelectionTranslated = false;

const translationCache = new Map();
let translationScope = "";

async function getTranslationScope() {
  const { translationProvider, targetLanguage } =
    await chrome.storage.sync.get(["translationProvider", "targetLanguage"]);
  return [translationProvider, targetLanguage].join("|");
}

async function requestTranslations(texts) {
  const response = await chrome.runtime.sendMessage({
    action: "getTranslation",
    texts,
  });
  if (!Array.isArray(response?.translatedTexts)) {
    throw new Error(response?.error ?? "Invalid translation response");
  }
  return response.translatedTexts;
}

// Main listener for commands from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translate-selection") {
    if (isSelectionTranslated) {
      revertSelectionTranslation();
    } else {
      handleSelectionTranslation();
    }
  } else if (request.action === "translate-full-page") {
    if (isPageTranslated) {
      console.log(
        "Helium Inline Translator: Page is already translated. Reverting now.",
      );
      revertPageTranslation();
    } else {
      handleFullPageTranslation();
    }
  } else if (request.action === "revert-translation") {
    revertPageTranslation();
  } else if (request.action === "get-page-state") {
    sendResponse({ isPageTranslated });
  }
  return true;
});

// Handles translating the current user selection
async function handleSelectionTranslation() {
  console.log("Helium Inline Translator: handleSelectionTranslation called");
  const selection = window.getSelection();

  if (!selection.rangeCount || selection.isCollapsed) {
    console.log("Helium Inline Translator: No valid selection");
    return;
  }

  const range = selection.getRangeAt(0);
  console.log("Helium Inline Translator: Range obtained", {
    startContainer: range.startContainer,
    endContainer: range.endContainer,
    commonAncestor: range.commonAncestorContainer,
  });

  const textNodes = collectTextNodesFromRange(range);
  console.log(
    `Helium Inline Translator: Collected ${textNodes.length} text nodes`,
  );

  if (!textNodes.length) {
    console.log("Helium Inline Translator: No text nodes found in selection.");
    return;
  }

  let translatedTexts;
  try {
    translatedTexts = await requestTranslations(
      textNodes.map((node) => node.nodeValue),
    );
  } catch (error) {
    console.error(
      "Helium Inline Translator: Failed to translate selection.",
      error,
    );
    return;
  }

  // Store originals for undo
  textNodes.forEach((node, index) => {
    if (node.isConnected) {
      if (!selectionOriginals.has(node)) {
        selectionOriginals.set(node, node.nodeValue);
      }
      node.nodeValue = translatedTexts[index];
    }
  });

  lastTranslatedNodes = textNodes;
  isSelectionTranslated = true;
  selection.removeAllRanges();
}

// Reverts the last selection translation
function revertSelectionTranslation() {
  console.log("Helium Inline Translator: Reverting selection translation.");
  for (const node of lastTranslatedNodes) {
    if (node.isConnected && selectionOriginals.has(node)) {
      node.nodeValue = selectionOriginals.get(node);
    }
  }
  selectionOriginals.clear();
  lastTranslatedNodes = [];
  isSelectionTranslated = false;
}

function collectTextNodesFromRange(range) {
  if (!range) {
    console.log(
      "Helium Inline Translator: No range provided to collectTextNodesFromRange",
    );
    return [];
  }

  const textNodes = [];
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    null,
  );

  const rootNode = walker.currentNode;
  if (
    rootNode &&
    rootNode.nodeType === Node.TEXT_NODE &&
    rootNode.nodeValue.trim() &&
    range.intersectsNode(rootNode)
  ) {
    textNodes.push(rootNode);
  }

  let node;
  while ((node = walker.nextNode())) {
    if (range.intersectsNode(node) && node.nodeValue.trim()) {
      textNodes.push(node);
    }
  }

  console.log(
    `Helium Inline Translator: collectTextNodesFromRange found ${textNodes.length} nodes`,
  );
  return textNodes;
}

// Handles translating all text nodes on the page
async function handleFullPageTranslation() {
  console.log(
    "Helium Inline Translator: Starting full page translation with batching.",
  );
  setPageTranslated(true);
  translationScope = await getTranslationScope();

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (
          node.parentElement.closest(
            'script, style, textarea, [contenteditable="true"]',
          )
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        if (node.nodeValue.trim() === "") {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  const nodesToTranslate = [];
  while (walker.nextNode()) {
    nodesToTranslate.push(walker.currentNode);
  }

  for (const node of nodesToTranslate) {
    if (!pageOriginals.has(node)) {
      pageOriginals.set(node, node.nodeValue);
    }
  }

  await translateNodesInBatches(nodesToTranslate);

  console.log(
    `Helium Inline Translator: Finished. Translated ${pageOriginals.size} text nodes.`,
  );
}

async function translateNodesInBatches(nodes) {
  const BATCH_CHAR_LIMIT = 4500;
  const MAX_PARALLEL_REQUESTS = 3;

  const batches = [];
  let currentBatch = [];
  let currentCount = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeText = pageOriginals.get(node) || "";

    if (
      currentBatch.length > 0 &&
      currentCount + nodeText.length > BATCH_CHAR_LIMIT
    ) {
      batches.push(currentBatch);
      currentBatch = [];
      currentCount = 0;
    }

    currentBatch.push(node);
    currentCount += nodeText.length;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  const queue = batches.slice();
  const running = [];

  while (queue.length > 0 || running.length > 0) {
    while (queue.length > 0 && running.length < MAX_PARALLEL_REQUESTS) {
      const batch = queue.shift();
      const promise = processBatch(batch).finally(() => {
        const index = running.indexOf(promise);
        if (index !== -1) {
          running.splice(index, 1);
        }
      });
      running.push(promise);
    }

    if (running.length > 0) {
      await Promise.race(running);
    }
  }

  async function processBatch(nodeBatch) {
    if (!nodeBatch || nodeBatch.length === 0) {
      return;
    }

    const originalTexts = nodeBatch.map((n) => pageOriginals.get(n) || "");
    const cacheKeys = originalTexts.map(
      (text) => `${translationScope}|${text}`,
    );
    const results = new Array(nodeBatch.length).fill(undefined);

    const textsToTranslate = [];
    const translationIndices = [];

    for (let i = 0; i < nodeBatch.length; i++) {
      const cachedValue = translationCache.get(cacheKeys[i]);
      if (cachedValue !== undefined) {
        results[i] = cachedValue;
      } else {
        textsToTranslate.push(originalTexts[i]);
        translationIndices.push(i);
      }
    }

    if (textsToTranslate.length > 0) {
      try {
        const translatedTexts = await requestTranslations(textsToTranslate);
        translationIndices.forEach((batchIndex, resultIndex) => {
          const translatedText = translatedTexts[resultIndex];
          results[batchIndex] = translatedText;
          translationCache.set(cacheKeys[batchIndex], translatedText);
        });
      } catch (e) {
        console.error(
          "Helium Inline Translator: Failed to process a batch.",
          e,
        );
      }
    }

    for (let i = 0; i < nodeBatch.length; i++) {
      const nodeToUpdate = nodeBatch[i];
      if (results[i] !== undefined && nodeToUpdate.isConnected) {
        nodeToUpdate.nodeValue = results[i];
      }
    }
  }
}

// Reverts the full page translation
function revertPageTranslation() {
  console.log("Helium Inline Translator: Reverting page translation.");
  for (const [node, originalText] of pageOriginals.entries()) {
    if (node.isConnected) {
      node.nodeValue = originalText;
    }
  }
  pageOriginals.clear();
  setPageTranslated(false);
}

function setPageTranslated(value) {
  isPageTranslated = value;
  chrome.runtime.sendMessage({
    action: "page-translation-changed",
    isPageTranslated: value,
  });
}
