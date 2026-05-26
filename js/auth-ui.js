window.updateAuthUI = function () {
  const user = API.getUser();
  const loginBtn = document.getElementById('openLoginBtn');
  const userActions = document.getElementById('userActions');
  if (!loginBtn || !userActions) return;

  loginBtn.style.display = user ? 'none' : 'inline-block';
  userActions.style.display = user ? 'flex' : 'none';

  if (user) {
    const nm = document.getElementById('userNm');
    const av = document.getElementById('userAv');
    if (nm) nm.textContent = user.name.split(' ')[0];
    if (av) av.textContent = user.name.charAt(0).toUpperCase();
    const adminLink = document.getElementById('adminNavLink');
    if (adminLink) adminLink.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
  }
};

window.doLogin = async function () {
  const email = document.getElementById('lEmail').value.trim();
  const password = document.getElementById('lPw').value;
  if (!email || !password) {
    setMsg('lMsg', 'Please enter email and password.', 'err');
    return;
  }
  const lMsg = document.getElementById('lMsg');
  lMsg.textContent = 'Logging in...';
  lMsg.className = 'auth-msg';
  try {
    const { token, user } = await API.auth.login({ email, password });
    API.setToken(token);
    API.setUser(user);
    setMsg('lMsg', '✓ Logged in', 'ok');
    updateAuthUI();
    closeModal('authModal');
    showToast(`Welcome back, ${user.name}! 👋`);
  } catch (e) {
    setMsg('lMsg', e.message, 'err');
  }
};

window.doRegister = async function () {
  const name = document.getElementById('rName').value.trim();
  const email = document.getElementById('rEmail').value.trim();
  const password = document.getElementById('rPw').value;
  const pwc = document.getElementById('rPwC').value;
  const terms = document.getElementById('rTerms').checked;
  if (!name || !email || !password) {
    setMsg('rMsg', 'Please fill all fields.', 'err');
    return;
  }
  if (password.length < 8) {
    setMsg('rMsg', 'Password must be at least 8 characters.', 'err');
    return;
  }
  if (password !== pwc) {
    setMsg('rMsg', 'Passwords do not match.', 'err');
    return;
  }
  if (!terms) {
    setMsg('rMsg', 'Please accept the terms.', 'err');
    return;
  }
  const rMsg = document.getElementById('rMsg');
  rMsg.textContent = 'Creating account...';
  rMsg.className = 'auth-msg';
  try {
    const { token, user } = await API.auth.register({ name, email, password });
    API.setToken(token);
    API.setUser(user);
    setMsg('rMsg', '✓ Account created', 'ok');
    updateAuthUI();
    closeModal('authModal');
    showToast(`Welcome, ${name}! 🎉`);
  } catch (e) {
    setMsg('rMsg', e.message, 'err');
  }
};

let _fEm = '';
window.fStep1 = async function () {
  const email = document.getElementById('fEm').value.trim();
  if (!email) {
    setMsg('fm1', 'Please enter your email.', 'err');
    return;
  }
  try {
    const data = await API.auth.forgot(email);
    _fEm = email;
    if (data.resetUrl) {
      setMsg('fm1', 'Reset link ready — opening reset page…', 'ok');
      setTimeout(() => { window.location.href = data.resetUrl; }, 800);
    } else {
      setMsg('fm1', data.message || 'Check your email for reset instructions.', 'ok');
    }
  } catch (e) {
    setMsg('fm1', e.message, 'err');
  }
};

window.fStep2 = function () {
  setMsg('fm2', 'Use the link from your email on the reset password page.', 'ok');
  document.getElementById('fs2').classList.remove('active');
  document.getElementById('fs3').classList.add('active');
};

window.doLogout = function () {
  API.clearAuth();
  updateAuthUI();
  showToast('You have been logged out.');
};

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

document.addEventListener('DOMContentLoaded', verifySession);
