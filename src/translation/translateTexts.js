const SURROUNDING_WHITESPACE = /^(?<leading>\s*)(?<content>[\s\S]*?)(?<trailing>\s*)$/;

export async function translateTexts(provider, texts, targetLanguage) {
  const segments = texts.map(
    (text) => SURROUNDING_WHITESPACE.exec(text).groups,
  );
  const translatedTexts = await provider.translate(
    segments.map((segment) => segment.content),
    targetLanguage,
  );

  if (
    !Array.isArray(translatedTexts) ||
    translatedTexts.length !== texts.length
  ) {
    throw new Error(`${provider.name} returned an unexpected response`);
  }

  return translatedTexts.map((translatedText, index) => {
    const { leading, trailing } = segments[index];
    return `${leading}${translatedText}${trailing}`;
  });
}
