function isAuthed() { return true; }
function logout() { window.location.href = 'index.html'; }

if (document.getElementById('login-form')) {
  window.location.href = 'app.html';
}
```

Commit it, wait 30 seconds, then go straight to:
```
https://mrare-cmd.github.io/walkthrough/app.html
