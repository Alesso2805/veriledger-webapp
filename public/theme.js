// Sets the stored theme and language on <html> before the first paint, so a page never flashes the other theme
// (ADR-0008, ADR-0007). A file, not an inline script, because the Content Security Policy allows only 'self'
// scripts. With no choice, or one it does not know, it sets nothing: the page follows the system, and the app
// picks the browser's language.
(function () {
  try {
    var state = JSON.parse(localStorage.getItem('veriledger-preferences')).state;
    if (state.theme === 'light' || state.theme === 'dark') document.documentElement.setAttribute('data-theme', state.theme);
    if (state.language === 'en' || state.language === 'es') document.documentElement.lang = state.language;
  } catch {
    // Nothing stored, or not JSON: the system decides.
  }
})();
