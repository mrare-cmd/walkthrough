/* ============================================================
   GREYSTEEL UNIT WALKTHROUGH — STYLESHEET
   Fonts: Cormorant Garamond (display) + DM Sans (UI)
   Palette: Navy #1a2332 / Gold #c9a84c / Warm White #f7f5f0
   ============================================================ */

:root {
  --navy:        #1a2332;
  --navy-dark:   #111820;
  --navy-mid:    #243040;
  --gold:        #c9a84c;
  --gold-light:  #dfc070;
  --gold-pale:   #f5edda;
  --warm-white:  #f7f5f0;
  --warm-gray:   #ede9e1;
  --mid-gray:    #b8b2a8;
  --text-primary: #1a2332;
  --text-secondary: #6b6560;
  --text-muted:  #9e9890;
  --border:      rgba(26,35,50,0.12);
  --border-strong: rgba(26,35,50,0.22);
  --white:       #ffffff;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --shadow-sm:   0 1px 3px rgba(26,35,50,0.08), 0 1px 2px rgba(26,35,50,0.04);
  --shadow-md:   0 4px 16px rgba(26,35,50,0.10), 0 2px 4px rgba(26,35,50,0.06);
  --shadow-lg:   0 8px 32px rgba(26,35,50,0.14), 0 2px 8px rgba(26,35,50,0.08);
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-ui:     'DM Sans', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { font-size: 16px; -webkit-font-smoothing: antialiased; }

body {
  font-family: var(--font-ui);
  color: var(--text-primary);
  background: var(--warm-white);
  min-height: 100vh;
}

/* ============================================================
   TYPOGRAPHY
   ============================================================ */
h1, h2, h3 { font-family: var(--font-display); font-weight: 500; letter-spacing: 0.01em; }

/* ============================================================
   WORDMARK
   ============================================================ */
.gs-wordmark {
  font-family: var(--font-ui);
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.18em;
  color: var(--white);
}
.gs-wordmark span { color: var(--gold); }

.gs-wordmark-sm {
  font-family: var(--font-ui);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.16em;
  color: var(--white);
}
.gs-wordmark-sm span { color: var(--gold); }

/* ============================================================
   LOGIN PAGE
   ============================================================ */
.login-page {
  background: var(--navy);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  overflow: hidden;
}

.login-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
}

.login-grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px);
  background-size: 48px 48px;
}

.login-wrap {
  position: relative; z-index: 1;
  width: 100%; max-width: 420px;
  padding: 1.5rem;
}

.login-card {
  background: var(--navy-dark);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: var(--radius-lg);
  padding: 2.5rem 2rem;
  box-shadow: var(--shadow-lg);
}

.gs-lockup {
  text-align: center;
  margin-bottom: 2.5rem;
}

.gs-rule {
  width: 40px; height: 1px;
  background: var(--gold);
  margin: 14px auto;
  opacity: 0.6;
}

.gs-tagline {
  font-family: var(--font-display);
  font-size: 17px;
  color: rgba(255,255,255,0.55);
  letter-spacing: 0.04em;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.25);
  margin-top: 2rem;
  letter-spacing: 0.02em;
}

/* ============================================================
   FORM ELEMENTS (shared)
   ============================================================ */
.field-group { margin-bottom: 1.25rem; }

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 7px;
}

/* On dark bg (login) */
.login-page .field-label { color: rgba(255,255,255,0.45); }

.field-input {
  display: block;
  width: 100%;
  font-family: var(--font-ui);
  font-size: 15px;
  color: var(--text-primary);
  background: var(--white);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  appearance: none;
}

.field-input:focus {
  border-color: var(--gold);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.15);
}

.login-page .field-input {
  background: rgba(255,255,255,0.06);
  border-color: rgba(201,168,76,0.2);
  color: var(--white);
}
.login-page .field-input::placeholder { color: rgba(255,255,255,0.25); }
.login-page .field-input:focus {
  border-color: var(--gold);
  background: rgba(255,255,255,0.09);
}

.field-textarea { resize: vertical; min-height: 100px; line-height: 1.5; }
.field-textarea--tall { min-height: 140px; }

