/* ============================================================
   Greysteel Unit Walkthrough — app.js v2
   Free-form grid inspection + professional Excel export
   ============================================================ */

const DRAFT_KEY = 'gs_walkthrough_draft_v2';

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
  data: {},
  activeUnit: 0,
  recording: false,
  mediaRecorder: null,
  audioChunks: [],
  modalUnit: null,
  modalCat: null
};

/* ============================================================ INIT */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  renderSetupCatList();
  document.getElementById('units-input').addEventListener('input', updateUnitCount);
  document.getElementById('new-cat-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } });

  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    try {
      const parsed = JSON.parse(draft);
      if (parsed && parsed.units && parsed.units.length > 0) {
        if (confirm(`Restore draft walkthrough for "${parsed.property}"?`)) {
          state = { ...parsed, recording: false, mediaRecorder: null, audioChunks: [], modalUnit: null, modalCat: null };
          document.getElementById('btn-export-nav').style.display = 'flex';
          document.getElementById('nav-prop-name').textContent = state.property;
          renderUnitTabs();
          renderInspectGrid();
          showScreen('screen-inspect');
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch (e) { localStorage.removeItem(DRAFT_KEY); }
  }
});

/* ============================================================ SETUP */
function updateUnitCount() {
  const u = getUnitsFromInput();
  document.getElementById('unit-count').textContent = `${u.length} unit${u.length !== 1 ? 's' : ''}`;
}

function getUnitsFromInput() {
  return document.getElementById('units-input').value.split('\n').map(u => u.trim()).filter(Boolean);
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
      <span class="drag-handle">&#8942;&#8942;</span>
      <input type="text" value="${escHtml(cat)}" onchange="state.categories[${i}]=this.value.trim()">
      <button class="btn-icon btn-icon--danger" onclick="removeCategory(${i})" title="Remove">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;
    attachDragEvents(li);
    ul.appendChild(li);
  });
}

