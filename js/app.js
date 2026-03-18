/* ============================================================
   Greysteel Unit Walkthrough -- app.js v5
   IndexedDB photo persistence + swipe navigation
   ============================================================ */

const DRAFT_KEY = 'gs_wt_v5';
const IDB_NAME  = 'gs_photos';
const IDB_STORE = 'photos';
let _idb = null;

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
  modalUnit: null, modalCat: null,
  photoModalUnit: null, photoModalCat: null
};

/* ============================================================ INDEXEDDB */
function idbOpen() {
  return new Promise((resolve, reject) => {
    if (_idb) { resolve(_idb); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror = () => reject(req.error);
  });
}

function idbSet(key, value) {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  }));
}

function idbGet(key) {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function idbGetAllKeys() {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).getAllKeys();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function idbDelete(key) {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  }));
}

function idbClearAll() {
  return idbOpen().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  }));
}

// Photo key format: "unit::cat::index"
function photoKey(unit, cat, idx) {
  return unit + '::' + cat + '::' + idx;
}

// Save a single photo to IDB
function idbSavePhoto(unit, cat, idx, dataUrl) {
  return idbSet(photoKey(unit, cat, idx), dataUrl).catch(() => {});
}

// Delete all IDB photos for a unit+cat
function idbDeletePhotosForEntry(unit, cat) {
  return idbGetAllKeys().then(keys => {
    const prefix = unit + '::' + cat + '::';
    return Promise.all(keys.filter(k => k.startsWith(prefix)).map(k => idbDelete(k)));
  }).catch(() => {});
}

// Load all photos from IDB back into S.data after a draft restore
async function idbRestoreAllPhotos() {
  try {
    const keys = await idbGetAllKeys();
    // Filter to keys belonging to current walkthrough units
    const unitSet = new Set(S.units);
    const relevant = keys.filter(k => {
      const parts = k.split('::');
      return parts.length === 3 && unitSet.has(parts[0]);
    });
    // Group by unit+cat
    const groups = {};
    relevant.forEach(k => {
      const [unit, cat, idx] = k.split('::');
      const gk = unit + '::' + cat;
      if (!groups[gk]) groups[gk] = [];
      groups[gk].push({ idx: parseInt(idx), key: k });
    });
    // Fetch and restore
    await Promise.all(Object.entries(groups).map(async ([gk, entries]) => {
      const [unit, cat] = gk.split('::');
      if (!S.data[unit] || !S.data[unit][cat]) return;
      entries.sort((a, b) => a.idx - b.idx);
      const photos = await Promise.all(entries.map(e => idbGet(e.key)));
      S.data[unit][cat].photos = photos.filter(Boolean);
    }));
  } catch (e) { /* silent fail */ }
}

// Save current photos to IDB for a specific entry
function idbSyncEntry(unit, cat) {
  const photos = S.data[unit]?.[cat]?.photos || [];
  idbDeletePhotosForEntry(unit, cat).then(() => {
    photos.forEach((dataUrl, idx) => idbSavePhoto(unit, cat, idx, dataUrl));
  });
}

/* ============================================================ INIT */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  renderSetupCatList();
  document.getElementById('units-input').addEventListener('input', updateUnitCount);
  document.getElementById('new-cat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addCategory(); }
  });
  initSwipe();
  tryRestoreDraft();
});

async function tryRestoreDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!p || !p.units || !p.units.length) return;
    if (!confirm('Restore draft for "' + p.property + '"?')) {
      localStorage.removeItem(DRAFT_KEY);
      await idbClearAll();
      return;
    }
    S = { ...p, modalUnit: null, modalCat: null, photoModalUnit: null, photoModalCat: null };
    showToast('Restoring photos...');
    await idbRestoreAllPhotos();
    showToast('Draft restored');
    showScreen('screen-inspect');
    afterStart();
  } catch (e) { localStorage.removeItem(DRAFT_KEY); }
}

