/* ============================================================
   Greysteel Unit Walkthrough — app.js v3
   ============================================================ */

const DRAFT_KEY = 'gs_wt_v3';

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

let S = {
  property: '', inspector: '', date: '',
  units: [], categories: [...DEFAULT_CATEGORIES],
  data: {},
  activeUnit: 0,
  recording: false, mediaRecorder: null, audioChunks: [],
  modalUnit: null, modalCat: null,
  photoModalUnit: null, photoModalCat: null
};

/* ============================================================ INIT */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  renderSetupCatList();
  document.getElementById('units-input').addEventListener('input', updateUnitCount);
  document.getElementById('new-cat-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } });

  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && p.units && p.units.length) {
        if (confirm(`Restore draft for "${p.property}"?`)) {
          S = { ...p, recording: false, mediaRecorder: null, audioChunks: [], modalUnit: null, modalCat: null, photoModalUnit: null, photoModalCat: null };
          afterStart();
          showScreen('screen-inspect');
        } else { localStorage.removeItem(DRAFT_KEY); }
      }
    }
  } catch (e) { localStorage.removeItem(DRAFT_KEY); }
});

/* ============================================================ SETUP */
function updateUnitCount() {
  const u = getUnits(); document.getElementById('unit-count').textContent = `${u.length} unit${u.length !== 1 ? 's' : ''}`;
}
function getUnits() {
  return document.getElementById('units-input').value.split('\n').map(s => s.trim()).filter(Boolean);
}

