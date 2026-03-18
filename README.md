/* ============================================================
   Greysteel Unit Walkthrough — app.js
   ============================================================ */

const DRAFT_KEY = 'gs_walkthrough_draft';

const DEFAULT_CATEGORIES = [
  'Kitchen (appliances, cabinets, countertops)',
  'Bathroom (tile, fixtures, vanity)',
  'Flooring',
  'Windows & Doors',
  'Walls & Ceilings',
  'HVAC / Mechanicals',
  'Closets & Storage',
  'General Unit Condition'
];

let state = {
  property: '',
  inspector: '',
  date: '',
  units: [],
  categories: [...DEFAULT_CATEGORIES],
  data: {},       // data[unit][cat] = { condition, note, photos: [dataURL], voiceNote }
  curUnit: 0,
  curCat: 0,
  recording: false,
  mediaRecorder: null,
  audioChunks: []
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Set default date
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('insp-date').value = today;

  renderSetupCatList();

  // Live unit count
  document.getElementById('units-input').addEventListener('input', updateUnitCount);

  // Add category on Enter
  document.getElementById('new-cat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addCategory(); }
  });

  // Load draft if exists
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    try {
      const parsed = JSON.parse(draft);
      if (parsed && parsed.units && parsed.units.length > 0) {
        const restore = confirm(`Restore draft walkthrough for "${parsed.property}"?`);
        if (restore) {
          state = parsed;
          state.recording = false;
          state.mediaRecorder = null;
          state.audioChunks = [];
          if (state.curUnit !== undefined && state.units.length > 0) {
            loadEntry();
            showScreen('screen-inspect');
            updateNavProp();
          }
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (e) { localStorage.removeItem(DRAFT_KEY); }
  }
});

/* ============================================================
   SETUP
   ============================================================ */
function updateUnitCount() {
  const units = getUnitsFromInput();
  document.getElementById('unit-count').textContent = `${units.length} unit${units.length !== 1 ? 's' : ''}`;
}

function getUnitsFromInput() {
  return document.getElementById('units-input').value
    .split('\n')
    .map(u => u.trim())
    .filter(Boolean);
}