/* ============================================================ SETUP */
function updateUnitCount() {
  const u = getUnits();
  document.getElementById('unit-count').textContent = u.length + ' unit' + (u.length !== 1 ? 's' : '');
}
function getUnits() {
  return document.getElementById('units-input').value.split('\n').map(s => s.trim()).filter(Boolean);
}
function renderSetupCatList() {
  const ul = document.getElementById('setup-cat-list'); ul.innerHTML = '';
  S.categories.forEach((cat, i) => {
    const li = document.createElement('li'); li.className = 'cat-item'; li.draggable = true; li.dataset.idx = i;
    li.innerHTML = '<span class="drag-handle">&#8942;&#8942;</span>' +
      '<input type="text" value="' + esc(cat) + '" onchange="S.categories[' + i + ']=this.value.trim()">' +
      '<button class="btn-icon btn-icon--danger" onclick="removeCategory(' + i + ')">' +
      '<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">' +
      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
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
function resetCategories() {
  if (confirm('Reset to defaults?')) { S.categories = [...DEFAULT_CATEGORIES]; renderSetupCatList(); }
}
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
  if (!prop) { showErr('Please enter a property name.'); return; }
  if (!units.length) { showErr('Please enter at least one unit.'); return; }
  if (!S.categories.length) { showErr('Please add at least one category.'); return; }
  document.getElementById('setup-error').classList.remove('visible');
  const newData = {};
  units.forEach(u => {
    newData[u] = S.data[u] || {};
    S.categories.forEach(c => {
      if (!newData[u][c]) newData[u][c] = { condition: '', note: '', photos: [], deleted: false };
    });
  });
  S.property = prop; S.inspector = inspector; S.date = date; S.units = units; S.data = newData; S.activeUnit = 0;
  showScreen('screen-inspect');
  afterStart();
}
function showErr(msg) { const e = document.getElementById('setup-error'); e.textContent = msg; e.classList.add('visible'); }
function afterStart() {
  document.getElementById('nav-prop-name').textContent = S.property;
  document.getElementById('btn-export-nav').style.display = 'flex';
  renderUnitTabs();
  renderInspectBody();
}

/* ============================================================ SWIPE */
function initSwipe() {
  // Attach to the inspect section so it covers the whole scrollable area
  const section = document.getElementById('screen-inspect');
  if (!section) return;
  let tx = 0, ty = 0, locked = false;

  section.addEventListener('touchstart', e => {
    tx = e.changedTouches[0].clientX;
    ty = e.changedTouches[0].clientY;
    locked = false;
  }, { passive: true });

  section.addEventListener('touchend', e => {
    if (locked) return;
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0 && S.activeUnit < S.units.length - 1) {
      swipeToUnit(S.activeUnit + 1, 'left');
    } else if (dx > 0 && S.activeUnit > 0) {
      swipeToUnit(S.activeUnit - 1, 'right');
    }
    locked = true;
  }, { passive: true });
}

function swipeToUnit(idx, direction) {
  const body = document.getElementById('inspect-body');
  if (!body) return;

  // Slide out current content
  const outX = direction === 'left' ? '-100%' : '100%';
  const inX  = direction === 'left' ? '100%'  : '-100%';

  body.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease';
  body.style.transform = 'translateX(' + outX + ')';
  body.style.opacity = '0';

  setTimeout(() => {
    S.activeUnit = idx;
    renderUnitTabs();
    renderInspectBody(); // re-renders body innerHTML, resets inline styles
    const newBody = document.getElementById('inspect-body');
    // Start off-screen then animate in
    newBody.style.transition = 'none';
    newBody.style.transform = 'translateX(' + inX + ')';
    newBody.style.opacity = '0';
    // Force reflow so transition fires
    newBody.getBoundingClientRect();
    newBody.style.transition = 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease';
    newBody.style.transform = 'translateX(0)';
    newBody.style.opacity = '1';
    scrollTabIntoView(idx);
  }, 220);
}

function scrollTabIntoView(idx) {
  const bar = document.getElementById('unit-tab-bar');
  if (!bar) return;
  const tab = bar.children[idx];
  if (tab) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

/* ============================================================ TABS */
function renderUnitTabs() {
  const bar = document.getElementById('unit-tab-bar'); bar.innerHTML = '';
  S.units.forEach((u, i) => {
    const activeCats = S.categories.filter(c => !S.data[u][c]?.deleted);
    const allDone = activeCats.length > 0 && activeCats.every(c => S.data[u][c].condition);
    const btn = document.createElement('button');
    btn.className = 'unit-tab' + (i === S.activeUnit ? ' active' : '') + (allDone ? ' tab-done' : '');
    btn.innerHTML = 'Unit ' + esc(u) + ' <span class="tab-dot"></span>';
    btn.onclick = () => { S.activeUnit = i; renderUnitTabs(); renderInspectBody(); };
    bar.appendChild(btn);
  });
  let logged = 0, total = 0;
  S.units.forEach(u => S.categories.forEach(c => {
    if (!S.data[u][c]?.deleted) {
      total++;
      if (S.data[u][c].condition || S.data[u][c].note) logged++;
    }
  }));
  document.getElementById('toolbar-prop').textContent = S.property;
  document.getElementById('toolbar-progress').textContent = logged + '/' + total;
}

/* ============================================================ INSPECT BODY */
function renderInspectBody() {
  const unit = S.units[S.activeUnit];
  const body = document.getElementById('inspect-body');
  body.innerHTML = '';
  S.categories.forEach(cat => {
    const entry = S.data[unit][cat];
    if (entry.deleted) return;
    const card = document.createElement('div');
    card.className = 'cat-card' + condClass(entry.condition);

    // TOP: name + pills + delete btn
    const top = document.createElement('div'); top.className = 'cat-card-top';
    const name = document.createElement('div'); name.className = 'cat-card-name'; name.textContent = cat;
    const pills = document.createElement('div'); pills.className = 'cond-pills';
    [['Good','good'],['Fair','fair'],['Poor','poor'],['N/A','na']].forEach(([label, val]) => {
      const btn = document.createElement('button');
      btn.className = 'cpill' + (entry.condition === val ? ' active-' + val : '');
      btn.textContent = label;
      btn.onclick = () => {
        S.data[unit][cat].condition = S.data[unit][cat].condition === val ? '' : val;
        renderInspectBody(); renderUnitTabs(); saveDraft(true);
      };
      pills.appendChild(btn);
    });
    const delBtn = document.createElement('button');
    delBtn.className = 'cat-delete-btn';
    delBtn.title = 'Remove for this unit only';
    delBtn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>';
    delBtn.onclick = () => {
      if (confirm('Remove "' + cat + '" from Unit ' + unit + ' only?')) {
        S.data[unit][cat].deleted = true;
        idbDeletePhotosForEntry(unit, cat);
        renderInspectBody(); renderUnitTabs(); saveDraft(true);
      }
    };
    top.appendChild(name); top.appendChild(pills); top.appendChild(delBtn);

    // BOTTOM: photo btn + note btn + note preview
    const bottom = document.createElement('div'); bottom.className = 'cat-card-bottom';
    const photoCount = entry.photos.length;
    const photoBtn = document.createElement('button');
    photoBtn.className = 'action-btn' + (photoCount ? ' active' : '');
    photoBtn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Photos' + (photoCount ? ' <span class="photo-badge">' + photoCount + '</span>' : '');
    photoBtn.onclick = () => openPhotoModal(unit, cat);
    const hasNote = !!entry.note;
    const noteBtn = document.createElement('button');
    noteBtn.className = 'action-btn' + (hasNote ? ' active' : '');
    noteBtn.innerHTML = '<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Note';
    noteBtn.onclick = () => openNoteModal(unit, cat);
    bottom.appendChild(photoBtn); bottom.appendChild(noteBtn);
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
  if (c === 'good') return ' has-condition cond-good';
  if (c === 'fair') return ' has-condition cond-fair';
  if (c === 'poor') return ' has-condition cond-poor';
  if (c === 'na')   return ' has-condition cond-na';
  return '';
}

/* ============================================================ NOTE MODAL */
function openNoteModal(unit, cat) {
  S.modalUnit = unit; S.modalCat = cat;
  document.getElementById('modal-badge').textContent = 'Unit ' + unit;
  document.getElementById('modal-title').textContent = cat;
  document.getElementById('modal-note').value = S.data[unit][cat].note || '';
  document.getElementById('note-modal').classList.add('open');
  setTimeout(() => document.getElementById('modal-note').focus(), 150);
}
function handleModalOverlay(e) { if (e.target === document.getElementById('note-modal')) closeNoteModal(); }
function closeNoteModal() { document.getElementById('note-modal').classList.remove('open'); }
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
function closePhotoModal() {
  document.getElementById('photo-modal').classList.remove('open');
  renderInspectBody(); renderUnitTabs(); saveDraft(true);
}
function handlePhotoInput(e) {
  const unit = S.photoModalUnit, cat = S.photoModalCat; if (!unit || !cat) return;
  Array.from(e.target.files).forEach(file => {
    compressPhoto(file, dataUrl => {
      S.data[unit][cat].photos.push(dataUrl);
      const idx = S.data[unit][cat].photos.length - 1;
      idbSavePhoto(unit, cat, idx, dataUrl);
      renderPhotoGrid(S.data[unit][cat].photos);
    });
  });
  e.target.value = '';
}
function compressPhoto(file, callback) {
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    const MAX = 1600;
    let w = img.width, h = img.height;
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
      else { w = Math.round(w * MAX / h); h = MAX; }
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', 0.85));
  };
  img.onerror = () => {
    const reader = new FileReader();
    reader.onload = ev => callback(ev.target.result);
    reader.readAsDataURL(file);
  };
  img.src = url;
}
function renderPhotoGrid(photos) {
  const grid = document.getElementById('photo-modal-grid'); grid.innerHTML = '';
  photos.forEach((src, i) => {
    const wrap = document.createElement('div'); wrap.className = 'photo-thumb-wrap';
    const img = document.createElement('img'); img.src = src; img.alt = '';
    img.onclick = () => openLightbox(src);
    const del = document.createElement('button'); del.className = 'photo-remove'; del.textContent = 'x';
    del.onclick = ev => {
      ev.stopPropagation();
      const unit = S.photoModalUnit, cat = S.photoModalCat;
      S.data[unit][cat].photos.splice(i, 1);
      idbSyncEntry(unit, cat);
      renderPhotoGrid(S.data[unit][cat].photos);
    };
    wrap.appendChild(img); wrap.appendChild(del); grid.appendChild(wrap);
  });
}

/* ============================================================ LIGHTBOX */
function openLightbox(src) { document.getElementById('lightbox-img').src = src; document.getElementById('lightbox').classList.add('open'); }
function closeLightbox() { document.getElementById('lightbox').classList.remove('open'); }

/* ============================================================ DRAFT */
function saveDraft(silent) {
  try {
    const dataNoPhotos = {};
    Object.keys(S.data).forEach(u => {
      dataNoPhotos[u] = {};
      Object.keys(S.data[u]).forEach(c => {
        dataNoPhotos[u][c] = { condition: S.data[u][c].condition, note: S.data[u][c].note, photos: [], deleted: S.data[u][c].deleted };
      });
    });
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      property: S.property, inspector: S.inspector, date: S.date,
      units: S.units, categories: S.categories, data: dataNoPhotos, activeUnit: S.activeUnit
    }));
    if (!silent) showToast('Draft saved');
  } catch(e) { if (!silent) showToast('Could not save draft'); }
}

