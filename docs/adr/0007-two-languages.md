# ADR-0007: Two languages, English and Spanish, from a typed dictionary

- **Status:** Accepted on 2026-10-22 (product owner)
- **Date:** 2026-10-22
- **Related:** ADR-0006 (design C); ADR-0008 (themes); SPEC.md › Conventions; VLW-40

## Context

The product owner wants the webapp in Spanish and English (2026-10-22). Until now SPEC listed internationalization as out of scope, and every user-facing text was English, written inline in the components. The API answers its errors in English (`detail`), and the pages show them in its own words.

## Options

1. **react-i18next.** The common choice, with lazy loading and rich interpolation. It adds two dependencies, and its keys are strings that TypeScript does not check without extra setup.
2. **A typed dictionary of our own.**
   - One object per language.
   - The Spanish one has the English one's type, so a missing or extra key fails `tsc`.
   - Dates, numbers and plurals come from the browser's `Intl`.
3. **For the API's English errors**:
   - (a) show them as they come;
   - (b) translate the known ones in the webapp, with the original as the fallback;
   - (c) have the API answer in the language of `Accept-Language`, which is an API story.

## Decision

Option 2, with option 3b for the API's errors (product owner, 2026-10-22).

- **Where the texts live:** `src/lib/i18n/`.
  - `en.ts` is the source.
  - `es.ts` is typed as `Messages`, the type of `en`.
  - A message is a string, or a function of its values when it needs a number or a name. Plurals use `Intl.PluralRules`.
- **How components read them:** a hook beside the components (`useT`) returns the dictionary of the current language. `lib` does not import the store, so the language comes in from outside.
- **Choosing the language:**
  - The person's last choice comes first.
  - Otherwise the browser's languages decide: the first `es-*` gives Spanish, anything else English.
  - The choice is stored with the theme under `veriledger-preferences` in `localStorage`.
  - `<html lang>` follows the choice.
  - The switch sits in the navbar; DESIGN.md draws it (VLW-38).
- **Dates and numbers** go through `Intl` with the language: `src/lib/format.ts` takes it as a parameter. The transaction page and the certificate stay in UTC in both languages.
- **The API's errors:**
  - `src/lib/i18n/apiMessages.ts` lists the API's known `detail` texts, exact or as patterns with their numbers, and maps each one to a message.
  - An unknown text is shown as it came, so nothing is hidden.
  - A test holds the list. When the API adds a message, it shows in English until someone adds it.
- **What is not translated:**
  - the product's name and the unit `VL`;
  - hashes, addresses and amounts;
  - the keys of the signed message, which are data.
- **A verifiable rule (AR-11, VLW-40):** every page rendered in Spanish shows none of the English dictionary's texts. So a text written inline in a component, rather than taken from the dictionary, fails the test.

## Consequences

- No new dependency.
- Every view story of epic E6 brings its texts in both languages. A Spanish text that does not fit is a design problem, solved in the canvas: VLW-38 checks the longest texts at 360 px.
- Component tests run in English unless they set the language. The accessibility and robustness passes run in both languages, and the end-to-end flows in English.
- SPEC's convention "user-facing text in English" becomes "in English and Spanish, from `src/lib/i18n`".
