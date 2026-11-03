// Loaded before the page paints, so a saved theme never flashes the default first.
(function () {
  var themes = ['paper', 'night', 'forest', 'coastal'];
  var saved = null;
  try {
    saved = localStorage.getItem('theme');
  } catch (e) {}

  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme =
    themes.indexOf(saved) >= 0 ? saved : prefersDark ? 'night' : 'paper';
})();