/* ============================================================ FINISH / SUMMARY */
function finishWalkthrough() { saveDraft(true); renderSummary(); showScreen('screen-summary'); }
function renderSummary() {
  document.getElementById('summary-title').textContent = S.property;
  document.getElementById('summary-sub').textContent = 'Inspected by ' + (S.inspector || '--') + ' - ' + fmtDate(S.date);
  let photos = 0, poor = 0;
  S.units.forEach(u => S.categories.forEach(c => {
    if (S.data[u][c]?.deleted) return;
    photos += S.data[u][c].photos.length;
    if (S.data[u][c].condition === 'poor') poor++;
  }));
  document.getElementById('summary-stats').innerHTML =
    '<div class="stat-card"><div class="stat-num">' + S.units.length + '</div><div class="stat-lbl">Units</div></div>' +
    '<div class="stat-card"><div class="stat-num">' + S.categories.length + '</div><div class="stat-lbl">Categories</div></div>' +
    '<div class="stat-card"><div class="stat-num stat-num--gold">' + photos + '</div><div class="stat-lbl">Photos</div></div>' +
    '<div class="stat-card"><div class="stat-num stat-num--red">' + poor + '</div><div class="stat-lbl">Poor items</div></div>';
  const tbody = document.getElementById('unit-review-rows'); tbody.innerHTML = '';
  S.units.forEach((u, i) => {
    const ac = S.categories.filter(c => !S.data[u][c]?.deleted);
    const up  = ac.filter(c => S.data[u][c].condition === 'poor').length;
    const uf  = ac.filter(c => S.data[u][c].condition || S.data[u][c].note).length;
    const uph = ac.reduce((s, c) => s + S.data[u][c].photos.length, 0);
    const row = document.createElement('div'); row.className = 'urt-row';
    row.innerHTML = '<span class="urt-unit">Unit ' + esc(u) + '</span><span class="urt-done">' + uf + '/' + ac.length + '</span><span class="urt-done">' + uph + '</span><span class="urt-poor">' + (up > 0 ? up : '--') + '</span><button class="btn-ghost-lg" style="font-size:13px;padding:6px 10px;" onclick="jumpUnit(' + i + ')">Edit</button>';
    tbody.appendChild(row);
  });
}
function jumpUnit(i) { S.activeUnit = i; renderUnitTabs(); renderInspectBody(); showScreen('screen-inspect'); }
async function newWalkthrough() {
  if (!confirm('Start fresh? Current data will be cleared.')) return;
  await idbClearAll();
  S = { property:'',inspector:'',date:'',units:[],categories:[...DEFAULT_CATEGORIES],data:{},activeUnit:0,modalUnit:null,modalCat:null,photoModalUnit:null,photoModalCat:null };
  localStorage.removeItem(DRAFT_KEY);
  ['prop-name','inspector-name','units-input'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('btn-export-nav').style.display = 'none';
  document.getElementById('nav-prop-name').textContent = '';
  updateUnitCount(); renderSetupCatList(); showScreen('screen-setup');
}

/* ============================================================ EXPORT MENU */
function exportExcel() {
  const existing = document.getElementById('export-menu');
  if (existing) { existing.remove(); return; }
  if (!S.units.length) { showToast('No data to export.'); return; }
  const menu = document.createElement('div');
  menu.id = 'export-menu';
  menu.style.cssText = 'position:fixed;top:54px;right:12px;background:#fff;border:1px solid rgba(26,35,50,0.15);border-radius:12px;box-shadow:0 8px 28px rgba(26,35,50,0.16);z-index:400;min-width:230px;overflow:hidden;';
  menu.innerHTML =
    '<div style="padding:11px 16px 7px;font-size:11px;letter-spacing:0.09em;text-transform:uppercase;color:#9e9890;font-family:\'DM Sans\',sans-serif;border-bottom:1px solid rgba(26,35,50,0.08);">Export as</div>' +
    '<button onclick="var m=document.getElementById(\'export-menu\');if(m)m.remove();shareReport();" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;background:none;border:none;border-bottom:1px solid rgba(26,35,50,0.07);font-size:14px;font-family:\'DM Sans\',sans-serif;color:#1a2332;cursor:pointer;text-align:left;">' +
    '<svg width="16" height="16" fill="none" stroke="#1a2332" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>' +
    '<div><div style="font-weight:500;">Share / Email</div><div style="font-size:11px;color:#9e9890;margin-top:1px;">iOS share sheet - Mail, AirDrop, etc.</div></div></button>' +
    '<button onclick="var m=document.getElementById(\'export-menu\');if(m)m.remove();exportHTMLReport();" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;background:none;border:none;border-bottom:1px solid rgba(26,35,50,0.07);font-size:14px;font-family:\'DM Sans\',sans-serif;color:#1a2332;cursor:pointer;text-align:left;">' +
    '<svg width="16" height="16" fill="none" stroke="#c9a84c" stroke-width="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
    '<div><div style="font-weight:500;">PDF Report</div><div style="font-size:11px;color:#9e9890;margin-top:1px;">Formatted - includes photos</div></div></button>' +
    '<button onclick="var m=document.getElementById(\'export-menu\');if(m)m.remove();exportPlainExcel();" style="display:flex;align-items:center;gap:12px;width:100%;padding:12px 16px;background:none;border:none;font-size:14px;font-family:\'DM Sans\',sans-serif;color:#1a2332;cursor:pointer;text-align:left;">' +
    '<svg width="16" height="16" fill="none" stroke="#1a2332" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>' +
    '<div><div style="font-weight:500;">Excel spreadsheet</div><div style="font-size:11px;color:#9e9890;margin-top:1px;">Data only - no photos</div></div></button>';
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', function h(e) {
    if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener('click', h); }
  }), 60);
}

