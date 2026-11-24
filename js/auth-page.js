(() => {
  const apiBase = (localStorage.getItem('mindpulse_flask_url') || 'http://127.0.0.1:5000').replace(/\/$/, '');
  const messageBox = document.getElementById('authMessage');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  const showMessage = (message, kind = 'error') => {
    if (!messageBox) return;
    messageBox.textContent = message;
    messageBox.dataset.kind = kind;
    messageBox.hidden = false;
  };

  const setLoading = (button, loading, label) => {
    button.disabled = loading;
    button.classList.toggle('is-loading', loading);
    button.querySelector('.button-label').textContent = loading ? 'Please wait...' : label;
  };

  const friendlyError = (status, serverMessage) => {
    if (status === 409) return 'An account with this email already exists. Try logging in instead.';
    if (status === 401) return 'Email or password is incorrect. Please try again.';
    if (status >= 500) return 'MoodMate could not reach the account service. Please try again shortly.';
    return serverMessage || 'Please check your details and try again.';
  };

  const send = async (endpoint, payload) => {
    const response = await fetch(`${apiBase}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  };

  const safeNextPage = () => {
    const requested = new URLSearchParams(window.location.search).get('next');
    if (!requested) return 'index.html';
    try {
      const next = new URL(requested, window.location.href);
      if (next.origin === window.location.origin && !/\/(login|register)\.html$/.test(next.pathname)) {
        return `${next.pathname}${next.search}${next.hash}`;
      }
    } catch (error) {}
    return 'index.html';
  };

  const bindPasswordToggles = () => {
    document.querySelectorAll('[data-toggle-password]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.togglePassword);
        const showing = input.type === 'password';
        input.type = showing ? 'text' : 'password';
        button.setAttribute('aria-pressed', String(showing));
        button.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
        button.querySelector('i').className = showing ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      });
    });
  };

  const bindPasswordStrength = () => {
    const password = document.getElementById('registerPassword');
    if (!password) return;
    const bar = document.getElementById('strengthBar');
    const label = document.getElementById('strengthLabel');
    password.addEventListener('input', () => {
      const value = password.value;
      const score = [
        value.length >= 8,
        /[a-z]/.test(value),
        /[A-Z]/.test(value),
        /\d/.test(value),
        /[^A-Za-z0-9]/.test(value)
      ].filter(Boolean).length;
      const levels = [
        { text: 'Use 8+ characters, including uppercase, lowercase, and a number.', color: '#f87171' },
        { text: 'Weak password', color: '#fb7185' },
        { text: 'Getting stronger', color: '#fbbf24' },
        { text: 'Good password', color: '#34d399' },
        { text: 'Strong password', color: '#6ee7b7' },
        { text: 'Strong password', color: '#6ee7b7' }
      ];
      const level = levels[score];
      bar.style.width = `${score * 20}%`;
      bar.style.backgroundColor = level.color;
      label.textContent = level.text;
    });
  };

  const bindLogin = () => {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      messageBox.hidden = true;
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      if (!email || !password) {
        showMessage('Enter your email address and password.');
        return;
      }

      const button = document.getElementById('loginSubmit');
      setLoading(button, true, 'Log in');
      try {
        const { response, data } = await send('login', {
          email,
          password,
          remember_me: document.getElementById('rememberMe').checked
        });
        if (!response.ok) {
          showMessage(friendlyError(response.status, data.error));
          return;
        }
        window.location.replace(safeNextPage());
      } catch (error) {
        showMessage('Unable to connect to MoodMate. Check that the Flask server is running.');
      } finally {
        setLoading(button, false, 'Log in');
      }
    });

    document.getElementById('forgotPasswordLink').addEventListener('click', () => {
      showMessage('Password reset is not configured yet. Please contact your project administrator.', 'info');
    });

    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') showMessage('Your account is ready. Log in to continue.', 'success');
    if (params.get('reason') === 'expired') showMessage('Your session ended. Please log in again.');
    if (params.get('reason') === 'unavailable') showMessage('The account service is unavailable. Please try again shortly.');
  };

  const bindRegistration = () => {
    const password = document.getElementById('registerPassword');
    const confirmation = document.getElementById('confirmPassword');
    const validateMatch = () => {
      confirmation.setCustomValidity(
        confirmation.value && confirmation.value !== password.value ? 'Passwords do not match.' : ''
      );
    };
    password.addEventListener('input', validateMatch);
    confirmation.addEventListener('input', validateMatch);

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      messageBox.hidden = true;
      validateMatch();
      if (!registerForm.reportValidity()) {
        showMessage(confirmation.validationMessage || 'Complete each required field to continue.');
        return;
      }

      const button = document.getElementById('registerSubmit');
      setLoading(button, true, 'Create account');
      try {
        const { response, data } = await send('register', {
          name: document.getElementById('registerName').value.trim(),
          email: document.getElementById('registerEmail').value.trim(),
          password: password.value,
          confirm_password: confirmation.value,
          terms_accepted: document.getElementById('termsAccepted').checked
        });
        if (!response.ok) {
          showMessage(friendlyError(response.status, data.error));
          return;
        }
        showMessage('Account created. Taking you to login...', 'success');
        registerForm.reset();
        window.setTimeout(() => window.location.replace('login.html?registered=1'), 1200);
      } catch (error) {
        showMessage('Unable to connect to MoodMate. Check that the Flask server is running.');
      } finally {
        setLoading(button, false, 'Create account');
      }
    });
  };

  const initializeAuthPage = async () => {
    bindPasswordToggles();
    bindPasswordStrength();
    if (loginForm) bindLogin();
    if (registerForm) bindRegistration();

    try {
      const response = await fetch(`${apiBase}/api/auth/me`, { credentials: 'include' });
      if (response.ok) {
        window.location.replace('index.html');
        return;
      }
    } catch (error) {}
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuthPage, { once: true });
  } else {
    initializeAuthPage();
  }
})();