function renderSetupCatList() {
  const ul = document.getElementById('setup-cat-list');
  ul.innerHTML = '';
  state.categories.forEach((cat, i) => {
    const li = document.createElement('li');
    li.className = 'cat-item';
    li.draggable = true;
    li.dataset.idx = i;
    li.innerHTML = `
      <span class="drag-handle" title="Drag to reorder">&#8942;&#8942;</span>
      <input type="text" value="${escHtml(cat)}" onchange="state.categories[${i}]=this.value">
      <button class="btn-icon btn-icon--danger" onclick="removeCategory(${i})" title="Remove">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    attachDragEvents(li);
    ul.appendChild(li);
  });
}

// Drag-to-reorder
let dragSrc = null;

function attachDragEvents(li) {
  li.addEventListener('dragstart', e => {
    dragSrc = li;
    e.dataTransfer.effectAllowed = 'move';
    li.style.opacity = '0.5';
  });
  li.addEventListener('dragend', () => { li.style.opacity = '1'; });
  li.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
  li.addEventListener('drop', e => {
    e.preventDefault();
    if (dragSrc === li) return;
    const srcIdx = parseInt(dragSrc.dataset.idx);
    const dstIdx = parseInt(li.dataset.idx);
    const moved = state.categories.splice(srcIdx, 1)[0];
    state.categories.splice(dstIdx, 0, moved);
    renderSetupCatList();
  });
}

function addCategory() {
  const inp = document.getElementById('new-cat-input');
  const val = inp.value.trim();
  if (!val) return;
  state.categories.push(val);
  inp.value = '';
  renderSetupCatList();
}

function removeCategory(i) {
  state.categories.splice(i, 1);
  renderSetupCatList();
}

function resetCategories() {
  if (confirm('Reset to default categories?')) {
    state.categories = [...DEFAULT_CATEGORIES];
    renderSetupCatList();
  }
}

function startWalkthrough() {
  const prop = document.getElementById('prop-name').value.trim();
  const inspector = document.getElementById('inspector-name').value.trim();
  const date = document.getElementById('insp-date').value;
  const units = getUnitsFromInput();
  const err = document.getElementById('setup-error');

  if (!prop) { showSetupError('Please enter a property name.'); return; }
  if (units.length === 0) { showSetupError('Please enter at least one unit number.'); return; }
  if (state.categories.length === 0) { showSetupError('Please add at least one inspection category.'); return; }

  err.classList.remove('visible');

  // Preserve existing data if adding more units
  const newData = {};
  units.forEach(u => {
    newData[u] = state.data[u] || {};
    state.categories.forEach(c => {
      if (!newData[u][c]) newData[u][c] = { condition: '', note: '', photos: [], voiceNote: null };
    });
  });

  state.property = prop;
  state.inspector = inspector;
  state.date = date;
  state.units = units;
  state.data = newData;
  state.curUnit = 0;
  state.curCat = 0;

  updateNavProp();
  renderSidebar();
  loadEntry();
  showScreen('screen-inspect');
}

function showSetupError(msg) {
  const err = document.getElementById('setup-error');
  err.textContent = msg;
  err.classList.add('visible');
}

function addMoreUnits() {
  document.getElementById('prop-name').value = state.property;
  document.getElementById('inspector-name').value = state.inspector;
  document.getElementById('insp-date').value = state.date;
  document.getElementById('units-input').value = state.units.join('\n');
  updateUnitCount();
  renderSetupCatList();
  showScreen('screen-setup');
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function renderSidebar() {
  const sp = document.getElementById('sidebar-prop');
  sp.textContent = state.property;

  const su = document.getElementById('sidebar-units');
  su.innerHTML = '';
  state.units.forEach((u, i) => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-unit';
    btn.dataset.idx = i;

    const allDone = state.categories.every(c => state.data[u][c].condition || state.data[u][c].note);
    if (allDone) btn.classList.add('completed');
    if (i === state.curUnit) btn.classList.add('active');

    btn.innerHTML = `<span>Unit ${escHtml(u)}</span><span class="sidebar-unit-dot"></span>`;
    btn.onclick = () => { saveEntry(); state.curUnit = i; state.curCat = 0; loadEntry(); renderSidebar(); };
    su.appendChild(btn);
  });
}

/* ============================================================
   ENTRY LOADING / SAVING
   ============================================================ */
function loadEntry() {
  const unit = state.units[state.curUnit];
  const cat  = state.categories[state.curCat];
  const entry = state.data[unit][cat];
  const total = state.units.length * state.categories.length;
  const done  = state.curUnit * state.categories.length + state.curCat;
  const pct   = Math.round((done / total) * 100);

  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-label').textContent = pct + '%';
  document.getElementById('inspect-unit-badge').textContent = 'Unit ' + unit;
  document.getElementById('inspect-cat-title').textContent = cat;
  document.getElementById('note-input').value = entry.note || '';

  // Condition pills
  document.querySelectorAll('.cpill').forEach(p => p.classList.remove('active'));
  if (entry.condition) {
    const active = document.querySelector(`.cpill--${entry.condition}`);
    if (active) active.classList.add('active');
  }

  // Photos
  renderPhotoGrid(entry.photos, unit, cat);

  // Voice
  const vs = document.getElementById('voice-status');
  vs.textContent = entry.voiceNote ? '✓ Voice note saved' : '';

  // Nav buttons
  const isFirst = state.curUnit === 0 && state.curCat === 0;
  const isLast  = state.curUnit === state.units.length - 1 && state.curCat === state.categories.length - 1;
  const prev = document.getElementById('btn-prev');
  prev.style.opacity = isFirst ? '0.35' : '1';
  prev.style.pointerEvents = isFirst ? 'none' : '';

  const nextLabel = document.getElementById('btn-next-label');
  if (isLast) nextLabel.textContent = 'Finish';
  else if (state.curCat === state.categories.length - 1) nextLabel.textContent = 'Next unit';
  else nextLabel.textContent = 'Next';

  // Cat dots
  const dots = document.getElementById('cat-dots');
  dots.innerHTML = '';
  state.categories.forEach((_, ci) => {
    const d = document.createElement('div');
    d.className = 'cat-dot';
    if (ci < state.curCat) d.classList.add('done');
    if (ci === state.curCat) d.classList.add('current');
    dots.appendChild(d);
  });
}

function saveEntry() {
  if (!state.units.length) return;
  const unit  = state.units[state.curUnit];
  const cat   = state.categories[state.curCat];
  const entry = state.data[unit][cat];
  entry.note = document.getElementById('note-input').value;
  const active = document.querySelector('.cpill.active');
  entry.condition = active ? active.className.split('cpill--')[1]?.split(' ')[0] || '' : '';
}

function nextEntry() {
  saveEntry();
  const isLast = state.curUnit === state.units.length - 1 && state.curCat === state.categories.length - 1;
  if (isLast) { finishWalkthrough(); return; }
  if (state.curCat < state.categories.length - 1) {
    state.curCat++;
  } else {
    state.curUnit++;
    state.curCat = 0;
  }
  loadEntry();
  renderSidebar();
  saveDraft(true);
}

function prevEntry() {
  saveEntry();
  if (state.curCat > 0) {
    state.curCat--;
  } else if (state.curUnit > 0) {
    state.curUnit--;
    state.curCat = state.categories.length - 1;
  }
  loadEntry();
  renderSidebar();
}

/* ============================================================
   CONDITION PILLS
   ============================================================ */
function setPill(el, cond) {
  document.querySelectorAll('.cpill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
}

/* ============================================================
   PHOTOS
   ============================================================ */
function handlePhotos(e) {
  const unit  = state.units[state.curUnit];
  const cat   = state.categories[state.curCat];
  const entry = state.data[unit][cat];

  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      entry.photos.push(ev.target.result);
      renderPhotoGrid(entry.photos, unit, cat);
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderPhotoGrid(photos, unit, cat) {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = '';
  photos.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-thumb-wrap';
    const img = document.createElement('img');
    img.src = src;
    img.alt = `Photo ${i + 1}`;
    img.onclick = () => openLightbox(src);
    const del = document.createElement('button');
    del.className = 'photo-remove';
    del.textContent = '×';
    del.title = 'Remove photo';
    del.onclick = (e) => {
      e.stopPropagation();
      state.data[unit][cat].photos.splice(i, 1);
      renderPhotoGrid(state.data[unit][cat].photos, unit, cat);
    };
    wrap.appendChild(img);
    wrap.appendChild(del);
    grid.appendChild(wrap);
  });
}

function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
}

/* ============================================================
   VOICE NOTES
   ============================================================ */
async function toggleVoice() {
  const btn    = document.getElementById('voice-btn');
  const dot    = document.getElementById('voice-dot');
  const label  = document.getElementById('voice-label');
  const status = document.getElementById('voice-status');

  if (!state.recording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream);
      state.audioChunks = [];
      state.mediaRecorder.ondataavailable = e => state.audioChunks.push(e.data);
      state.mediaRecorder.onstop = () => {
        const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = ev => {
          const unit  = state.units[state.curUnit];
          const cat   = state.categories[state.curCat];
          state.data[unit][cat].voiceNote = ev.target.result;
          status.textContent = '✓ Voice note saved';
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      state.mediaRecorder.start();
      state.recording = true;
      btn.classList.add('recording');
      label.textContent = 'Stop recording';
    } catch (err) {
      status.textContent = 'Microphone access denied.';
    }
  } else {
    state.mediaRecorder.stop();
    state.recording = false;
    btn.classList.remove('recording');
    label.textContent = 'Record voice note';
  }
}

/* ============================================================
   DRAFT SAVE / RESTORE
   ============================================================ */
function saveDraft(silent = false) {
  saveEntry();
  const snapshot = JSON.stringify(state);
  try {
    localStorage.setItem(DRAFT_KEY, snapshot);
    if (!silent) showToast('Draft saved');
  } catch (e) {
    showToast('Could not save draft (storage full?)');
  }
}

/* ============================================================
   FINISH / SUMMARY
   ============================================================ */
function finishWalkthrough() {
  saveEntry();
  localStorage.removeItem(DRAFT_KEY);
  renderSummary();
  showScreen('screen-summary');
}

function renderSummary() {
  const t = document.getElementById('summary-title');
  const s = document.getElementById('summary-sub');
  t.textContent = state.property;
  s.textContent = `Inspected by ${state.inspector || 'Unknown'} · ${formatDate(state.date)}`;

  let photos = 0, poor = 0, filled = 0;
  const total = state.units.length * state.categories.length;
  state.units.forEach(u => state.categories.forEach(c => {
    const e = state.data[u][c];
    photos += e.photos.length;
    if (e.condition === 'poor') poor++;
    if (e.condition || e.note) filled++;
  }));

  document.getElementById('summary-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-num">${state.units.length}</div>
      <div class="stat-lbl">Units inspected</div>
    </div>
    <div class="stat-card">
      <div class="stat-num">${state.categories.length}</div>
      <div class="stat-lbl">Categories</div>
    </div>
    <div class="stat-card">
      <div class="stat-num stat-num--gold">${photos}</div>
      <div class="stat-lbl">Photos taken</div>
    </div>
    <div class="stat-card">
      <div class="stat-num stat-num--red">${poor}</div>
      <div class="stat-lbl">Poor condition items</div>
    </div>`;

  // Unit review rows
  const tbody = document.getElementById('unit-review-rows');
  tbody.innerHTML = '';
  state.units.forEach((u, i) => {
    const row = document.createElement('div');
    row.className = 'urt-row';
    const unitPhotos  = state.categories.reduce((sum, c) => sum + state.data[u][c].photos.length, 0);
    const unitPoor    = state.categories.filter(c => state.data[u][c].condition === 'poor').length;
    const unitFilled  = state.categories.filter(c => state.data[u][c].condition || state.data[u][c].note).length;
    row.innerHTML = `
      <span class="urt-unit">Unit ${escHtml(u)}</span>
      <span class="urt-done">${unitFilled} / ${state.categories.length} logged</span>
      <span class="urt-done">${unitPhotos}</span>
      <span class="urt-poor">${unitPoor > 0 ? unitPoor + ' item' + (unitPoor > 1 ? 's' : '') : '—'}</span>
      <button class="btn-ghost-lg" style="font-size:13px;padding:6px 12px;" onclick="jumpToUnit(${i})">Edit</button>`;
    tbody.appendChild(row);
  });
}

function jumpToUnit(i) {
  state.curUnit = i;
  state.curCat = 0;
  renderSidebar();
  loadEntry();
  showScreen('screen-inspect');
}

function newWalkthrough() {
  if (!confirm('Start a new walkthrough? Current data will be cleared.')) return;
  state = {
    property: '', inspector: '', date: '', units: [],
    categories: [...DEFAULT_CATEGORIES],
    data: {}, curUnit: 0, curCat: 0,
    recording: false, mediaRecorder: null, audioChunks: []
  };
  localStorage.removeItem(DRAFT_KEY);
  document.getElementById('prop-name').value = '';
  document.getElementById('inspector-name').value = '';
  document.getElementById('units-input').value = '';
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  updateUnitCount();
  renderSetupCatList();
  showScreen('screen-setup');
}

/* ============================================================
   EXPORT TO EXCEL
   ============================================================ */
function exportExcel() {
  const wb = XLSX.utils.book_new();

  // ---- Sheet 1: Walkthrough Data ----
  const cats = state.categories;
  const headers = ['Unit', ...cats.flatMap(c => [
    c + ' — Condition',
    c + ' — Notes',
    c + ' — # Photos'
  ])];

  const rows = [headers];
  state.units.forEach(u => {
    const row = [u];
    cats.forEach(c => {
      const e = state.data[u][c];
      row.push(
        e.condition ? capitalize(e.condition) : '',
        e.note || '',
        e.photos.length || ''
      );
    });
    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = headers.map((h, i) => ({
    wch: i === 0 ? 10 : h.includes('Notes') ? 32 : h.includes('Condition') ? 14 : 10
  }));

  // Header row style
  ws['!rows'] = [{ hpt: 22 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Walkthrough');

  // ---- Sheet 2: Photo Index ----
  const photoHeaders = ['Unit', 'Category', 'Photo #', 'File reference'];
  const photoRows = [photoHeaders];
  state.units.forEach(u => {
    cats.forEach(c => {
      state.data[u][c].photos.forEach((_, idx) => {
        photoRows.push([u, c, idx + 1, `Unit_${u}_${c.replace(/[^a-z0-9]/gi, '_')}_photo${idx + 1}`]);
      });
    });
  });
  if (photoRows.length > 1) {
    const ws2 = XLSX.utils.aoa_to_sheet(photoRows);
    ws2['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 10 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Photo Index');
  }

  // ---- Sheet 3: Summary ----
  const sumRows = [
    ['Property', state.property],
    ['Inspector', state.inspector],
    ['Date', formatDate(state.date)],
    ['Units inspected', state.units.length],
    ['Total categories', cats.length],
    [],
    ['Unit', 'Items logged', 'Photos', 'Good', 'Fair', 'Poor', 'N/A']
  ];
  state.units.forEach(u => {
    const good = cats.filter(c => state.data[u][c].condition === 'good').length;
    const fair = cats.filter(c => state.data[u][c].condition === 'fair').length;
    const poor = cats.filter(c => state.data[u][c].condition === 'poor').length;
    const na   = cats.filter(c => state.data[u][c].condition === 'na').length;
    const logged = cats.filter(c => state.data[u][c].condition || state.data[u][c].note).length;
    const photos = cats.reduce((s, c) => s + state.data[u][c].photos.length, 0);
    sumRows.push([u, logged, photos, good, fair, poor, na]);
  });
  const ws3 = XLSX.utils.aoa_to_sheet(sumRows);
  ws3['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

  const date = state.date || new Date().toISOString().split('T')[0];
  const fname = sanitizeFilename(state.property) + '_walkthrough_' + date + '.xlsx';
  XLSX.writeFile(wb, fname);
  showToast('Exported: ' + fname);
}

/* ============================================================
   NAV / SCREEN HELPERS
   ============================================================ */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function updateNavProp() {
  document.getElementById('nav-prop-name').textContent = state.property;
}

/* ============================================================
   UTILITY
   ============================================================ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function sanitizeFilename(str) {
  return (str || 'walkthrough').replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}