/* ============================================================ PDF REPORT */
function buildReportHTML() {
  const cats = S.categories;
  const date = fmtDate(S.date);
  const condLabel = c => ({ good:'Good', fair:'Fair', poor:'Poor', na:'N/A' }[c] || '');
  const condBadge = c => {
    if (!c) return '<span style="color:#b8b2a8;font-size:12px;">--</span>';
    const styles = {
      good: 'background:#edf7ed;color:#2e7d32;border:1px solid rgba(129,199,132,0.4);',
      fair: 'background:#fff8e1;color:#e65100;border:1px solid rgba(255,183,77,0.4);',
      poor: 'background:#fff5f5;color:#c62828;border:1px solid rgba(229,115,115,0.4);',
      na:   'background:#ede9e1;color:#6b6560;border:1px solid rgba(184,178,168,0.4);'
    };
    return '<span style="display:inline-block;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:500;letter-spacing:0.04em;' + (styles[c]||'') + '">' + condLabel(c) + '</span>';
  };

  // Calculate totals first
  let totalPhotos = 0, totalPoor = 0;
  S.units.forEach(u => cats.forEach(c => {
    if (S.data[u][c]?.deleted) return;
    totalPhotos += S.data[u][c].photos.length;
    if (S.data[u][c].condition === 'poor') totalPoor++;
  }));

  let unitSections = '';
  S.units.forEach(u => {
    const activeCats = cats.filter(c => !S.data[u][c]?.deleted);
    let rows = '';
    activeCats.forEach(cat => {
      const e = S.data[u][cat];
      const photoCount = e.photos.length;
      const hasContent = e.condition || e.note || photoCount;
      rows += '<tr style="' + (!hasContent ? 'opacity:0.45;' : '') + '">' +
        '<td style="padding:12px 16px;font-size:13px;font-weight:500;color:#1a2332;border-bottom:1px solid #ede9e1;width:190px;vertical-align:top;white-space:nowrap;">' + esc(cat) + '</td>' +
        '<td style="padding:12px 16px;border-bottom:1px solid #ede9e1;vertical-align:top;width:90px;">' + condBadge(e.condition) + '</td>' +
        '<td style="padding:12px 16px;font-size:13px;color:#3a3530;border-bottom:1px solid #ede9e1;vertical-align:top;line-height:1.6;">' + esc(e.note || '') + '</td>' +
        '<td style="padding:12px 16px;border-bottom:1px solid #ede9e1;vertical-align:top;font-size:12px;color:' + (photoCount ? '#c9a84c' : '#b8b2a8') + ';">' + (photoCount ? photoCount + ' photo' + (photoCount > 1 ? 's' : '') + ' -- see appendix' : '--') + '</td>' +
        '</tr>';
    });
    const poor = activeCats.filter(c => S.data[u][c].condition === 'poor').length;
    const fair = activeCats.filter(c => S.data[u][c].condition === 'fair').length;
    const good = activeCats.filter(c => S.data[u][c].condition === 'good').length;
    unitSections +=
      '<div style="margin-bottom:36px;" class="unit-block">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#1a2332;border-radius:12px 12px 0 0;">' +
      '<div style="font-family:\'DM Sans\',sans-serif;font-size:15px;font-weight:500;color:#fff;letter-spacing:0.05em;">UNIT ' + esc(u) + '</div>' +
      '<div style="display:flex;gap:6px;">' +
      (good ? '<span style="background:rgba(46,125,50,0.25);color:#81c784;font-size:11px;font-weight:500;padding:3px 10px;border-radius:99px;">' + good + ' Good</span>' : '') +
      (fair ? '<span style="background:rgba(230,81,0,0.2);color:#ffb74d;font-size:11px;font-weight:500;padding:3px 10px;border-radius:99px;">' + fair + ' Fair</span>' : '') +
      (poor ? '<span style="background:rgba(198,40,40,0.25);color:#e57373;font-size:11px;font-weight:500;padding:3px 10px;border-radius:99px;">' + poor + ' Poor</span>' : '') +
      '</div></div>' +
      '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #ede9e1;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">' +
      '<colgroup><col style="width:190px"><col style="width:90px"><col><col style="width:200px"></colgroup>' +
      '<thead><tr style="background:#f7f5f0;">' +
      '<th style="padding:9px 16px;font-size:10px;text-transform:uppercase;letter-spacing:0.09em;color:#9e9890;text-align:left;font-weight:500;border-bottom:1px solid #ede9e1;">Category</th>' +
      '<th style="padding:9px 16px;font-size:10px;text-transform:uppercase;letter-spacing:0.09em;color:#9e9890;text-align:left;font-weight:500;border-bottom:1px solid #ede9e1;">Condition</th>' +
      '<th style="padding:9px 16px;font-size:10px;text-transform:uppercase;letter-spacing:0.09em;color:#9e9890;text-align:left;font-weight:500;border-bottom:1px solid #ede9e1;">Notes</th>' +
      '<th style="padding:9px 16px;font-size:10px;text-transform:uppercase;letter-spacing:0.09em;color:#9e9890;text-align:left;font-weight:500;border-bottom:1px solid #ede9e1;">Photos</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div>';
  });

  // Photo appendix
  let photoAppendixItems = '';
  S.units.forEach(u => {
    cats.forEach(cat => {
      if (S.data[u][cat]?.deleted) return;
      const photos = S.data[u][cat].photos;
      if (!photos.length) return;
      photos.forEach((src, idx) => {
        photoAppendixItems +=
          '<div style="page-break-inside:avoid;margin-bottom:40px;">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #ede9e1;">' +
          '<div style="background:#1a2332;color:#c9a84c;font-size:11px;font-weight:500;letter-spacing:0.08em;padding:4px 12px;border-radius:99px;white-space:nowrap;">Unit ' + esc(u) + '</div>' +
          '<div style="font-size:13px;font-weight:500;color:#1a2332;">' + esc(cat) + '</div>' +
          '<div style="margin-left:4px;">' + condBadge(S.data[u][cat].condition) + '</div>' +
          '<div style="margin-left:auto;font-size:12px;color:#9e9890;">Photo ' + (idx + 1) + ' of ' + photos.length + '</div>' +
          '</div>' +
          '<img src="' + src + '" style="width:100%;max-width:100%;height:auto;border-radius:10px;border:1px solid #ede9e1;display:block;">' +
          '</div>';
      });
    });
  });
  const photoAppendix = photoAppendixItems ?
    '<div style="page-break-before:always;margin-top:0;">' +
    '<div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1a2332;">' +
    '<div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:26px;font-weight:500;color:#1a2332;">Photo Appendix</div>' +
    '<div style="font-size:12px;color:#9e9890;margin-top:4px;">' + totalPhotos + ' photo' + (totalPhotos !== 1 ? 's' : '') + ' - ' + esc(S.property) + '</div>' +
    '</div>' + photoAppendixItems + '</div>' : '';

  const html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n' +
    '<title>Walkthrough Report - ' + esc(S.property) + '</title>\n' +
    '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">\n' +
    '<style>\n' +
    '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\n' +
    'body { font-family: \'DM Sans\', Arial, sans-serif; background: #f7f5f0; color: #1a2332; -webkit-print-color-adjust: exact; print-color-adjust: exact; }\n' +
    '.page { max-width: 1000px; margin: 0 auto; padding: 2rem; }\n' +
    '@media print { body { background: #fff; } .no-print { display: none !important; } .unit-block { page-break-inside: avoid; } @page { margin: 1.5cm; } }\n' +
    '</style>\n</head>\n<body>\n<div class="page">\n' +
    '<div class="no-print" style="margin-bottom:1.5rem;display:flex;align-items:center;gap:12px;">' +
    '<button onclick="window.print()" style="display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:#1a2332;color:#fff;border:none;border-radius:8px;font-size:14px;font-family:\'DM Sans\',sans-serif;cursor:pointer;">' +
    '<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>' +
    'Print / Save as PDF</button>' +
    '<span style="font-size:13px;color:#9e9890;">File - Print - Save as PDF</span></div>' +
    '<div style="background:#1a2332;border-radius:14px;padding:28px 32px;margin-bottom:28px;">' +
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;">' +
    '<div><div style="font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:0.2em;color:#c9a84c;margin-bottom:8px;">GREYSTEEL COMMERCIAL REAL ESTATE</div>' +
    '<div style="font-family:\'Cormorant Garamond\',Georgia,serif;font-size:30px;font-weight:500;color:#fff;margin-bottom:4px;">' + esc(S.property) + '</div>' +
    '<div style="font-size:13px;color:rgba(255,255,255,0.45);letter-spacing:0.04em;">Unit Walkthrough Report</div></div>' +
    '<div style="text-align:right;">' +
    '<div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Inspector</div>' +
    '<div style="font-size:15px;color:#fff;margin-bottom:12px;">' + esc(S.inspector || '--') + '</div>' +
    '<div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Date</div>' +
    '<div style="font-size:15px;color:#fff;">' + date + '</div></div></div>' +
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);">' +
    '<div style="text-align:center;"><div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:500;color:#fff;">' + S.units.length + '</div><div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Units</div></div>' +
    '<div style="text-align:center;"><div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:500;color:#fff;">' + cats.length + '</div><div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Categories</div></div>' +
    '<div style="text-align:center;"><div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:500;color:#c9a84c;">' + totalPhotos + '</div><div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Photos</div></div>' +
    '<div style="text-align:center;"><div style="font-family:\'Cormorant Garamond\',serif;font-size:32px;font-weight:500;color:#e57373;">' + totalPoor + '</div><div style="font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.07em;margin-top:3px;">Poor items</div></div>' +
    '</div></div>' +
    unitSections + photoAppendix +
    '<div style="margin-top:40px;padding-top:16px;border-top:1px solid #ede9e1;display:flex;justify-content:space-between;align-items:center;">' +
    '<div style="font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:0.14em;color:#b8b2a8;">GREYSTEEL COMMERCIAL REAL ESTATE</div>' +
    '<div style="font-size:12px;color:#b8b2a8;">Generated ' + new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) + '</div>' +
    '</div></div></body></html>';

  return html;
}

