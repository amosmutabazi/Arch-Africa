/* ═══════════════════════════════════════════════════════
   ARCH-AFRICA  —  auth-ui.js
   Features:
   1. Loading spinners while authenticating
   2. Form validation before submission
   3. Success messages after login/register
   4. Clear error handling
   5. Remember me (persist login state)
   6. Password strength meter on registration
   7. Email verification notice after register
   8. Google Sign-In (via GSI button)
   ═══════════════════════════════════════════════════════ */

/* ── helpers ── */
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = 'auth-msg ' + (type || '');
}

function setLoading(btnId, loading, defaultText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? '⏳ Please wait…' : defaultText;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── password strength meter ── */
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

function renderStrengthMeter(pw) {
  const meter = document.getElementById('pwStrengthMeter');
  const label = document.getElementById('pwStrengthLabel');
  if (!meter || !label) return;

  const score = getPasswordStrength(pw);
  const levels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];

  meter.style.width = (score / 5 * 100) + '%';
  meter.style.background = colors[score] || '#444';
  label.textContent = pw.length ? levels[score] || '' : '';
  label.style.color = colors[score] || '';
}

/* inject strength meter HTML after password field on register */
function injectStrengthMeter() {
  const pwField = document.getElementById('rPw');
  if (!pwField || document.getElementById('pwStrengthWrap')) return;

  const wrap = document.createElement('div');
  wrap.id = 'pwStrengthWrap';
  wrap.style.cssText = 'margin-top:6px;';
  wrap.innerHTML = `
    <div style="height:4px;background:var(--border,#333);border-radius:2px;overflow:hidden">
      <div id="pwStrengthMeter" style="height:100%;width:0;transition:width .3s,background .3s;border-radius:2px"></div>
    </div>
    <span id="pwStrengthLabel" style="font-size:.75rem;display:block;margin-top:3px;min-height:1em"></span>
  `;
  pwField.closest('.f-field').appendChild(wrap);
  pwField.addEventListener('input', () => renderStrengthMeter(pwField.value));
}

