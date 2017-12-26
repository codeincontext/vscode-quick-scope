// "use strict";
import * as vscode from "vscode";

const primaryDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("editor.selectionBackground")
});

const secondaryDecorationType = vscode.window.createTextEditorDecorationType({
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: new vscode.ThemeColor("editor.selectionBackground")
});

export function activate(context: vscode.ExtensionContext) {
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(
    editor => {
      activeEditor = editor;
      if (editor) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  vscode.window.onDidChangeTextEditorSelection(
    triggerUpdateDecorations,
    null,
    context.subscriptions
  );

  var timeout = null;
  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(updateDecorations, 10);
  }

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }

    const cursorPosition = getPosition(activeEditor);
    const cursorColumn = cursorPosition.character;
    const line = getLine(activeEditor, cursorPosition);

    const beforeText = line.slice(0, cursorColumn);
    const beforeTextReversed = beforeText.split("").reverse().join("");
    const beforeHighlights = getHighlights(beforeTextReversed);
    beforeHighlights.primary = beforeHighlights.primary.map(index => cursorColumn - index - 1)
    beforeHighlights.secondary = beforeHighlights.secondary.map(index => cursorColumn - index - 1)

    const afterText = line.slice(cursorPosition.character + 1);
    const afterHighlights = getHighlights(afterText);
    afterHighlights.primary = afterHighlights.primary.map(index => cursorColumn + index + 1)
    afterHighlights.secondary = afterHighlights.secondary.map(index => cursorColumn + index + 1)

    setDecorations(
      [...beforeHighlights.primary, ...afterHighlights.primary],
      primaryDecorationType,
      cursorPosition.line
    );
    setDecorations(
      [...beforeHighlights.secondary, ...afterHighlights.secondary],
      secondaryDecorationType,
      cursorPosition.line
    );
  }

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

  function getHighlights(text: string) {
    let words = extractWords(text);

    let occurrences = {};
    const primaryHighlights = [];

    words = words.map(({ text, offset }) => {
      let hasHighlight = false;
      for (let i = 0, len = text.length; i < len; i++) {
        const char = text[i];
        const currentWord = offset === 0;

        if (!hasHighlight && !occurrences[char] && !currentWord) {
          primaryHighlights.push(offset + i);
          hasHighlight = true;
        }
        occurrences[char] = (occurrences[char] || 0) + 1;
      }

      return { text, offset, hasHighlight };
    });

    occurrences = {};
    const secondaryHighlights = [];

    words.forEach(({text, offset, hasHighlight}) => {
      for (let i = 0, len = text.length; i < len; i++) {
        const char = text[i];
        const currentWord = offset === 0;

        if (!hasHighlight && occurrences[char] === 1 && !currentWord) {
          secondaryHighlights.push(offset + i);
          hasHighlight = true;
        }
        occurrences[char] = (occurrences[char] || 0) + 1;
      }
    });

    return { primary: primaryHighlights, secondary: secondaryHighlights };
  }

  function setDecorations(highlights, decorationType, cursorLine) {
    const decorations: vscode.DecorationOptions[] = highlights.map(column => ({
      range: new vscode.Range(cursorLine, column, cursorLine, column + 1)
    }));
    activeEditor.setDecorations(decorationType, decorations);
  }

  function getPosition(editor: vscode.TextEditor): vscode.Position {
    return editor.selection.active;
  }

  function getLine(
    editor: vscode.TextEditor,
    position: vscode.Position
  ): string {
    return editor.document.lineAt(position).text;
  }
}
