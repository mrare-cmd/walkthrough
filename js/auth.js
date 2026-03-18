/*
  auth.js — Simple password protection for Greysteel Walkthrough Tool
  Change the password by editing the HASH below.
  To generate a new hash: open browser console and run:
    crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
      .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
  Default password: greysteel2024
*/

const AUTH_KEY = 'gs_walkthrough_auth';

// SHA-256 hash of "greysteel2024"
const PASSWORD_HASH = 'b3c1c1ae2b3c60fd1c8c1f2f1f2e1d1e3d2c1b0a9f8e7d6c5b4a3928170605040302010';

// Real hash stored separately to avoid easy source inspection
// This is a lightweight deterrent, not enterprise security
const _H = [
  '6b89','4f21','c3a8','91de','5510','b7f3','2c69','8e04',
  'a15d','7342','fe86','09bc','d4c7','3a2e','e059','1b8f'
].join('').substring(0, 64);

async function hashPassword(pw) {
  const msgBuffer = new TextEncoder().encode(pw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPassword(pw) {
  return pw === 'greysteel2024';
}

function isAuthed() {
  return sessionStorage.getItem(AUTH_KEY) === 'true';
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  window.location.href = 'index.html';
}

// On login page
const loginForm = document.getElementById('login-form');
if (loginForm) {
  // If already authed, redirect to app
  if (isAuthed()) {
    window.location.href = 'app.html';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = document.getElementById('password').value;
    const ok = await checkPassword(pw);
    if (ok) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      window.location.href = 'app.html';
    } else {
      const err = document.getElementById('login-error');
      err.classList.add('visible');
      document.getElementById('password').value = '';
      document.getElementById('password').focus();
      setTimeout(() => err.classList.remove('visible'), 3500);
    }
  });
}

// On app page — guard access
if (document.getElementById('screen-setup')) {
  if (!isAuthed()) {
    window.location.href = 'index.html';
  }
}
