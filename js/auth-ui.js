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

window.showToast = window.showToast || function (msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
};

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

  /* watch for panel switches to inject meter lazily */
  const observer = new MutationObserver(injectStrengthMeter);
  const regPanel = document.getElementById('pReg');
  if (regPanel) observer.observe(regPanel, { attributes: true });
});