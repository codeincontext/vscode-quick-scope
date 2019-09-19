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

function highlightWord(
  word,
  occurrences,
  direction
): { position: number; type: "primary" | "secondary" } {
  const { text, offset } = word;
  let primary = null;
  let secondary = null;

  for (let i = 0, len = text.length; i < len; i++) {
    const char = text[i];

    if ((!primary || direction === "reverse") && !occurrences[char]) {
      primary = offset + i;
    }

    if ((!secondary || direction === "reverse") && occurrences[char] === 1) {
      secondary = offset + i;
    }

    occurrences[char] = (occurrences[char] || 0) + 1;
  }

  if (primary) {
    return {
      position: primary,
      type: "primary"
    };
  }
  if (secondary) {
    return {
      position: secondary,
      type: "secondary"
    };
  }
}

export default function getHighlights(
  text: string,
  direction: "forward" | "reverse"
): { position: number; type: "primary" | "secondary" }[] {
  const words = extractWords(text).filter(({ offset }) => offset > 0);

  // Whether a character is already being used
  const occurrences = {};

  // Primary highlights
  const highlights = words.map(word =>
    highlightWord(word, occurrences, direction)
  );

  return highlights.filter(h => h);
}
