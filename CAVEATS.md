# Developer Caveats & Project Quirks

This project is a 12-year-old codebase with zero modern dependencies. It uses a custom build system and a legacy "global-state" architecture. Here are the most critical things to know when working on it:

## 1. Aggressive Grunt Build Process (Crucial!)
The `Gruntfile.js` contains a `concat` task with a very aggressive `process` function.
- **Pattern Stripping**: It uses regexes to strip certain code patterns during concatenation to make the file "runnable standalone".
- **The "window" Trap**: Specifically, the line `.replace(/(^|\n)[ \t]*const .* = window/g, '')` will **silently delete** any `const` or `var` initialization that sources from `window`.
    - *Bad*: `const rawSpot = window.SpotCache[id];` -> becomes `.SpotCache[id];` (Syntax Error).
    - *Good*: `const rawSpot = SpotCache[id];` (and ensure `SpotCache` is in the `/* globals ... */` list for JSHint).

## 2. Legacy "Module" System
- Code is wrapped in a closure: `($ => { ... })(Object);`.
- The `Object` (like `Spot`, `Nav`, `Http`) is used to export functions to the global scope.
- `// require('./x.js');` comments are **purely documentary**. The actual order of file concatenation is handled by `Gruntfile.js` (alphabetical by default, so `base.js` is first and `z.js` is last).

## 3. Global Helpers
- `_('#id')` is a shortcut for `document.getElementById`.
- `_('.class')` is a shortcut for `document.querySelectorAll`.
- `t('key')` is the translation helper.

## 4. JSHint and Globals
The project is strictly linted with JSHint.
- Every file starts with a `/* globals ... */` block.
- If you introduce a new global (like `window.SpotCache`), you **must** add it to these blocks in every file that uses it, or JSHint will fail the build.

## 5. Backend Migration (2026)
- The legacy PHP backend is defunct.
- Calls to `query5j.php` are replaced with fan-out POST requests to Firebase Cloud Functions.
- **Request Format**: Firebase functions require the payload to be wrapped in a `data` object: `{"data": { ... }}`.
- **Spot IDs**: IDs are no longer numeric. They are alphanumeric Firebase IDs (~20 chars). Many regexes in `nav.js` and `search.js` were originally `\d+` and had to be updated to `\w+`.

## 6. HTML Base Tag
- The build system injects a `<base>` tag.
- Maintenance: Ensure it only has `target="_blank"` and no `href="..."` if you want to avoid interfering with local development or relative pathing logic in the new cloud function calls.