/* inject Google button */
function injectGoogleButton() {
  const clientId = window.__GOOGLE_CLIENT_ID__;
  if (!clientId) return;

  const targets = ['pLogin', 'pReg'];
  targets.forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (!panel || panel.querySelector('.google-btn-wrap')) return;

    const div = document.createElement('div');
    div.className = 'google-btn-wrap';
    div.style.cssText = 'margin-top:1rem;text-align:center;';
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.7rem">
        <div style="flex:1;height:1px;background:var(--border,#333)"></div>
        <span style="font-size:.75rem;color:var(--muted,#888)">OR</span>
        <div style="flex:1;height:1px;background:var(--border,#333)"></div>
      </div>
      <button type="button" class="google-signin-btn" onclick="window.doGoogleSignIn()" style="
        display:flex;align-items:center;gap:.6rem;justify-content:center;
        width:100%;padding:.65rem 1rem;border-radius:8px;
        border:1px solid var(--border,#444);background:var(--bg,#111);
        color:var(--text,#fff);font-size:.88rem;cursor:pointer;
        transition:background .2s,border-color .2s;
      ">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
    `;
    panel.appendChild(div);
  });
}

/* ── Google sign-in handler ── */
window.doGoogleSignIn = async function () {
  const clientId = window.__GOOGLE_CLIENT_ID__;
  if (!clientId) {
    showToast('Google Sign-In not configured.');
    return;
  }

  try {
    const idToken = await new Promise((resolve, reject) => {
      if (!window.google?.accounts?.id) {
        reject(new Error('Google SDK not loaded'));
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => resolve(resp.credential),
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject(new Error('Google sign-in was cancelled or blocked'));
        }
      });
    });

    const { token, user } = await API.auth.google(idToken);
    API.setToken(token);
    API.setUser(user);
    updateAuthUI();
    closeModal('authModal');
    showToast(`Welcome, ${user.name}! 🎉`);
  } catch (e) {
    showToast('Google sign-in failed: ' + e.message);
  }
};

/* ── update navbar UI ── */
window.updateAuthUI = function () {
  const user = API.getUser();
  const loginBtn  = document.getElementById('openLoginBtn');
  const userActions = document.getElementById('userActions');
  if (!loginBtn || !userActions) return;

  loginBtn.style.display   = user ? 'none'   : 'inline-block';
  userActions.style.display = user ? 'flex'  : 'none';

  if (user) {
    const nm = document.getElementById('userNm');
    const av = document.getElementById('userAv');
    if (nm) nm.textContent = user.name.split(' ')[0];
    if (av) av.textContent = user.name.charAt(0).toUpperCase();
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink) adminLink.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
  }
};

/* ── login ── */
window.doLogin = async function () {
  const emailEl = document.getElementById('lEmail');
  const pwEl    = document.getElementById('lPw');
  const remMe   = document.getElementById('remMe');

  const email    = emailEl.value.trim();
  const password = pwEl.value;

  /* validation */
  if (!email) {
    setMsg('lMsg', '⚠ Please enter your email.', 'err');
    emailEl.focus();
    return;
  }
  if (!isValidEmail(email)) {
    setMsg('lMsg', '⚠ Please enter a valid email address.', 'err');
    emailEl.focus();
    return;
  }
  if (!password) {
    setMsg('lMsg', '⚠ Please enter your password.', 'err');
    pwEl.focus();
    return;
  }

  /* loading state */
  const loginBtn = document.querySelector('#pLogin .btn-full');
  if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = '⏳ Signing in…'; }
  setMsg('lMsg', '', '');

  try {
    const { token, user } = await API.auth.login({ email, password });

    /* remember me */
    if (remMe?.checked) {
      localStorage.setItem('aa_remember', '1');
    } else {
      localStorage.removeItem('aa_remember');
    }

    API.setToken(token);
    API.setUser(user);
    setMsg('lMsg', '✓ Logged in successfully!', 'ok');
    updateAuthUI();
    setTimeout(() => {
      closeModal('authModal');
      showToast(`Welcome back, ${user.name}! 👋`);
    }, 600);
  } catch (e) {
    setMsg('lMsg', '✗ ' + (e.message || 'Login failed. Please try again.'), 'err');
  } finally {
    if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = 'Login →'; }
  }
};

/* ── register ── */
window.doRegister = async function () {
  const nameEl  = document.getElementById('rName');
  const emailEl = document.getElementById('rEmail');
  const pwEl    = document.getElementById('rPw');
  const pwcEl   = document.getElementById('rPwC');
  const terms   = document.getElementById('rTerms');

  const name     = nameEl.value.trim();
  const email    = emailEl.value.trim();
  const password = pwEl.value;
  const pwc      = pwcEl.value;

  /* validation */
  if (!name) {
    setMsg('rMsg', '⚠ Please enter your full name.', 'err');
    nameEl.focus(); return;
  }
  if (!email) {
    setMsg('rMsg', '⚠ Please enter your email.', 'err');
    emailEl.focus(); return;
  }
  if (!isValidEmail(email)) {
    setMsg('rMsg', '⚠ Please enter a valid email address.', 'err');
    emailEl.focus(); return;
  }
  if (password.length < 8) {
    setMsg('rMsg', '⚠ Password must be at least 8 characters.', 'err');
    pwEl.focus(); return;
  }
  if (getPasswordStrength(password) < 2) {
    setMsg('rMsg', '⚠ Password is too weak. Add numbers or symbols.', 'err');
    pwEl.focus(); return;
  }
  if (password !== pwc) {
    setMsg('rMsg', '⚠ Passwords do not match.', 'err');
    pwcEl.focus(); return;
  }
  if (!terms?.checked) {
    setMsg('rMsg', '⚠ Please accept the Terms & Privacy Policy.', 'err');
    return;
  }

  /* loading */
  const regBtn = document.querySelector('#pReg .btn-full');
  if (regBtn) { regBtn.disabled = true; regBtn.textContent = '⏳ Creating account…'; }
  setMsg('rMsg', '', '');

  try {
    const { token, user, emailSent } = await API.auth.register({ name, email, password });
    API.setToken(token);
    API.setUser(user);

    const msg = emailSent
      ? `✓ Account created! A confirmation email has been sent to ${email}.`
      : '✓ Account created successfully! Welcome to ARCH-AFRICA.';
    setMsg('rMsg', msg, 'ok');
    updateAuthUI();
    setTimeout(() => {
      closeModal('authModal');
      showToast(`Welcome, ${user.name}! 🎉`);
    }, 1200);
  } catch (e) {
    setMsg('rMsg', '✗ ' + (e.message || 'Registration failed. Please try again.'), 'err');
  } finally {
    if (regBtn) { regBtn.disabled = false; regBtn.textContent = 'Create Account →'; }
  }
};

/* ── forgot password ── */
let _fEm = '';
window.fStep1 = async function () {
  const emailEl = document.getElementById('fEm');
  const email   = emailEl.value.trim();

  if (!email) {
    setMsg('fm1', '⚠ Please enter your email.', 'err');
    emailEl.focus(); return;
  }
  if (!isValidEmail(email)) {
    setMsg('fm1', '⚠ Please enter a valid email address.', 'err');
    emailEl.focus(); return;
  }

  const btn = document.querySelector('#fs1 .btn-full');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Sending…'; }

  try {
    const data = await API.auth.forgot(email);
    _fEm = email;
    if (data.resetUrl) {
      setMsg('fm1', '✓ Reset link ready — redirecting…', 'ok');
      setTimeout(() => { window.location.href = data.resetUrl; }, 800);
    } else {
      setMsg('fm1', '✓ ' + (data.message || 'Check your email for reset instructions.'), 'ok');
    }
  } catch (e) {
    setMsg('fm1', '✗ ' + (e.message || 'Request failed. Try again.'), 'err');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Continue →'; }
  }
};

window.fStep2 = function () {
  setMsg('fm2', '✓ Use the link from your email on the reset password page.', 'ok');
  document.getElementById('fs2')?.classList.remove('active');
  document.getElementById('fs3')?.classList.add('active');
};

/* ── logout ── */
window.doLogout = function () {
  API.clearAuth();
  updateAuthUI();
  showToast('You have been logged out.');
};

/* ── session verify on load ── */
async function verifySession() {
  if (!API.getToken()) return;
  try {
    const { user } = await API.auth.me();
    API.setUser(user);
    updateAuthUI();
  } catch {
    API.clearAuth();
    updateAuthUI();
  }
}

/* ── init on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  verifySession();
  injectStrengthMeter();

  /* load Google SDK and inject button once ready */
  if (window.__GOOGLE_CLIENT_ID__) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = injectGoogleButton;
    document.head.appendChild(script);
  } else {
    /* show "not configured" only in dev */
    if (location.hostname === 'localhost') {
      console.warn('Google Sign-In: set window.__GOOGLE_CLIENT_ID__ to enable.');
    }
  }

  /* watch for panel switches to inject meter/buttons lazily */
  const observer = new MutationObserver(injectStrengthMeter);
  const regPanel = document.getElementById('pReg');
  if (regPanel) observer.observe(regPanel, { attributes: true });
});