import { useState } from 'react';

// Keep in step with the list in public/theme.js and the themes in styles.css.
const themes = [
  ['paper', 'Paper'],
  ['night', 'Night'],
  ['forest', 'Forest'],
  ['coastal', 'Coastal'],
];

export default function ThemePicker() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme);

  function choose(id) {
    document.documentElement.dataset.theme = id;
    try {
      localStorage.setItem('theme', id);
    } catch {
      // Private browsing can block storage. The theme still applies for this visit.
    }
    setTheme(id);
  }

  return (
    <fieldset className="theme-picker">
      <legend className="sr-only">Color theme</legend>
      {themes.map(([id, label]) => (
        <label key={id} className="theme-option" data-theme-option={id} title={label}>
          <input
            type="radio"
            name="theme"
            value={id}
            checked={theme === id}
            onChange={() => choose(id)}
          />
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}