let dragSrc = null;
function attachDragEvents(li) {
  li.addEventListener('dragstart', e => { dragSrc = li; e.dataTransfer.effectAllowed = 'move'; li.style.opacity = '0.45'; });
  li.addEventListener('dragend', () => { li.style.opacity = '1'; });
  li.addEventListener('dragover', e => { e.preventDefault(); });
  li.addEventListener('drop', e => {
    e.preventDefault();
    if (dragSrc === li) return;
    const si = parseInt(dragSrc.dataset.idx), di = parseInt(li.dataset.idx);
    const moved = state.categories.splice(si, 1)[0];
    state.categories.splice(di, 0, moved);
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
  if (confirm('Reset to default categories?')) { state.categories = [...DEFAULT_CATEGORIES]; renderSetupCatList(); }
}

function populateSetupFromState() {
  document.getElementById('prop-name').value = state.property;
  document.getElementById('inspector-name').value = state.inspector;
  document.getElementById('insp-date').value = state.date;
  document.getElementById('units-input').value = state.units.join('\n');
  updateUnitCount();
  renderSetupCatList();
}

function startWalkthrough() {
  const prop = document.getElementById('prop-name').value.trim();
  const inspector = document.getElementById('inspector-name').value.trim();
  const date = document.getElementById('insp-date').value;
  const units = getUnitsFromInput();
  const err = document.getElementById('setup-error');

  if (!prop) { showSetupError('Please enter a property name.'); return; }
  if (!units.length) { showSetupError('Please enter at least one unit number.'); return; }
  if (!state.categories.length) { showSetupError('Please add at least one category.'); return; }
  err.classList.remove('visible');

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
  state.activeUnit = 0;

  document.getElementById('nav-prop-name').textContent = state.property;
  document.getElementById('btn-export-nav').style.display = 'flex';

  renderUnitTabs();
  renderInspectGrid();
  showScreen('screen-inspect');
}

function showSetupError(msg) {
  const err = document.getElementById('setup-error');
  err.textContent = msg;
  err.classList.add('visible');
}

/* ============================================================ UNIT TABS */
function renderUnitTabs() {
  const bar = document.getElementById('unit-tab-bar');
  bar.innerHTML = '';
  state.units.forEach((u, i) => {
    const allFilled = state.categories.every(c => state.data[u][c].condition);
    const btn = document.createElement('button');
    btn.className = 'unit-tab' + (i === state.activeUnit ? ' active' : '') + (allFilled ? ' tab-complete' : '');
    btn.innerHTML = `Unit ${escHtml(u)} <span class="tab-dot"></span>`;
    btn.onclick = () => { state.activeUnit = i; renderUnitTabs(); renderInspectGrid(); };
    bar.appendChild(btn);
  });

  // Progress
  let logged = 0, total = state.units.length * state.categories.length;
  state.units.forEach(u => state.categories.forEach(c => { if (state.data[u][c].condition || state.data[u][c].note) logged++; }));
  document.getElementById('toolbar-prop').textContent = state.property;
  document.getElementById('toolbar-progress').textContent = `${logged} of ${total} items logged`;
}

/* ============================================================ INSPECTION GRID */
function renderInspectGrid() {
  const unit = state.units[state.activeUnit];
  const wrap = document.getElementById('inspect-grid-wrap');

  const table = document.createElement('table');
  table.className = 'inspect-table';

  // Header
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    <th>Category</th>
    <th>Condition</th>
    <th>Notes &amp; Photos</th>
  </tr>`;
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  state.categories.forEach(cat => {
    const entry = state.data[unit][cat];
    const tr = document.createElement('tr');

    // Category name
    const tdCat = document.createElement('td');
    tdCat.className = 'cat-name-cell';
    tdCat.textContent = cat;

    // Condition dropdown
    const tdCond = document.createElement('td');
    const sel = document.createElement('select');
    sel.className = 'cond-select';
    sel.innerHTML = `
      <option value="">— Select —</option>
      <option value="good">Good</option>
      <option value="fair">Fair</option>
      <option value="poor">Poor</option>
      <option value="na">N/A</option>`;
    sel.value = entry.condition || '';
    applyCondSelectStyle(sel);
    sel.addEventListener('change', () => {
      state.data[unit][cat].condition = sel.value;
      applyCondSelectStyle(sel);
      renderUnitTabs();
      saveDraft(true);
    });
    tdCond.appendChild(sel);

    // Note + photo button
    const tdAction = document.createElement('td');
    tdAction.className = 'action-cell';
    const hasContent = entry.note || entry.photos.length > 0 || entry.voiceNote;
    const noteBtn = document.createElement('button');
    noteBtn.className = 'note-btn' + (hasContent ? ' has-content' : '');
    const photoCount = entry.photos.length;
    noteBtn.innerHTML = hasContent
      ? `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
         Edit note${photoCount ? ` <span class="photo-count-badge">${photoCount}</span>` : ''}`
      : `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Add note`;
    noteBtn.onclick = () => openNoteModal(unit, cat);
    tdAction.appendChild(noteBtn);

    tr.appendChild(tdCat);
    tr.appendChild(tdCond);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.innerHTML = '';
  wrap.appendChild(table);
}

function applyCondSelectStyle(sel) {
  sel.className = 'cond-select';
  if (sel.value === 'good') sel.classList.add('val-good');
  else if (sel.value === 'fair') sel.classList.add('val-fair');
  else if (sel.value === 'poor') sel.classList.add('val-poor');
  else if (sel.value === 'na')   sel.classList.add('val-na');
}

/* ============================================================ NOTE MODAL */
function openNoteModal(unit, cat) {
  state.modalUnit = unit;
  state.modalCat = cat;
  const entry = state.data[unit][cat];

  document.getElementById('modal-unit-badge').textContent = 'Unit ' + unit;
  document.getElementById('modal-title').textContent = cat;
  document.getElementById('modal-note').value = entry.note || '';

  const vs = document.getElementById('voice-status');
  vs.textContent = entry.voiceNote ? '✓ Voice note saved' : '';

  renderModalPhotos(entry.photos);

  const modal = document.getElementById('note-modal');
  modal.classList.add('open');
  setTimeout(() => document.getElementById('modal-note').focus(), 100);
}

function handleModalOverlayClick(e) {
  if (e.target === document.getElementById('note-modal')) closeNoteModal();
}

function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('open');
  if (state.recording) {
    state.mediaRecorder && state.mediaRecorder.stop();
    state.recording = false;
    document.getElementById('voice-btn').classList.remove('recording');
    document.getElementById('voice-label').textContent = 'Record voice note';
  }
}

function saveNoteModal() {
  const unit = state.modalUnit;
  const cat  = state.modalCat;
  if (!unit || !cat) return;
  state.data[unit][cat].note = document.getElementById('modal-note').value.trim();
  closeNoteModal();
  renderInspectGrid();
  renderUnitTabs();
  saveDraft(true);
}

function handleModalPhotos(e) {
  const unit = state.modalUnit;
  const cat  = state.modalCat;
  if (!unit || !cat) return;
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      state.data[unit][cat].photos.push(ev.target.result);
      renderModalPhotos(state.data[unit][cat].photos);
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderModalPhotos(photos) {
  const grid = document.getElementById('modal-photo-grid');
  grid.innerHTML = '';
  photos.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'photo-thumb-wrap';
    const img = document.createElement('img');
    img.src = src; img.alt = `Photo ${i + 1}`;
    img.onclick = () => openLightbox(src);
    const del = document.createElement('button');
    del.className = 'photo-remove'; del.textContent = '×';
    del.onclick = ev => {
      ev.stopPropagation();
      state.data[state.modalUnit][state.modalCat].photos.splice(i, 1);
      renderModalPhotos(state.data[state.modalUnit][state.modalCat].photos);
    };
    wrap.appendChild(img); wrap.appendChild(del);
    grid.appendChild(wrap);
  });
}

/* ============================================================ VOICE */
async function toggleVoice() {
  const btn = document.getElementById('voice-btn');
  const label = document.getElementById('voice-label');
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
          state.data[state.modalUnit][state.modalCat].voiceNote = ev.target.result;
          status.textContent = '✓ Voice note saved';
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      state.mediaRecorder.start();
      state.recording = true;
      btn.classList.add('recording');
      label.textContent = 'Stop recording';
    } catch (e) { status.textContent = 'Microphone access denied.'; }
  } else {
    state.mediaRecorder.stop();
    state.recording = false;
    btn.classList.remove('recording');
    label.textContent = 'Record voice note';
  }
}

/* ============================================================ LIGHTBOX */
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }

/* ============================================================ DRAFT */
function saveDraft(silent = false) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      property: state.property, inspector: state.inspector, date: state.date,
      units: state.units, categories: state.categories,
      data: state.data, activeUnit: state.activeUnit
    }));
    if (!silent) showToast('Draft saved');
  } catch (e) { showToast('Could not save — storage full?'); }
}

/* ============================================================ FINISH / SUMMARY */
function finishWalkthrough() {
  saveDraft(true);
  renderSummary();
  showScreen('screen-summary');
}

function renderSummary() {
  document.getElementById('summary-title').textContent = state.property;
  document.getElementById('summary-sub').textContent =
    `Inspected by ${state.inspector || 'Unknown'} · ${formatDate(state.date)}`;

  let photos = 0, poor = 0, filled = 0;
  state.units.forEach(u => state.categories.forEach(c => {
    const e = state.data[u][c];
    photos += e.photos.length;
    if (e.condition === 'poor') poor++;
    if (e.condition || e.note) filled++;
  }));

  document.getElementById('summary-stats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${state.units.length}</div><div class="stat-lbl">Units inspected</div></div>
    <div class="stat-card"><div class="stat-num">${state.categories.length}</div><div class="stat-lbl">Categories</div></div>
    <div class="stat-card"><div class="stat-num stat-num--gold">${photos}</div><div class="stat-lbl">Photos taken</div></div>
    <div class="stat-card"><div class="stat-num stat-num--red">${poor}</div><div class="stat-lbl">Poor condition items</div></div>`;

  const tbody = document.getElementById('unit-review-rows');
  tbody.innerHTML = '';
  state.units.forEach((u, i) => {
    const unitPhotos = state.categories.reduce((s, c) => s + state.data[u][c].photos.length, 0);
    const unitPoor   = state.categories.filter(c => state.data[u][c].condition === 'poor').length;
    const unitFilled = state.categories.filter(c => state.data[u][c].condition || state.data[u][c].note).length;
    const row = document.createElement('div');
    row.className = 'urt-row';
    row.innerHTML = `
      <span class="urt-unit">Unit ${escHtml(u)}</span>
      <span class="urt-done">${unitFilled} / ${state.categories.length}</span>
      <span class="urt-done">${unitPhotos}</span>
      <span class="urt-poor">${unitPoor > 0 ? unitPoor + ' item' + (unitPoor > 1 ? 's' : '') : '—'}</span>
      <button class="btn-ghost-lg" style="font-size:13px;padding:6px 12px;" onclick="jumpToUnit(${i})">Edit</button>`;
    tbody.appendChild(row);
  });
}

function jumpToUnit(i) {
  state.activeUnit = i;
  renderUnitTabs();
  renderInspectGrid();
  showScreen('screen-inspect');
}

function newWalkthrough() {
  if (!confirm('Start a new walkthrough? Current data will be cleared.')) return;
  state = { property:'',inspector:'',date:'',units:[],categories:[...DEFAULT_CATEGORIES],data:{},activeUnit:0,recording:false,mediaRecorder:null,audioChunks:[],modalUnit:null,modalCat:null };
  localStorage.removeItem(DRAFT_KEY);
  document.getElementById('prop-name').value = '';
  document.getElementById('inspector-name').value = '';
  document.getElementById('units-input').value = '';
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('btn-export-nav').style.display = 'none';
  document.getElementById('nav-prop-name').textContent = '';
  updateUnitCount();
  renderSetupCatList();
  showScreen('screen-setup');
}

/* ============================================================ EXCEL EXPORT */
function exportExcel() {
  if (!state.units.length) { showToast('No data to export yet.'); return; }

  const wb = XLSX.utils.book_new();
  const cats = state.categories;

  /* ------ SHEET 1: WALKTHROUGH DATA ------ */
  const wsData = XLSX.utils.aoa_to_sheet([]);
  const R = (r, c) => XLSX.utils.encode_cell({ r, c });
  let row = 0;

  // Title block
  wsData[R(row, 0)] = { v: 'UNIT WALKTHROUGH REPORT', t: 's' };
  wsData[R(row + 1, 0)] = { v: state.property, t: 's' };
  wsData[R(row + 2, 0)] = { v: `Inspector: ${state.inspector || '—'}`, t: 's' };
  wsData[R(row + 3, 0)] = { v: `Date: ${formatDate(state.date)}`, t: 's' };
  wsData[R(row + 4, 0)] = { v: `Exported: ${new Date().toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}`, t: 's' };
  row += 6;

  // Column headers
  const headers = ['Unit', ...cats.flatMap(c => [c + ' — Condition', c + ' — Notes', c + ' — Photos'])];
  headers.forEach((h, c) => { wsData[R(row, c)] = { v: h, t: 's' }; });
  const headerRow = row;
  row++;

  // Data rows
  state.units.forEach(u => {
    wsData[R(row, 0)] = { v: u, t: 's' };
    cats.forEach((c, ci) => {
      const e = state.data[u][c];
      wsData[R(row, 1 + ci * 3)] = { v: e.condition ? capitalize(e.condition) : '', t: 's' };
      wsData[R(row, 2 + ci * 3)] = { v: e.note || '', t: 's' };
      wsData[R(row, 3 + ci * 3)] = { v: e.photos.length ? e.photos.length + ' photo(s)' : '', t: 's' };
    });
    row++;
  });

  const lastDataRow = row - 1;
  const lastCol = headers.length - 1;

  wsData['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastDataRow, c: lastCol } });

  // Column widths
  wsData['!cols'] = [{ wch: 10 }, ...cats.flatMap(() => [{ wch: 14 }, { wch: 36 }, { wch: 12 }])];

  // Row heights
  const rowHeights = [];
  for (let i = 0; i <= lastDataRow; i++) {
    if (i === 0) rowHeights.push({ hpt: 24 });
    else if (i === headerRow) rowHeights.push({ hpt: 40 });
    else rowHeights.push({ hpt: 18 });
  }
  wsData['!rows'] = rowHeights;

  // Merges for title area
  wsData['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.min(lastCol, 5) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.min(lastCol, 5) } },
  ];

  XLSX.utils.book_append_sheet(wb, wsData, 'Walkthrough');

  /* ------ SHEET 2: SUMMARY ------ */
  const sumRows = [
    ['WALKTHROUGH SUMMARY', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['Property', state.property],
    ['Inspector', state.inspector || '—'],
    ['Date', formatDate(state.date)],
    ['Units inspected', state.units.length],
    ['Total categories', cats.length],
    ['', '', '', '', '', ''],
    ['Unit', 'Items logged', 'Good', 'Fair', 'Poor', 'N/A', 'Photos'],
  ];

  state.units.forEach(u => {
    const good   = cats.filter(c => state.data[u][c].condition === 'good').length;
    const fair   = cats.filter(c => state.data[u][c].condition === 'fair').length;
    const poor   = cats.filter(c => state.data[u][c].condition === 'poor').length;
    const na     = cats.filter(c => state.data[u][c].condition === 'na').length;
    const filled = cats.filter(c => state.data[u][c].condition || state.data[u][c].note).length;
    const photos = cats.reduce((s, c) => s + state.data[u][c].photos.length, 0);
    sumRows.push([u, filled, good, fair, poor, na, photos]);
  });

  // Totals row
  const dataStart = 10;
  const dataEnd = dataStart + state.units.length - 1;
  if (state.units.length > 0) {
    sumRows.push([
      'TOTAL',
      `=SUM(B${dataStart}:B${dataEnd})`,
      `=SUM(C${dataStart}:C${dataEnd})`,
      `=SUM(D${dataStart}:D${dataEnd})`,
      `=SUM(E${dataStart}:E${dataEnd})`,
      `=SUM(F${dataStart}:F${dataEnd})`,
      `=SUM(G${dataStart}:G${dataEnd})`
    ]);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(sumRows);
  wsSummary['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  wsSummary['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  /* ------ SHEET 3: PHOTO INDEX (if any photos) ------ */
  let totalPhotos = 0;
  state.units.forEach(u => cats.forEach(c => { totalPhotos += state.data[u][c].photos.length; }));

  if (totalPhotos > 0) {
    const photoRows = [
      ['PHOTO INDEX', '', '', ''],
      ['', '', '', ''],
      ['Unit', 'Category', 'Photo #', 'File Reference']
    ];
    state.units.forEach(u => {
      cats.forEach(c => {
        state.data[u][c].photos.forEach((_, idx) => {
          photoRows.push([u, c, idx + 1, `Unit_${u}_${c.replace(/[^a-z0-9]/gi,'_').replace(/_+/g,'_')}_photo${idx + 1}.jpg`]);
        });
      });
    });
    const wsPhotos = XLSX.utils.aoa_to_sheet(photoRows);
    wsPhotos['!cols'] = [{ wch: 10 }, { wch: 42 }, { wch: 10 }, { wch: 48 }];
    wsPhotos['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
    XLSX.utils.book_append_sheet(wb, wsPhotos, 'Photo Index');
  }

  const date = state.date || new Date().toISOString().split('T')[0];
  const fname = sanitizeFilename(state.property) + '_walkthrough_' + date + '.xlsx';
  XLSX.writeFile(wb, fname);
  showToast('Exported: ' + fname);
}

/* ============================================================ SCREEN */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

/* ============================================================ UTILS */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function sanitizeFilename(s) { return (s||'walkthrough').replace(/[^a-z0-9]/gi,'_').toLowerCase(); }
function formatDate(d) {
  if (!d) return '';
  try { const [y,m,dd] = d.split('-'); return new Date(y,m-1,dd).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}); }
  catch { return d; }
}
