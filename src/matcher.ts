const WORD_REGEX = /\w+/g;
function extractWords(text) {
  const words = [];
  let match;
  while ((match = WORD_REGEX.exec(text))) {
    words.push({
      text: match[0],
      offset: match.index
    });
  }
  return words;
}

function highlightWord(word, highlights, occurrences) {
  const { text, offset } = word;
  let highlighted = false;

  for (let i = 0, len = text.length; i < len; i++) {
    const char = text[i];

    if (!highlighted && !occurrences[char]) {
      highlights.push(offset + i);
      highlighted = true;
    }
    occurrences[char] = (occurrences[char] || 0) + 1;
  }

  return highlighted;
}

export default function getHighlights(
  text: string
): { primary: number[]; secondary: number[] } {
  const words = extractWords(text).filter(({ offset }) => offset > 0);

  // Whether a character is already being used
  const primaryOccurrences = {};
  const primaryHighlights = [];

  const unHighlightedWords = words.filter(word => {
    const didHighlight = highlightWord(
      word,
      primaryHighlights,
      primaryOccurrences
    );
    return !didHighlight;
  });

  const secondaryOccurrences = {};
  const secondaryHighlights = [];

  unHighlightedWords.forEach(word =>
    highlightWord(word, secondaryHighlights, secondaryOccurrences)
  );

  return { primary: primaryHighlights, secondary: secondaryHighlights };
}