.field-error {
  font-size: 13px;
  color: #c0392b;
  margin-top: 6px;
  display: none;
}
.field-error.visible { display: block; }
.login-page .field-error { color: #e88080; }

/* ============================================================
   BUTTONS
   ============================================================ */
button { cursor: pointer; font-family: var(--font-ui); }

.btn-primary-full {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%;
  padding: 12px 20px;
  background: var(--gold);
  color: var(--navy);
  font-size: 14px; font-weight: 500; letter-spacing: 0.04em;
  border: none;
  border-radius: var(--radius-md);
  transition: background 0.15s, transform 0.1s;
}
.btn-primary-full:hover { background: var(--gold-light); }
.btn-primary-full:active { transform: scale(0.99); }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px;
  background: var(--navy);
  color: var(--white);
  font-size: 14px; font-weight: 400;
  border: none;
  border-radius: var(--radius-md);
  transition: background 0.15s;
}
.btn-primary:hover { background: var(--navy-mid); }

.btn-primary-lg {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 28px;
  background: var(--gold);
  color: var(--navy);
  font-size: 15px; font-weight: 500;
  border: none;
  border-radius: var(--radius-md);
  transition: background 0.15s;
}
.btn-primary-lg:hover { background: var(--gold-light); }

.btn-secondary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  transition: background 0.15s, border-color 0.15s;
}
.btn-secondary:hover { background: var(--warm-gray); }

.btn-secondary-lg {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 24px;
  background: transparent;
  color: var(--text-primary);
  font-size: 15px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  transition: background 0.15s;
}
.btn-secondary-lg:hover { background: var(--warm-gray); }

.btn-ghost {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  background: transparent;
  color: rgba(255,255,255,0.65);
  font-size: 13px;
  border: none;
  border-radius: var(--radius-sm);
  transition: color 0.15s, background 0.15s;
}
.btn-ghost:hover { color: var(--white); background: rgba(255,255,255,0.08); }

.btn-ghost-lg {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 14px 20px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  border: none;
  border-radius: var(--radius-md);
  transition: color 0.15s, background 0.15s;
}
.btn-ghost-lg:hover { color: var(--text-primary); background: var(--warm-gray); }

.btn-text {
  background: none; border: none; padding: 0;
  font-size: 13px; color: var(--gold);
  text-decoration: underline; text-underline-offset: 2px;
}
.btn-text:hover { color: var(--gold-light); }

.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  transition: background 0.1s, color 0.1s;
}
.btn-icon:hover { background: var(--warm-gray); color: var(--text-primary); }
.btn-icon--danger:hover { background: #fdf0f0; color: #c0392b; border-color: rgba(192,57,43,0.3); }

/* ============================================================
   APP NAV
   ============================================================ */
.app-nav {
  position: sticky; top: 0; z-index: 100;
  background: var(--navy);
  border-bottom: 1px solid rgba(201,168,76,0.15);
}

.nav-inner {
  max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; gap: 16px;
  padding: 0 1.5rem;
  height: 56px;
}

.nav-center {
  flex: 1; text-align: center;
  font-size: 14px; color: rgba(255,255,255,0.5);
  letter-spacing: 0.02em;
}

.nav-actions { display: flex; align-items: center; gap: 4px; }

/* ============================================================
   SCREENS
   ============================================================ */
.screen { display: none; }
.screen.active { display: block; }

.app-main { min-height: calc(100vh - 56px); }

/* ============================================================
   SETUP SCREEN
   ============================================================ */
.screen-inner {
  max-width: 1040px; margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.screen-header { margin-bottom: 2rem; }

.screen-title {
  font-family: var(--font-display);
  font-size: 32px; font-weight: 500;
  color: var(--navy);
  margin-bottom: 6px;
}

.screen-sub {
  font-size: 15px; color: var(--text-secondary);
  line-height: 1.5;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 720px) {
  .two-col { grid-template-columns: 1fr; }
}

.setup-col { display: flex; flex-direction: column; gap: 1.5rem; }

.form-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.form-card--stretch { height: 100%; }

.form-card-title {
  font-family: var(--font-display);
  font-size: 20px; font-weight: 500;
  margin-bottom: 4px;
}

.form-card-title-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 4px;
}

.form-card-sub {
  font-size: 13px; color: var(--text-secondary);
  margin-bottom: 1.25rem; line-height: 1.5;
}

.unit-count {
  font-size: 13px; color: var(--text-muted);
  text-align: right; margin-top: -8px;
}

.cat-list { list-style: none; margin-bottom: 1rem; }

.cat-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.cat-item:last-child { border-bottom: none; }

.cat-item input[type=text] {
  flex: 1; font-size: 14px; padding: 6px 10px;
  border: 1px solid transparent; border-radius: var(--radius-sm);
  background: transparent; color: var(--text-primary);
  font-family: var(--font-ui);
}
.cat-item input[type=text]:focus {
  border-color: var(--gold);
  background: var(--white);
  outline: none;
  box-shadow: 0 0 0 2px rgba(201,168,76,0.12);
}

.drag-handle {
  color: var(--mid-gray); cursor: grab; font-size: 16px;
  padding: 2px; user-select: none;
}
.drag-handle:active { cursor: grabbing; }

.cat-add-row {
  display: flex; gap: 8px;
}
.cat-add-row .field-input { flex: 1; }

.setup-footer {
  margin-top: 2rem;
  display: flex; flex-direction: column; align-items: flex-end; gap: 10px;
}

.setup-error {
  font-size: 14px; color: #c0392b;
  display: none;
}
.setup-error.visible { display: block; }

.setup-start {
  min-width: 240px;
}

/* ============================================================
   INSPECT SCREEN
   ============================================================ */
.inspect-layout {
  display: flex;
  height: calc(100vh - 56px);
  overflow: hidden;
}

.inspect-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--navy);
  overflow-y: auto;
  display: flex; flex-direction: column;
}