function exportHTMLReport() {
  if (!S.units.length) return;
  const html = buildReportHTML();
  const blob = new Blob([html], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
  showToast('Report opened -- print or save as PDF');
}

/* ============================================================ SHARE (Web Share API) */
async function shareReport() {
  if (!S.units.length) { showToast('No data to share.'); return; }
  if (!navigator.share && !navigator.canShare) {
    showToast('Sharing not supported on this browser -- use Export instead.');
    return;
  }
  // Build the report HTML (reuse same logic)
  showToast('Preparing report...');
  const html = buildReportHTML();
  const blob = new Blob([html], { type: 'text/html' });
  const fname = sanit(S.property) + '_walkthrough_' + (S.date || new Date().toISOString().split('T')[0]) + '.html';
  const file = new File([blob], fname, { type: 'text/html' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Walkthrough Report - ' + S.property,
        text: 'Unit walkthrough report for ' + S.property + ' inspected by ' + (S.inspector || 'Greysteel') + ' on ' + fmtDate(S.date),
        files: [file]
      });
    } else {
      // Fallback: share URL only (no file attachment)
      const url = URL.createObjectURL(blob);
      await navigator.share({
        title: 'Walkthrough Report - ' + S.property,
        text: 'Unit walkthrough report for ' + S.property,
        url: url
      });
    }
  } catch (e) {
    if (e.name !== 'AbortError') showToast('Could not share -- try Export instead.');
  }
}

