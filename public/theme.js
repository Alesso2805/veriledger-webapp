// Sets the stored theme on <html> before the first paint, so a page never flashes the other one (ADR-0008).
// A file, not an inline script, because the Content Security Policy allows only 'self' scripts. With no choice,
// or one it does not know, it sets nothing and the page follows the system.
(function () {
  try {
    var theme = JSON.parse(localStorage.getItem('veriledger-preferences')).state.theme;
    if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
  } catch {
    // Nothing stored, or not JSON: the system decides.
  }
})();