.sidebar-prop {
  padding: 1.25rem 1rem 0.75rem;
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.sidebar-units { flex: 1; padding: 0.5rem 0; }

.sidebar-unit {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 1rem;
  font-size: 14px; color: rgba(255,255,255,0.55);
  cursor: pointer;
  border-radius: 0;
  transition: background 0.1s, color 0.1s;
  border: none; background: none; width: 100%;
  text-align: left; font-family: var(--font-ui);
}
.sidebar-unit:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.85); }
.sidebar-unit.active { background: rgba(201,168,76,0.12); color: var(--gold); }
.sidebar-unit.completed { color: rgba(255,255,255,0.4); }

.sidebar-unit-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  flex-shrink: 0;
}
.sidebar-unit.active .sidebar-unit-dot { background: var(--gold); }
.sidebar-unit.completed .sidebar-unit-dot { background: rgba(120,200,120,0.6); }

.inspect-main {
  flex: 1; display: flex; flex-direction: column;
  overflow-y: auto;
  background: var(--warm-white);
}

.inspect-topbar {
  padding: 1rem 2rem;
  background: var(--white);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 10;
}

.progress-wrap {
  display: flex; align-items: center; gap: 14px;
}

.progress-track {
  flex: 1; height: 4px;
  background: var(--warm-gray);
  border-radius: 99px; overflow: hidden;
}

.progress-fill {
  height: 100%; background: var(--gold);
  border-radius: 99px;
  transition: width 0.4s ease;
}

.progress-label {
  font-size: 13px; color: var(--text-secondary);
  white-space: nowrap; min-width: 48px; text-align: right;
}

.inspect-body {
  flex: 1; padding: 2rem;
  max-width: 860px;
}

.inspect-unit-badge {
  display: inline-block;
  background: var(--navy); color: var(--gold);
  font-size: 11px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 12px;
  border-radius: 99px;
  margin-bottom: 10px;
}

.inspect-cat-title {
  font-family: var(--font-display);
  font-size: 30px; font-weight: 500;
  color: var(--navy);
  margin-bottom: 1.75rem;
}

.inspect-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 680px) {
  .inspect-layout { flex-direction: column; height: auto; }
  .inspect-sidebar { width: 100%; height: auto; flex-direction: row; overflow-x: auto; }
  .sidebar-units { display: flex; flex-direction: row; padding: 0; }
  .sidebar-unit { padding: 8px 12px; white-space: nowrap; }
  .inspect-body { padding: 1.25rem; }
  .inspect-grid { grid-template-columns: 1fr; gap: 0; }
}

/* Condition pills */
.condition-pills { display: flex; gap: 8px; flex-wrap: wrap; }

.cpill {
  padding: 7px 18px;
  border-radius: 99px;
  font-size: 13px; font-weight: 400;
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.12s;
  font-family: var(--font-ui);
}
.cpill:hover { border-color: var(--navy); color: var(--navy); }