/* ============================================================ EXCEL */
function exportPlainExcel() {
  if (!S.units.length) return;
  const cats = S.categories;
  const condLabel = c => ({ good:'Good', fair:'Fair', poor:'Poor', na:'N/A' }[c] || '');
  const headers = ['Property','Inspector','Date','Unit'].concat(cats.flatMap(c => [c + ' -- Condition', c + ' -- Notes']));
  const rows = [headers];
  S.units.forEach(u => {
    const row = [S.property, S.inspector, fmtDate(S.date), u];
    cats.forEach(c => {
      const e = S.data[u][c];
      if (e?.deleted) { row.push('N/A (removed)', ''); return; }
      row.push(condLabel(e.condition), e.note || '');
    });
    rows.push(row);
  });
  const ws1 = XLSX.utils.aoa_to_sheet(rows);
  ws1['!cols'] = [{wch:22},{wch:14},{wch:18},{wch:10}].concat(cats.flatMap(()=>[{wch:14},{wch:36}]));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, 'Walkthrough');
  const sum = [['Unit','Items Logged','Good','Fair','Poor','N/A','Photos']];
  S.units.forEach(u => {
    const ac = cats.filter(c => !S.data[u][c]?.deleted);
    sum.push([u,
      ac.filter(c=>S.data[u][c].condition||S.data[u][c].note).length,
      ac.filter(c=>S.data[u][c].condition==='good').length,
      ac.filter(c=>S.data[u][c].condition==='fair').length,
      ac.filter(c=>S.data[u][c].condition==='poor').length,
      ac.filter(c=>S.data[u][c].condition==='na').length,
      ac.reduce((s,c)=>s+S.data[u][c].photos.length,0)
    ]);
  });
  const tot = ['TOTAL'];
  for (let i = 1; i <= 6; i++) tot.push(sum.slice(1).reduce((t,r)=>t+(r[i]||0),0));
  sum.push(tot);
  const ws2 = XLSX.utils.aoa_to_sheet(sum);
  ws2['!cols'] = [{wch:12},{wch:14},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
  XLSX.writeFile(wb, sanit(S.property)+'_walkthrough_'+(S.date||new Date().toISOString().split('T')[0])+'.xlsx');
  showToast('Excel exported');
}

