import {
  TRANSLATION_PROVIDERS,
  findTranslationProvider,
} from "../src/translation/providerRegistry.js";

const providerSelector = document.getElementById("providerSelector");

function createProviderOption(provider, isSelected) {
  const option = document.createElement("button");
  option.type = "button";
  option.className = "provider-option";
  option.textContent = provider.name;
  option.setAttribute("aria-pressed", String(isSelected));
  option.addEventListener("click", () => selectProvider(provider.id));
  return option;
}

function renderProviderOptions(selectedProviderId) {
  providerSelector.replaceChildren(
    ...TRANSLATION_PROVIDERS.map((provider) =>
      createProviderOption(provider, provider.id === selectedProviderId),
    ),
  );
}

async function selectProvider(providerId) {
  await chrome.storage.sync.set({ translationProvider: providerId });
  renderProviderOptions(providerId);
}

const { translationProvider } = await chrome.storage.sync.get(
  "translationProvider",
);
renderProviderOptions(findTranslationProvider(translationProvider).id);
