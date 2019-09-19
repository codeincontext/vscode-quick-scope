// "use strict";
import * as vscode from "vscode";
import getHighlights from "./matcher";

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
    const beforeTextReversed = beforeText
      .split("")
      .reverse()
      .join("");
    const beforeHighlights = getHighlights(beforeTextReversed, "reverse").map(
      h => ({ ...h, position: cursorColumn - h.position - 1 })
    );

    const afterText = line.slice(cursorPosition.character + 1);
    const afterHighlights = getHighlights(afterText, "forward").map(h => ({
      ...h,
      position: cursorColumn + h.position + 1
    }));

    setDecorations(
      [...beforeHighlights, ...afterHighlights].filter(
        h => h.type === "primary"
      ),
      primaryDecorationType,
      cursorPosition.line
    );
    setDecorations(
      [...beforeHighlights, ...afterHighlights].filter(
        h => h.type === "secondary"
      ),
      secondaryDecorationType,
      cursorPosition.line
    );
  }

  function setDecorations(highlights, decorationType, cursorLine) {
    const decorations: vscode.DecorationOptions[] = highlights.map(h => ({
      range: new vscode.Range(
        cursorLine,
        h.position,
        cursorLine,
        h.position + 1
      )
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
