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
    const beforeHighlights = getHighlights(
      beforeTextReversed,
      index => cursorColumn - index - 1
    );

    const afterText = line.slice(cursorPosition.character);
    const afterHighlights = getHighlights(
      afterText,
      index => cursorColumn + index
    );

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
  function extractWords(text, indexToOffset) {
    const words = [];
    let match;
    while ((match = WORD_REGEX.exec(text))) {
      if (match.index === 0) {
        continue;
      }
      words.push({
        text: match[0],
        offset: indexToOffset(match.index)
      });
    }
    return words;
  }

  function getHighlights(text: string, indexToOffset) {
    const words = extractWords(text, indexToOffset);
    const occurrences = {};
    const primaryHighlights = [];
    const secondaryHighlights = [];
    words.forEach(({ text, offset }) => {
      for (let i = 0, len = text.length; i < len; i++) {
        const char = text[i];
        if (!occurrences[char]) {
          occurrences[char] = 1;
          primaryHighlights.push(offset + i);
          break;
        }
        if (occurrences[char] == 1) {
          occurrences[char] = 2;
          secondaryHighlights.push(offset + i);
          break;
        }
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
