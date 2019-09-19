//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as myExtension from "../extension";
import getHighlights from "../matcher";

function renderHighlights(text, highlights) {
  return text.split("").reduce((acc, char, i) => {
    if (highlights.primary.includes(i)) {
      char = `[${char}]`;
    }
    if (highlights.secondary.includes(i)) {
      char = `<${char}>`;
    }
    return `${acc}${char}`;
  });
}

function assertHighlights(input, output) {
  const highlights = getHighlights(input);
  assert.equal(renderHighlights(input, highlights), output);
}

// Defines a Mocha test suite to group tests of similar kind together
suite("Extension Tests", () => {
  test("Basic case, all primary", () => {
    assertHighlights(" axxx bxxx cxxx dxxx", " [a]xxx [b]xxx [c]xxx [d]xxx");
  });

  test("Highlighting in the middle of a word", () => {
    assertHighlights(
      " axxx xbxxx xxcx xxxdx",
      " [a]xxx x[b]xxx xx[c]x xxx[d]x"
    );
  });

  test("Reused first letter, all primary highlights", () => {
    assertHighlights(
      " axxx bxxx cxxx bxxx cxxx",
      " [a]xxx [b]xxx [c]xxx <b>xxx <c>xxx"
    );
  });

  test("Case sensitivity", () => {
    assertHighlights(
      " axxx Axxx bxxx Bxxx cxxx Cxxx",
      " [a]xxx [A]xxx [b]xxx [B]xxx [c]xxx [C]xxx"
    );
  });

  test("Ignores word under cursor", () => {
    assertHighlights(
      "axxx bxxx cxxx dxxx exxx fxxx",
      "axxx [b]xxx [c]xxx [d]xxx [e]xxx [f]xxx"
    );
  });
});