function renderSetupCatList() {
  const ul = document.getElementById('setup-cat-list'); ul.innerHTML = '';
  S.categories.forEach((cat, i) => {
    const li = document.createElement('li'); li.className = 'cat-item'; li.draggable = true; li.dataset.idx = i;
    li.innerHTML = `<span class="drag-handle">&#8942;&#8942;</span><input type="text" value="${esc(cat)}" onchange="S.categories[${i}]=this.value.trim()"><button class="btn-icon btn-icon--danger" onclick="removeCategory(${i})"><svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    attachDrag(li); ul.appendChild(li);
  });
}

let _dragSrc = null;
function attachDrag(li) {
  li.addEventListener('dragstart', e => { _dragSrc = li; e.dataTransfer.effectAllowed = 'move'; li.style.opacity = '0.4'; });
  li.addEventListener('dragend', () => { li.style.opacity = '1'; });
  li.addEventListener('dragover', e => e.preventDefault());
  li.addEventListener('drop', e => {
    e.preventDefault(); if (_dragSrc === li) return;
    const si = +_dragSrc.dataset.idx, di = +li.dataset.idx;
    S.categories.splice(di, 0, S.categories.splice(si, 1)[0]);
    renderSetupCatList();
  });
}

function addCategory() {
  const inp = document.getElementById('new-cat-input'), v = inp.value.trim();
  if (!v) return; S.categories.push(v); inp.value = ''; renderSetupCatList();
}
function removeCategory(i) { S.categories.splice(i, 1); renderSetupCatList(); }
function resetCategories() { if (confirm('Reset to defaults?')) { S.categories = [...DEFAULT_CATEGORIES]; renderSetupCatList(); } }

function populateSetupFromState() {
  document.getElementById('prop-name').value = S.property;
  document.getElementById('inspector-name').value = S.inspector;
  document.getElementById('insp-date').value = S.date;
  document.getElementById('units-input').value = S.units.join('\n');
  updateUnitCount(); renderSetupCatList();
}

function startWalkthrough() {
  const prop = document.getElementById('prop-name').value.trim();
  const inspector = document.getElementById('inspector-name').value.trim();
  const date = document.getElementById('insp-date').value;
  const units = getUnits();
  const err = document.getElementById('setup-error');
  if (!prop) { showErr('Please enter a property name.'); return; }
  if (!units.length) { showErr('Please enter at least one unit.'); return; }
  if (!S.categories.length) { showErr('Please add at least one category.'); return; }
  err.classList.remove('visible');

  const newData = {};
  units.forEach(u => {
    newData[u] = S.data[u] || {};
    S.categories.forEach(c => { if (!newData[u][c]) newData[u][c] = { condition: '', note: '', photos: [], voiceNote: null }; });
  });
  S.property = prop; S.inspector = inspector; S.date = date; S.units = units; S.data = newData; S.activeUnit = 0;
  afterStart();
  showScreen('screen-inspect');
}

function showErr(msg) { const e = document.getElementById('setup-error'); e.textContent = msg; e.classList.add('visible'); }

function afterStart() {
  document.getElementById('nav-prop-name').textContent = S.property;
  document.getElementById('btn-export-nav').style.display = 'flex';
  renderUnitTabs(); renderInspectBody();
}

/* ============================================================ TABS */
function renderUnitTabs() {
  const bar = document.getElementById('unit-tab-bar'); bar.innerHTML = '';
  S.units.forEach((u, i) => {
    const allDone = S.categories.every(c => S.data[u][c].condition);
    const btn = document.createElement('button');
    btn.className = 'unit-tab' + (i === S.activeUnit ? ' active' : '') + (allDone ? ' tab-done' : '');
    btn.innerHTML = `Unit ${esc(u)} <span class="tab-dot"></span>`;
    btn.onclick = () => { S.activeUnit = i; renderUnitTabs(); renderInspectBody(); };
    bar.appendChild(btn);
  });
  // progress
  let logged = 0, total = S.units.length * S.categories.length;
  S.units.forEach(u => S.categories.forEach(c => { if (S.data[u][c].condition || S.data[u][c].note) logged++; }));
  document.getElementById('toolbar-prop').textContent = S.property;
  document.getElementById('toolbar-progress').textContent = `${logged}/${total}`;
}

/* ============================================================ INSPECT BODY */
function renderInspectBody() {
  const unit = S.units[S.activeUnit];
  const body = document.getElementById('inspect-body');
  if (!body) return;
  body.innerHTML = '';
  S.categories.forEach(cat => {
    const entry = S.data[unit][cat];
    const card = document.createElement('div');
    card.className = 'cat-card' + condClass(entry.condition);
    card.dataset.unit = unit; card.dataset.cat = cat;

    // TOP: name + pills
    const top = document.createElement('div'); top.className = 'cat-card-top';
    const name = document.createElement('div'); name.className = 'cat-card-name'; name.textContent = cat;

    const pills = document.createElement('div'); pills.className = 'cond-pills';
    ['Good','Fair','Poor','N/A'].forEach(label => {
      const btn = document.createElement('button');
      const val = label.toLowerCase().replace('/', '');
      btn.className = 'cpill' + (entry.condition === val ? ` active-${val}` : '');
      btn.textContent = label;
      btn.onclick = () => {
        const cur = S.data[unit][cat].condition;
        S.data[unit][cat].condition = cur === val ? '' : val;
        renderInspectBody(); renderUnitTabs(); saveDraft(true);
      };
      pills.appendChild(btn);
    });

    top.appendChild(name); top.appendChild(pills);

    // BOTTOM: photo btn + note btn + note preview
    const bottom = document.createElement('div'); bottom.className = 'cat-card-bottom';

    const photoCount = entry.photos.length;
    const photoBtn = document.createElement('button');
    photoBtn.className = 'action-btn' + (photoCount ? ' active' : '');
    photoBtn.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Photos${photoCount ? ` <span class="photo-badge">${photoCount}</span>` : ''}`;
    photoBtn.onclick = () => openPhotoModal(unit, cat);

    const noteBtn = document.createElement('button');
    const hasNote = !!entry.note;
    noteBtn.className = 'action-btn' + (hasNote ? ' active' : '');
    noteBtn.innerHTML = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Note`;
    noteBtn.onclick = () => openNoteModal(unit, cat);

    bottom.appendChild(photoBtn);
    bottom.appendChild(noteBtn);

    if (hasNote) {
      const preview = document.createElement('div');
      preview.className = 'note-preview';
      preview.textContent = entry.note;
      bottom.appendChild(preview);
    }

    card.appendChild(top); card.appendChild(bottom);
    body.appendChild(card);
  });
}

function condClass(c) {
  if (!c) return '';
  if (c === 'good') return ' has-condition cond-good';
  if (c === 'fair') return ' has-condition cond-fair';
  if (c === 'poor') return ' has-condition cond-poor';
  if (c === 'na')   return ' has-condition cond-na';
  return '';
}

/* ============================================================ NOTE MODAL */
function openNoteModal(unit, cat) {
  S.modalUnit = unit; S.modalCat = cat;
  const entry = S.data[unit][cat];
  document.getElementById('modal-badge').textContent = 'Unit ' + unit;
  document.getElementById('modal-title').textContent = cat;
  document.getElementById('modal-note').value = entry.note || '';
  document.getElementById('voice-status').textContent = entry.voiceNote ? '✓ Voice note saved' : '';
  document.getElementById('note-modal').classList.add('open');
  setTimeout(() => document.getElementById('modal-note').focus(), 150);
}
function handleModalOverlay(e) { if (e.target === document.getElementById('note-modal')) closeNoteModal(); }
function closeNoteModal() {
  document.getElementById('note-modal').classList.remove('open');
  if (S.recording && S.mediaRecorder) { S.mediaRecorder.stop(); S.recording = false; document.getElementById('voice-btn').classList.remove('recording'); document.getElementById('voice-label').textContent = 'Record voice note'; }
}
function saveNoteModal() {
  if (!S.modalUnit || !S.modalCat) return;
  S.data[S.modalUnit][S.modalCat].note = document.getElementById('modal-note').value.trim();
  closeNoteModal(); renderInspectBody(); renderUnitTabs(); saveDraft(true);
}

/* ============================================================ PHOTO MODAL */
function openPhotoModal(unit, cat) {
  S.photoModalUnit = unit; S.photoModalCat = cat;
  document.getElementById('photo-modal-badge').textContent = 'Unit ' + unit;
  document.getElementById('photo-modal-title').textContent = cat;
  renderPhotoGrid(S.data[unit][cat].photos);
  document.getElementById('photo-modal').classList.add('open');
}
function handlePhotoModalOverlay(e) { if (e.target === document.getElementById('photo-modal')) closePhotoModal(); }
function closePhotoModal() { document.getElementById('photo-modal').classList.remove('open'); renderInspectBody(); renderUnitTabs(); saveDraft(true); }

function handlePhotoInput(e) {
  const unit = S.photoModalUnit, cat = S.photoModalCat; if (!unit || !cat) return;
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => { S.data[unit][cat].photos.push(ev.target.result); renderPhotoGrid(S.data[unit][cat].photos); };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderPhotoGrid(photos) {
  const grid = document.getElementById('photo-modal-grid'); grid.innerHTML = '';
  photos.forEach((src, i) => {
    const wrap = document.createElement('div'); wrap.className = 'photo-thumb-wrap';
    const img = document.createElement('img'); img.src = src; img.alt = ''; img.onclick = () => openLightbox(src);
    const del = document.createElement('button'); del.className = 'photo-remove'; del.textContent = '×';
    del.onclick = ev => { ev.stopPropagation(); S.data[S.photoModalUnit][S.photoModalCat].photos.splice(i, 1); renderPhotoGrid(S.data[S.photoModalUnit][S.photoModalCat].photos); };
    wrap.appendChild(img); wrap.appendChild(del); grid.appendChild(wrap);
  });
}

/* ============================================================ VOICE */
async function toggleVoice() {
  const btn = document.getElementById('voice-btn'), lbl = document.getElementById('voice-label'), status = document.getElementById('voice-status');
  if (!S.recording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      S.mediaRecorder = new MediaRecorder(stream); S.audioChunks = [];
      S.mediaRecorder.ondataavailable = e => S.audioChunks.push(e.data);
      S.mediaRecorder.onstop = () => {
        const blob = new Blob(S.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = ev => { S.data[S.modalUnit][S.modalCat].voiceNote = ev.target.result; status.textContent = '✓ Voice note saved'; };
        reader.readAsDataURL(blob); stream.getTracks().forEach(t => t.stop());
      };
      S.mediaRecorder.start(); S.recording = true; btn.classList.add('recording'); lbl.textContent = 'Stop recording';
    } catch (e) { status.textContent = 'Microphone access denied.'; }
  } else {
    S.mediaRecorder.stop(); S.recording = false; btn.classList.remove('recording'); lbl.textContent = 'Record voice note';
  }
}

/* ============================================================ LIGHTBOX */
function openLightbox(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').classList.add('open'); }
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }

/* ============================================================ DRAFT */
function saveDraft(silent = false) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ property: S.property, inspector: S.inspector, date: S.date, units: S.units, categories: S.categories, data: S.data, activeUnit: S.activeUnit }));
    if (!silent) showToast('Draft saved');
  } catch (e) { showToast('Could not save — storage full?'); }
}

/* ============================================================ FINISH */
function finishWalkthrough() { saveDraft(true); renderSummary(); showScreen('screen-summary'); }

function renderSummary() {
  document.getElementById('summary-title').textContent = S.property;
  document.getElementById('summary-sub').textContent = `Inspected by ${S.inspector || '—'} · ${fmtDate(S.date)}`;
  let photos = 0, poor = 0;
  S.units.forEach(u => S.categories.forEach(c => { photos += S.data[u][c].photos.length; if (S.data[u][c].condition === 'poor') poor++; }));
  document.getElementById('summary-stats').innerHTML = `
    <div class="stat-card"><div class="stat-num">${S.units.length}</div><div class="stat-lbl">Units</div></div>
    <div class="stat-card"><div class="stat-num">${S.categories.length}</div><div class="stat-lbl">Categories</div></div>
    <div class="stat-card"><div class="stat-num stat-num--gold">${photos}</div><div class="stat-lbl">Photos</div></div>
    <div class="stat-card"><div class="stat-num stat-num--red">${poor}</div><div class="stat-lbl">Poor items</div></div>`;
  const tbody = document.getElementById('unit-review-rows'); tbody.innerHTML = '';
  S.units.forEach((u, i) => {
    const up = S.categories.filter(c => S.data[u][c].condition === 'poor').length;
    const uf = S.categories.filter(c => S.data[u][c].condition || S.data[u][c].note).length;
    const uph = S.categories.reduce((s, c) => s + S.data[u][c].photos.length, 0);
    const row = document.createElement('div'); row.className = 'urt-row';
    row.innerHTML = `<span class="urt-unit">Unit ${esc(u)}</span><span class="urt-done">${uf}/${S.categories.length}</span><span class="urt-done">${uph}</span><span class="urt-poor">${up > 0 ? up : '—'}</span><button class="btn-ghost-lg" style="font-size:13px;padding:6px 10px;" onclick="jumpUnit(${i})">Edit</button>`;
    tbody.appendChild(row);
  });
}

function jumpUnit(i) { S.activeUnit = i; renderUnitTabs(); renderInspectBody(); showScreen('screen-inspect'); }

function newWalkthrough() {
  if (!confirm('Start fresh? Current data will be cleared.')) return;
  S = { property:'',inspector:'',date:'',units:[],categories:[...DEFAULT_CATEGORIES],data:{},activeUnit:0,recording:false,mediaRecorder:null,audioChunks:[],modalUnit:null,modalCat:null,photoModalUnit:null,photoModalCat:null };
  localStorage.removeItem(DRAFT_KEY);
  ['prop-name','inspector-name','units-input'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('btn-export-nav').style.display = 'none';
  document.getElementById('nav-prop-name').textContent = '';
  updateUnitCount(); renderSetupCatList(); showScreen('screen-setup');
}

/* ============================================================ EXCEL EXPORT */
function exportExcel() {
  if (!S.units.length) { showToast('No data to export.'); return; }

  const wb = XLSX.utils.book_new();
  const cats = S.categories;

  /* ---- HELPERS ---- */
  const NAVY  = 'FF1A2332';
  const GOLD  = 'FFC9A84C';
  const WHITE = 'FFFFFFFF';
  const LIGHT = 'FFF7F5F0';
  const GREEN_BG = 'FFEDF7ED'; const GREEN_FG = 'FF2E7D32';
  const AMBER_BG = 'FFFFF8E1'; const AMBER_FG = 'FFE65100';
  const RED_BG   = 'FFFFF5F5'; const RED_FG   = 'FFC62828';
  const GRAY_BG  = 'FFEDE9E1'; const GRAY_FG  = 'FF6B6560';

  function cell(v, opts = {}) {
    const c = { v, t: typeof v === 'number' ? 'n' : 's' };
    const s = {};
    if (opts.bold || opts.header) { s.font = { ...(s.font || {}), bold: true }; }
    if (opts.color) { s.font = { ...(s.font || {}), color: { rgb: opts.color } }; }
    if (opts.sz)    { s.font = { ...(s.font || {}), sz: opts.sz }; }
    if (opts.name)  { s.font = { ...(s.font || {}), name: opts.name }; }
    if (opts.bg)    { s.fill = { fgColor: { rgb: opts.bg }, patternType: 'solid' }; }
    if (opts.align) { s.alignment = { horizontal: opts.align, vertical: 'center', wrapText: true }; }
    if (opts.wrap)  { s.alignment = { ...(s.alignment || {}), wrapText: true, vertical: 'top' }; }
    if (opts.border) {
      s.border = { top:{style:'thin',color:{rgb:'FFD3D1C7'}}, bottom:{style:'thin',color:{rgb:'FFD3D1C7'}}, left:{style:'thin',color:{rgb:'FFD3D1C7'}}, right:{style:'thin',color:{rgb:'FFD3D1C7'}} };
    }
    if (Object.keys(s).length) c.s = s;
    return c;
  }

  function condStyle(cond) {
    if (cond === 'good') return { bg: GREEN_BG, color: GREEN_FG };
    if (cond === 'fair') return { bg: AMBER_BG, color: AMBER_FG };
    if (cond === 'poor') return { bg: RED_BG,   color: RED_FG };
    if (cond === 'na')   return { bg: GRAY_BG,  color: GRAY_FG };
    return {};
  }

  /* ---- SHEET 1: WALKTHROUGH ---- */
  const ws = {};
  const ENC = XLSX.utils.encode_cell;
  let r = 0;

  // Title block
  ws[ENC({r,c:0})] = cell('UNIT WALKTHROUGH REPORT', { bold:true, sz:16, color:WHITE, bg:NAVY, name:'Arial' });
  r++;
  ws[ENC({r,c:0})] = cell(S.property, { sz:12, color:WHITE, bg:NAVY, name:'Arial' });
  r++;
  ws[ENC({r,c:0})] = cell(`Inspector: ${S.inspector || '—'}   ·   Date: ${fmtDate(S.date)}   ·   Exported: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`, { sz:10, color:GOLD, bg:NAVY, name:'Arial' });
  r += 2;

  // Column header row
  const hdrRow = r;
  ws[ENC({r,c:0})] = cell('Unit', { bold:true, bg:NAVY, color:WHITE, align:'center', border:true, name:'Arial' });
  let col = 1;
  cats.forEach(cat => {
    const shortCat = cat.length > 28 ? cat.substring(0, 26) + '…' : cat;
    ws[ENC({r,c:col})]   = cell(shortCat + '\nCondition', { bold:true, bg:NAVY, color:GOLD, align:'center', wrap:true, border:true, name:'Arial' });
    ws[ENC({r,c:col+1})] = cell(shortCat + '\nNotes',     { bold:true, bg:NAVY, color:WHITE, align:'center', wrap:true, border:true, name:'Arial' });
    ws[ENC({r,c:col+2})] = cell(shortCat + '\nPhotos',    { bold:true, bg:NAVY, color:WHITE, align:'center', wrap:true, border:true, name:'Arial' });
    col += 3;
  });
  r++;

  // Data rows
  S.units.forEach((u, ui) => {
    const rowBg = ui % 2 === 0 ? WHITE : 'FFFAF9F7';
    ws[ENC({r,c:0})] = cell(u, { bold:true, align:'center', bg:rowBg, border:true, name:'Arial' });
    let dc = 1;
    cats.forEach(cat => {
      const e = S.data[u][cat];
      const cs = condStyle(e.condition);
      const condLabel = e.condition ? cap(e.condition) : '';
      ws[ENC({r,c:dc})]   = cell(condLabel,       { align:'center', bg: cs.bg || rowBg, color: cs.color, border:true, name:'Arial' });
      ws[ENC({r,c:dc+1})] = cell(e.note || '',    { wrap:true, bg:rowBg, border:true, name:'Arial' });
      ws[ENC({r,c:dc+2})] = cell(e.photos.length ? `${e.photos.length} photo(s)` : '', { align:'center', bg:rowBg, border:true, name:'Arial' });
      dc += 3;
    });
    r++;
  });

  const lastR = r - 1;
  const lastC = 1 + cats.length * 3 - 1;
  ws['!ref'] = XLSX.utils.encode_range({ s:{r:0,c:0}, e:{r:lastR,c:lastC} });

  // Merges: title rows span all columns
  const spanEnd = Math.min(lastC, 8);
  ws['!merges'] = [
    {s:{r:0,c:0},e:{r:0,c:spanEnd}},
    {s:{r:1,c:0},e:{r:1,c:spanEnd}},
    {s:{r:2,c:0},e:{r:2,c:spanEnd}},
  ];

  // Column widths
  ws['!cols'] = [{ wch:10 }, ...cats.flatMap(() => [{ wch:14 },{ wch:36 },{ wch:14 }])];

  // Row heights
  ws['!rows'] = [];
  for (let i = 0; i <= lastR; i++) {
    if (i === 0) ws['!rows'].push({ hpt: 30 });
    else if (i === 1) ws['!rows'].push({ hpt: 22 });
    else if (i === 2) ws['!rows'].push({ hpt: 16 });
    else if (i === 3) ws['!rows'].push({ hpt: 8 }); // spacer
    else if (i === hdrRow) ws['!rows'].push({ hpt: 52 });
    else ws['!rows'].push({ hpt: 22 });
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Walkthrough');

  /* ---- SHEET 2: SUMMARY ---- */
  const ws2 = {};
  let r2 = 0;

  ws2[ENC({r:r2,c:0})] = cell('SUMMARY', { bold:true, sz:14, color:WHITE, bg:NAVY, name:'Arial' });
  ws2[ENC({r:r2,c:1})] = cell('', { bg:NAVY });
  ws2[ENC({r:r2,c:2})] = cell('', { bg:NAVY });
  ws2[ENC({r:r2,c:3})] = cell('', { bg:NAVY });
  ws2[ENC({r:r2,c:4})] = cell('', { bg:NAVY });
  ws2[ENC({r:r2,c:5})] = cell('', { bg:NAVY });
  r2 += 2;

  [['Property', S.property],['Inspector', S.inspector||'—'],['Date', fmtDate(S.date)],['Units inspected', S.units.length],['Categories', S.categories.length]].forEach(([k,v]) => {
    ws2[ENC({r:r2,c:0})] = cell(k, { bold:true, bg:LIGHT, border:true, name:'Arial' });
    ws2[ENC({r:r2,c:1})] = cell(v, { border:true, name:'Arial' });
    r2++;
  });
  r2++;

  // Table header
  ['Unit','Items Logged','Good','Fair','Poor','N/A','Photos'].forEach((h,ci) => {
    ws2[ENC({r:r2,c:ci})] = cell(h, { bold:true, bg:NAVY, color:ci===4?'FFE57373':WHITE, align:'center', border:true, name:'Arial' });
  });
  r2++;
  const sumStart = r2 + 1;

  S.units.forEach(u => {
    const good  = cats.filter(c => S.data[u][c].condition==='good').length;
    const fair  = cats.filter(c => S.data[u][c].condition==='fair').length;
    const poor  = cats.filter(c => S.data[u][c].condition==='poor').length;
    const na    = cats.filter(c => S.data[u][c].condition==='na').length;
    const filled= cats.filter(c => S.data[u][c].condition||S.data[u][c].note).length;
    const ph    = cats.reduce((s,c)=>s+S.data[u][c].photos.length,0);
    [u,filled,good,fair,poor,na,ph].forEach((v,ci) => {
      const opts = { border:true, name:'Arial', align: ci>0?'center':'left' };
      if (ci===4&&poor>0) { opts.bg=RED_BG; opts.color=RED_FG; }
      ws2[ENC({r:r2,c:ci})] = cell(v, opts);
    });
    r2++;
  });

  // Totals
  const sumEnd = r2;
  if (S.units.length > 0) {
    ws2[ENC({r:r2,c:0})] = cell('TOTAL', { bold:true, bg:LIGHT, border:true, name:'Arial' });
    for (let ci = 1; ci <= 6; ci++) {
      const colLetter = String.fromCharCode(65 + ci);
      ws2[ENC({r:r2,c:ci})] = { t:'n', f:`SUM(${colLetter}${sumStart}:${colLetter}${sumEnd})`, s:{ font:{bold:true,name:'Arial'}, fill:{fgColor:{rgb:LIGHT},patternType:'solid'}, border:{top:{style:'thin',color:{rgb:'FFD3D1C7'}},bottom:{style:'thin',color:{rgb:'FFD3D1C7'}},left:{style:'thin',color:{rgb:'FFD3D1C7'}},right:{style:'thin',color:{rgb:'FFD3D1C7'}}}, alignment:{horizontal:'center'} } };
    }
    r2++;
  }

  ws2['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:r2,c:6}});
  ws2['!cols'] = [{wch:14},{wch:14},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10}];
  ws2['!rows'] = [{hpt:28},{hpt:6}];
  ws2['!merges'] = [{s:{r:0,c:0},e:{r:0,c:5}}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

  /* ---- SHEET 3: PHOTO INDEX ---- */
  let totalPh = 0;
  S.units.forEach(u => cats.forEach(c => { totalPh += S.data[u][c].photos.length; }));

  if (totalPh > 0) {
    const ws3 = {};
    let r3 = 0;
    ws3[ENC({r:r3,c:0})] = cell('PHOTO INDEX', { bold:true, sz:13, color:WHITE, bg:NAVY, name:'Arial' });
    ws3[ENC({r:r3,c:1})] = cell('', { bg:NAVY });
    ws3[ENC({r:r3,c:2})] = cell('', { bg:NAVY });
    ws3[ENC({r:r3,c:3})] = cell('', { bg:NAVY });
    r3 += 2;
    ['Unit','Category','Photo #','Reference'].forEach((h,ci) => {
      ws3[ENC({r:r3,c:ci})] = cell(h, { bold:true, bg:NAVY, color:WHITE, border:true, name:'Arial' });
    });
    r3++;
    S.units.forEach(u => {
      cats.forEach(c => {
        S.data[u][c].photos.forEach((_,idx) => {
          [u, c, idx+1, `Unit_${u}_${c.replace(/[^a-z0-9]/gi,'_').replace(/_+/g,'_')}_photo${idx+1}.jpg`].forEach((v,ci) => {
            ws3[ENC({r:r3,c:ci})] = cell(v, { border:true, name:'Arial', align:ci===2?'center':undefined });
          });
          r3++;
        });
      });
    });
    ws3['!ref'] = XLSX.utils.encode_range({s:{r:0,c:0},e:{r:r3-1,c:3}});
    ws3['!cols'] = [{wch:10},{wch:44},{wch:10},{wch:52}];
    ws3['!merges'] = [{s:{r:0,c:0},e:{r:0,c:3}}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Photo Index');
  }

  const fname = sanit(S.property) + '_walkthrough_' + (S.date||new Date().toISOString().split('T')[0]) + '.xlsx';
  XLSX.writeFile(wb, fname);
  showToast('Exported: ' + fname);
}

/* ============================================================ UTILS */
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function sanit(s) { return (s||'walkthrough').replace(/[^a-z0-9]/gi,'_').toLowerCase(); }
function fmtDate(d) { if (!d) return ''; try { const [y,m,dd]=d.split('-'); return new Date(y,m-1,dd).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}); } catch{return d;} }