.cpill.active { border-width: 1.5px; }
.cpill--good.active { background: #edf7ed; color: #2e7d32; border-color: #66bb6a; }
.cpill--fair.active { background: #fff8e1; color: #e65100; border-color: #ffb300; }
.cpill--poor.active { background: #fdf0f0; color: #c62828; border-color: #e57373; }
.cpill--na.active   { background: var(--warm-gray); color: var(--text-secondary); border-color: var(--mid-gray); }

/* Photo zone */
.photo-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  padding: 1.5rem;
  border: 1.5px dashed var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--warm-gray);
  color: var(--text-muted);
  font-size: 13px; cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.photo-zone:hover { border-color: var(--gold); background: var(--gold-pale); color: var(--navy); }

.photo-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin-top: 10px;
}

.photo-thumb-wrap {
  position: relative;
  width: 76px; height: 76px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border);
}
.photo-thumb-wrap img {
  width: 100%; height: 100%; object-fit: cover;
  cursor: pointer; display: block;
}
.photo-remove {
  position: absolute; top: 3px; right: 3px;
  width: 20px; height: 20px;
  background: rgba(0,0,0,0.6); color: white;
  border: none; border-radius: 50%;
  font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.15s;
}
.photo-thumb-wrap:hover .photo-remove { opacity: 1; }

/* Voice note */
.voice-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 16px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--white);
  color: var(--text-primary);
  font-size: 14px; font-family: var(--font-ui);
  transition: all 0.15s;
}
.voice-btn:hover { border-color: var(--navy); }
.voice-btn.recording {
  border-color: #e57373;
  background: #fdf0f0;
  color: #c62828;
}

.voice-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: var(--mid-gray);
  flex-shrink: 0;
}
.recording .voice-dot {
  background: #e53935;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.85); }
}

.voice-status { font-size: 12px; color: var(--text-muted); margin-top: 6px; }

/* Footer nav */
.inspect-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--white);
  border-top: 1px solid var(--border);
  position: sticky; bottom: 0;
}

.cat-dots {
  display: flex; gap: 6px; align-items: center;
}
.cat-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--warm-gray);
  transition: background 0.15s, transform 0.15s;
}
.cat-dot.done { background: var(--mid-gray); }
.cat-dot.current { background: var(--gold); transform: scale(1.4); }

/* ============================================================
   SUMMARY SCREEN
   ============================================================ */
.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.stat-num {
  font-family: var(--font-display);
  font-size: 42px; font-weight: 500;
  color: var(--navy);
  line-height: 1;
}
.stat-num--gold { color: var(--gold); }
.stat-num--red  { color: #c62828; }

.stat-lbl {
  font-size: 12px; letter-spacing: 0.07em; text-transform: uppercase;
  color: var(--text-muted); margin-top: 6px;
}

.summary-actions {
  display: flex; flex-wrap: wrap; gap: 12px;
  margin-bottom: 2.5rem;
}

.unit-review-table {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.urt-header {
  display: grid;
  grid-template-columns: 100px 1fr 80px 120px 80px;
  padding: 10px 1.25rem;
  background: var(--warm-gray);
  font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.urt-row {
  display: grid;
  grid-template-columns: 100px 1fr 80px 120px 80px;
  padding: 12px 1.25rem;
  border-bottom: 1px solid var(--border);
  align-items: center;
  font-size: 14px;
}
.urt-row:last-child { border-bottom: none; }
.urt-row:hover { background: var(--warm-white); }

.urt-unit { font-weight: 500; }
.urt-poor { color: #c62828; font-size: 13px; }
.urt-done { color: var(--text-secondary); font-size: 13px; }

@media (max-width: 640px) {
  .urt-header, .urt-row { grid-template-columns: 80px 1fr 60px; }
  .urt-header span:nth-child(3),
  .urt-header span:nth-child(4),
  .urt-row > *:nth-child(3),
  .urt-row > *:nth-child(4) { display: none; }
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
.lightbox {
  display: none;
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.88);
  align-items: center; justify-content: center;
  cursor: pointer;
}
.lightbox.open { display: flex; }
.lightbox img {
  max-width: 90vw; max-height: 88vh;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}
.lightbox-close {
  position: absolute; top: 20px; right: 24px;
  background: none; border: none;
  color: rgba(255,255,255,0.6); font-size: 32px;
  cursor: pointer; line-height: 1;
}
.lightbox-close:hover { color: white; }

/* ============================================================
   TOAST
   ============================================================ */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--navy); color: var(--white);
  font-size: 14px; padding: 10px 20px;
  border-radius: 99px;
  border: 1px solid rgba(201,168,76,0.3);
  opacity: 0; pointer-events: none;
  transition: opacity 0.2s;
  z-index: 200;
  white-space: nowrap;
}
.toast.show { opacity: 1; }

/* ============================================================
   SCROLLBAR
   ============================================================ */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--warm-gray); border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: var(--mid-gray); }
