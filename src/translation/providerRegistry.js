import { googleProvider } from "./providers/google.js";
import { microsoftProvider } from "./providers/microsoft.js";
import { yandexProvider } from "./providers/yandex.js";

export const TRANSLATION_PROVIDERS = [
  googleProvider,
  microsoftProvider,
  yandexProvider,
];

export function findTranslationProvider(providerId) {
  return (
    TRANSLATION_PROVIDERS.find((provider) => provider.id === providerId) ??
    googleProvider
  );
}
