const themeToggleButtons = document.querySelectorAll('[data-theme-toggle]');

function applyTheme(theme) {
  document.body.classList.toggle('dark', theme === 'dark');
  themeToggleButtons.forEach(btn => {
    const icon = btn.querySelector('.theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    } else {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  });
}

function initTheme() {
  const savedTheme = localStorage.getItem('site-theme') || 'light';
  applyTheme(savedTheme);

  themeToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
      localStorage.setItem('site-theme', nextTheme);
      applyTheme(nextTheme);
    });
  });
}

document.addEventListener('DOMContentLoaded', initTheme);
