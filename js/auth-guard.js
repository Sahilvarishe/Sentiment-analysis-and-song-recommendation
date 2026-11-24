(() => {
  const apiBase = (localStorage.getItem('mindpulse_flask_url') || 'http://127.0.0.1:5000').replace(/\/$/, '');

  window.authReady = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${apiBase}/api/auth/me`, {
        credentials: 'include',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const reason = response.status === 401 ? 'expired' : 'unavailable';
        window.location.replace(`login.html?reason=${reason}`);
        return false;
      }

      const data = await response.json();
      window.currentUser = data.user;
      document.body.classList.remove('auth-pending');
      return true;
    } catch (error) {
      clearTimeout(timeoutId);
      window.location.replace('login.html?reason=unavailable');
      return false;
    }
  })();

  const bindAccountControls = () => {
    const name = document.getElementById('authenticatedUserName');
    const logoutButton = document.getElementById('logoutBtn');
    if (name && window.currentUser) name.textContent = window.currentUser.name;

    if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
        logoutButton.disabled = true;
        try {
          await fetch(`${apiBase}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
          });
        } finally {
          window.location.replace('login.html');
        }
      });
    }
  };

  window.authReady.then((authenticated) => {
    if (!authenticated) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindAccountControls, { once: true });
    } else {
      bindAccountControls();
    }
  });
})();