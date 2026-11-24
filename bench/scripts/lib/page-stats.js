// Functions passed to Playwright's page.evaluate(). They are serialized and run
// inside the page, so each one must be self-contained (no outer references).

/**
 * Counts the elements, attributes and depth below the element matching
 * `selector`, walking into open shadow roots. The root itself is not counted.
 */
export function collectDomStats(selector) {
  const root = document.querySelector(selector);
  const stats = { elements: 0, attributes: 0, maxDepth: 0, shadowRoots: 0 };

  const walk = (parent, depth) => {
    for (const el of parent.children) {
      stats.elements += 1;
      stats.attributes += el.attributes.length;
      stats.maxDepth = Math.max(stats.maxDepth, depth);
      walk(el, depth + 1);
      if (el.shadowRoot) {
        stats.shadowRoots += 1;
        walk(el.shadowRoot, depth + 1);
      }
    }
  };

  walk(root, 1);
  return stats;
}

/**
 * Counts style rules, selectors and declarations across every stylesheet the
 * page uses: <style>/<link> sheets and adopted sheets, in the document and in
 * all open shadow roots. Shorthands count as one declaration, as written.
 */
export function collectCssStats() {
  const sheets = new Set();
  const addSheets = (list) => {
    for (const sheet of list ?? []) sheets.add(sheet);
  };

  addSheets(document.styleSheets);
  addSheets(document.adoptedStyleSheets);
  const findShadowRoots = (parent) => {
    for (const el of parent.querySelectorAll('*')) {
      if (el.shadowRoot) {
        addSheets(el.shadowRoot.styleSheets);
        addSheets(el.shadowRoot.adoptedStyleSheets);
        findShadowRoots(el.shadowRoot);
      }
    }
  };
  findShadowRoots(document);

  // Split on commas that are not inside parentheses, e.g. ":is(.a, .b), .c".
  const countSelectors = (text) => {
    let count = 1;
    let depth = 0;
    for (const char of text) {
      if (char === '(') depth += 1;
      else if (char === ')') depth -= 1;
      else if (char === ',' && depth === 0) count += 1;
    }
    return count;
  };

  const countDeclarations = (style) =>
    style.cssText.split(';').filter((part) => part.trim() !== '').length;

  const stats = { sheets: sheets.size, styleRules: 0, selectors: 0, declarations: 0 };
  const walkRules = (rules) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        stats.styleRules += 1;
        stats.selectors += countSelectors(rule.selectorText);
        stats.declarations += countDeclarations(rule.style);
      }
      if (rule.cssRules) walkRules(rule.cssRules);
    }
  };

  for (const sheet of sheets) {
    try {
      walkRules(sheet.cssRules);
    } catch {
      // Cross-origin sheets cannot be read; none are expected in the bench.
    }
  }
  return stats;
}