/* ============================================================ SAMPLE DATA */
function loadSampleData() {
  document.getElementById('prop-name').value = '604 12th Street NE';
  document.getElementById('inspector-name').value = 'Mason';
  document.getElementById('insp-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('units-input').value = '101\n102\n201';
  updateUnitCount();
  const mk = (condition, note) => ({ condition, note, photos: [], deleted: false });
  const sampleData = {
    '101': {
      'Kitchen (appliances, cabinets, countertops)': mk('fair', 'Cabinets show wear, door hinge loose on upper left. Appliances functional but dated. Countertops have minor chip near sink.'),
      'Bathroom (tile, fixtures, vanity)': mk('poor', 'Grout cracked along tub surround. One floor tile cracked. Vanity faucet drips -- needs washer replacement.'),
      'Flooring': mk('fair', 'Hardwood in living area has scuff marks and one loose board near entry. Carpet in bedroom worn at threshold.'),
      'Windows & Doors': mk('good', 'All windows operational, seals intact. Front door deadbolt stiff but functional.'),
      'Walls & Ceilings': mk('good', 'Minor scuff marks throughout, no cracks or water staining.'),
      'HVAC / Mechanicals': mk('fair', 'Filter overdue for replacement. Unit functional but rattles on startup.'),
      'Closets & Storage': mk('good', ''),
      'General Unit Condition': mk('fair', 'Unit is livable but needs cosmetic refresh before re-lease. Kitchen and bath are priority items.')
    },
    '102': {
      'Kitchen (appliances, cabinets, countertops)': mk('good', 'Recently updated cabinets and countertops. All appliances clean and functional.'),
      'Bathroom (tile, fixtures, vanity)': mk('good', 'Tile in good shape. Fixtures clean. Caulk fresh.'),
      'Flooring': mk('poor', 'LVT flooring has significant bubbling in kitchen -- likely moisture issue underneath. Needs full replacement.'),
      'Windows & Doors': mk('good', ''),
      'Walls & Ceilings': mk('fair', 'Water stain on bedroom ceiling approx 12 inch diameter -- source unclear, may be from unit above. Needs investigation.'),
      'HVAC / Mechanicals': mk('good', 'New filter installed. System clean and quiet.'),
      'Closets & Storage': mk('good', ''),
      'General Unit Condition': mk('fair', 'Overall good unit but flooring issue and ceiling stain need to be addressed before re-lease.')
    },
    '201': {
      'Kitchen (appliances, cabinets, countertops)': mk('poor', 'Cabinet doors missing on two lower units. Dishwasher non-functional. Countertop has large burn mark near range.'),
      'Bathroom (tile, fixtures, vanity)': mk('poor', 'Toilet runs continuously. Shower head missing. Tile has multiple cracks and missing grout throughout.'),
      'Flooring': mk('fair', 'Carpet throughout -- heavily worn and stained. Recommend replacement.'),
      'Windows & Doors': mk('fair', 'Bedroom window has broken lock. Bathroom window does not seal fully.'),
      'Walls & Ceilings': mk('poor', 'Multiple holes in drywall in living room. Paint peeling in bathroom. Significant water damage on kitchen ceiling.'),
      'HVAC / Mechanicals': mk('poor', 'AC unit not cooling. Thermostat unresponsive. Needs full service call or replacement.'),
      'Closets & Storage': mk('fair', 'Closet rod missing in master. Door off track.'),
      'General Unit Condition': mk('poor', 'Unit is in poor condition and not rentable as-is. Significant capex required -- estimate 2-3 weeks minimum turn time.')
    }
  };
  S.property = '604 12th Street NE';
  S.inspector = 'Mason';
  S.date = new Date().toISOString().split('T')[0];
  S.units = ['101', '102', '201'];
  S.categories = [...DEFAULT_CATEGORIES];
  S.data = sampleData;
  S.activeUnit = 0;
  showScreen('screen-inspect');
  afterStart();
}

/* ============================================================ UTILS */
function showScreen(id) { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showToast(msg) { const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2500); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function cap(s) { return s.charAt(0).toUpperCase()+s.slice(1); }
function sanit(s) { return (s||'walkthrough').replace(/[^a-z0-9]/gi,'_').toLowerCase(); }
function fmtDate(d) { if(!d) return ''; try{const[y,m,dd]=d.split('-');return new Date(y,m-1,dd).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});}catch(e){return d;} }
