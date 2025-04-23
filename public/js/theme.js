document.addEventListener('DOMContentLoaded', () => {
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // Initialize theme from localStorage or preference
  const savedTheme = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'true' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDarkMode = document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', isDarkMode);

      // Update theme radio button in preferences if exists
      const themeRadio = document.querySelector(`input[name="theme"][value="${isDarkMode ? 'dark' : 'light'}"]`);
      if (themeRadio) {
        themeRadio.checked = true;
      }
    });
  }
});