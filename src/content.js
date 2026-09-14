// src/content.js
globalThis.heliumInlineTranslatorLoaded = true;

const BATCH_CHAR_LIMIT = 4500;
const BATCH_ITEM_LIMIT = 100;
const MAX_PARALLEL_REQUESTS = 3;
const EXCLUDED_CONTAINERS = "script, style, noscript, template, textarea";
const SENTENCE_BREAK = /[.!?]\s+|[。！？\n]/g;
const WHITESPACE = /\s+/g;

// Global state for full-page translation
let pageOriginals = new Map();
let isPageTranslated = false;
let pageTranslationRun = 0;

// Global state for selection translation
let selectionOriginals = new Map();
let lastTranslatedNodes = [];
let isSelectionTranslated = false;

const translationCache = new Map();

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
      revertPageTranslation();
    } else {
      handleFullPageTranslation();
    }
  } else if (request.action === "revert-translation") {
    revertPageTranslation();
  } else if (request.action === "get-page-state") {
    sendResponse({ isPageTranslated });
  }
});

function isTranslatableTextNode(node) {
  const parent = node.parentElement;
  return (
    parent !== null &&
    node.nodeValue.trim() !== "" &&
    !parent.closest(EXCLUDED_CONTAINERS) &&
    !parent.isContentEditable &&
    parent.checkVisibility({ visibilityProperty: true })
  );
}

function collectTranslatableTextNodes(root, isInScope = () => true) {
  const isWanted = (node) => isInScope(node) && isTranslatableTextNode(node);
  if (root.nodeType === Node.TEXT_NODE) {
    return isWanted(root) ? [root] : [];
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      isWanted(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP,
  });
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }
  return nodes;
}

// Handles translating the current user selection
async function handleSelectionTranslation() {
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed) {
    return;
  }

  const range = selection.getRangeAt(0);
  const textNodes = collectTranslatableTextNodes(
    range.commonAncestorContainer,
    (node) => range.intersectsNode(node),
  );
  if (!textNodes.length) {
    return;
  }

  const translatedTexts = [];
  await translateInBatches(
    textNodes.map((node) => node.nodeValue),
    await getTranslationScope(),
    {
      onTranslated: (index, translatedText) => {
        translatedTexts[index] = translatedText;
      },
    },
  );

  textNodes.forEach((node, index) => {
    if (!node.isConnected || translatedTexts[index] === undefined) {
      return;
    }
    if (!selectionOriginals.has(node)) {
      selectionOriginals.set(node, node.nodeValue);
    }
    node.nodeValue = translatedTexts[index];
    lastTranslatedNodes.push(node);
  });

  if (lastTranslatedNodes.length > 0) {
    isSelectionTranslated = true;
    selection.removeAllRanges();
  }
}

// Reverts the last selection translation
function revertSelectionTranslation() {
  for (const node of lastTranslatedNodes) {
    if (node.isConnected && selectionOriginals.has(node)) {
      node.nodeValue = selectionOriginals.get(node);
    }
  }
  selectionOriginals.clear();
  lastTranslatedNodes = [];
  isSelectionTranslated = false;
}

// Handles translating all text nodes on the page
async function handleFullPageTranslation() {
  const run = ++pageTranslationRun;
  const isCurrentRun = () => run === pageTranslationRun;
  setPageTranslated(true);
  const scope = await getTranslationScope();
  if (!isCurrentRun()) {
    return;
  }

  const nodes = collectTranslatableTextNodes(document.body);
  pageOriginals = new Map(nodes.map((node) => [node, node.nodeValue]));

  await translateInBatches(
    nodes.map((node) => node.nodeValue),
    scope,
    {
      isCancelled: () => !isCurrentRun(),
      onTranslated: (index, translatedText) => {
        if (isCurrentRun() && nodes[index].isConnected) {
          nodes[index].nodeValue = translatedText;
        }
      },
    },
  );
}

async function translateInBatches(
  texts,
  scope,
  { onTranslated, isCancelled = () => false },
) {
  const chunks = texts.flatMap((text, textIndex) =>
    splitLongText(text).map((chunkText, position) => ({
      textIndex,
      position,
      text: chunkText,
    })),
  );
  const translatedChunks = texts.map(() => []);
  const remainingChunks = texts.map(() => 0);
  chunks.forEach(({ textIndex }) => remainingChunks[textIndex]++);

  const onChunkTranslated = ({ textIndex, position }, translatedText) => {
    translatedChunks[textIndex][position] = translatedText;
    remainingChunks[textIndex]--;
    if (remainingChunks[textIndex] === 0) {
      onTranslated(textIndex, translatedChunks[textIndex].join(""));
    }
  };

  const queue = splitIntoBatches(chunks);
  const translateQueuedBatches = async () => {
    while (queue.length > 0 && !isCancelled()) {
      await translateBatch(queue.shift(), scope, onChunkTranslated);
    }
  };
  await Promise.all(
    Array.from({ length: MAX_PARALLEL_REQUESTS }, translateQueuedBatches),
  );
}

async function translateBatch(batch, scope, onChunkTranslated) {
  const uncachedChunks = [];
  for (const chunk of batch) {
    const cachedText = translationCache.get(cacheKey(scope, chunk.text));
    if (cachedText === undefined) {
      uncachedChunks.push(chunk);
    } else {
      onChunkTranslated(chunk, cachedText);
    }
  }
  if (uncachedChunks.length === 0) {
    return;
  }

  try {
    const translatedTexts = await requestTranslations(
      uncachedChunks.map((chunk) => chunk.text),
    );
    uncachedChunks.forEach((chunk, index) => {
      translationCache.set(cacheKey(scope, chunk.text), translatedTexts[index]);
      onChunkTranslated(chunk, translatedTexts[index]);
    });
  } catch (error) {
    console.error("Helium Inline Translator: Failed to translate a batch.", error);
  }
}

function cacheKey(scope, text) {
  return `${scope}|${text}`;
}

function splitIntoBatches(chunks) {
  const batches = [];
  let batch = [];
  let batchChars = 0;
  for (const chunk of chunks) {
    const isFull =
      batch.length === BATCH_ITEM_LIMIT ||
      batchChars + chunk.text.length > BATCH_CHAR_LIMIT;
    if (batch.length > 0 && isFull) {
      batches.push(batch);
      batch = [];
      batchChars = 0;
    }
    batch.push(chunk);
    batchChars += chunk.text.length;
  }
  if (batch.length > 0) {
    batches.push(batch);
  }
  return batches;
}

function splitLongText(text) {
  const chunks = [];
  let start = 0;
  while (text.length - start > BATCH_CHAR_LIMIT) {
    const window = text.slice(start, start + BATCH_CHAR_LIMIT);
    const end =
      lastMatchEnd(window, SENTENCE_BREAK) ||
      lastMatchEnd(window, WHITESPACE) ||
      window.length;
    chunks.push(text.slice(start, start + end));
    start += end;
  }
  chunks.push(text.slice(start));
  return chunks;
}

function lastMatchEnd(text, pattern) {
  let end = 0;
  for (const match of text.matchAll(pattern)) {
    end = match.index + match[0].length;
  }
  return end;
}

// Reverts the full page translation
function revertPageTranslation() {
  pageTranslationRun++;
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
