/* ===== Sofia's Life Planner – App Logic ===== */

// ===== STORAGE =====
const S = {
  get: k => { try { return JSON.parse(localStorage.getItem('sp_' + k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem('sp_' + k, JSON.stringify(v))
};

// ===== STATE =====
let notes    = S.get('notes')   || [];
let diary    = S.get('diary')   || [{ id: 1, title: 'Wednesday feeling', date: '2026-03-04', mood: '😌', type: 'night', content: 'Today I focused on biochemistry and got through the chapter on metabolic pathways. The weather is grey but cozy outside.', grateful: 'My warm tea and a quiet morning' }];
let habits   = S.get('habits')  || [{ id: 1, name: 'Drink Water', emoji: '🫗' }, { id: 2, name: 'Skincare (Morning)', emoji: '🧴' }, { id: 3, name: 'Brush Teeth', emoji: '🪥' }, { id: 4, name: 'Workout', emoji: '🏋️' }, { id: 5, name: '10.000 Steps', emoji: '🚶' }, { id: 6, name: 'Study (1 hour)', emoji: '📖' }, { id: 7, name: 'Skincare (Night)', emoji: '🌙' }, { id: 8, name: 'Read', emoji: '📚' }];
let hChecks  = S.get('hChecks') || {};
let budget   = S.get('budget')  || [{ id: 1, name: 'Lön', amount: 13804, dir: 'income', cat: 'Bas Inkomst' }, { id: 2, name: 'GYM', amount: 500, dir: 'expense', cat: 'Prenumeration' }, { id: 3, name: 'HBO', amount: 89, dir: 'expense', cat: 'Prenumeration' }, { id: 4, name: 'Claude', amount: 244.37, dir: 'expense', cat: 'Prenumeration' }, { id: 5, name: 'Notion', amount: 324, dir: 'expense', cat: 'Prenumeration' }, { id: 6, name: 'Opti Sparande', amount: 1115, dir: 'saving', cat: 'Sparande' }, { id: 7, name: 'Hus sparande', amount: 5000, dir: 'saving', cat: 'Sparande' }, { id: 8, name: 'Storytel', amount: 99, dir: 'expense', cat: 'Prenumeration' }, { id: 9, name: 'Sparande (extra)', amount: 300, dir: 'saving', cat: 'Sparande' }];
let photos   = S.get('photos')  || [];

// Class Schedule – stored in localStorage, editable via UI
let schedule = S.get('schedule') || [
  { id: 1, week: 'V6', days: [
    { date: '9.2',  classes: ['13\u201314 Tr\u00e4ff 1', 'Weekcomm M'] },
    { date: '10.2', classes: ['10\u201312 Pluggstuga'] },
    { date: '11.2', classes: ['13\u201314 Pluggstuga'] },
    { date: '12.2', classes: [] },
    { date: '13.2', classes: ['10\u201311 Pluggstuga'] }
  ]},
  { id: 2, week: 'V7', days: [
    { date: '16.2', classes: ['10\u201311 Pluggstuga'] },
    { date: '17.2', classes: ['10\u201312 Pluggstuga'] },
    { date: '18.2', classes: ['10\u201312 Pluggstuga', 'Tr\u00e4ff 4 Arbetslivet'] },
    { date: '19.2', classes: [] },
    { date: '20.2', classes: ['10\u201311 Pluggstuga'] }
  ]},
  { id: 3, week: 'V8', days: [
    { date: '23.2', classes: [] },
    { date: '24.2', classes: ['13\u201315 Tr\u00e4ff 6'] },
    { date: '25.2', classes: ['13\u201315 Profession'] },
    { date: '26.2', classes: [] },
    { date: '27.2', classes: ['10\u201311 Pluggstuga'] }
  ]},
  { id: 4, week: 'V9', days: [
    { date: '2.3', classes: [] },
    { date: '3.3', classes: [] },
    { date: '4.3', classes: [] },
    { date: '5.3', classes: [] },
    { date: '6.3', classes: [] }
  ]}
];

let curNote  = null, curDiary = null;
let hWkOff   = 0;
let editMode = false;
let journalMoods = S.get('journalMoods') || {};
let schedEditMode = false;
let radioEditMode = false;

// Calendar
let calY = 2026, calM = 2;
const MONTHS_SV = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
const DAYS_SV = ['M\u00e5n','Tis','Ons','Tor','Fre','L\u00f6r','S\u00f6n'];

// Pomodoro
let pom = { running: false, mode: 'work', total: 25 * 60, rem: 25 * 60, int: null, ses: 0, mins: 0 };

// Google Calendar – token is in-memory only (expires after 1 h, not persisted)
let gcalToken = null;
let gcalClientId = S.get('gcalClientId') || '';
let gcalEvents = [];

// Radio
let radioOpen = false;
let currentStation = null;
let radioStations = S.get('radioStations') || [
  { name: 'P3',      url: 'https://sverigesradio.se/topsy/direkt/srapi/164.mp3' },
  { name: 'P1',      url: 'https://sverigesradio.se/topsy/direkt/srapi/132.mp3' },
  { name: 'P4 Sthlm',url: 'https://sverigesradio.se/topsy/direkt/srapi/4722.mp3' },
  { name: 'Lugna',   url: 'https://sverigesradio.se/topsy/direkt/srapi/2576.mp3' },
  { name: 'NRJ',     url: 'https://stream-se.nrjaudio.fm/se-nrj' },
  { name: 'Bandit',  url: 'https://fm-stream.se/bandit/se' }
];

// Widget order
let widgetOrder = S.get('widgetOrder') || ['nav', 'today', 'habits-today', 'budget-mini', 'calendar-widget', 'scrapbook'];

// Calendar manual events
let calManualEvents = S.get('calManualEvents') || [];
let pendingCalDate = null;

// Manual GCal events
let manualGcalEvents = S.get('manualGcalEvents') || [];

// Journal photos
let pendingJournalPhotos = [];

// Pinterest
let pinterestBoardUrl = S.get('pinterestBoard') || '';

// ===== UTILITIES =====
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== NAV =====
function nav(page) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
  const el = document.getElementById('view-' + page);
  if (el) el.classList.add('active');
  const navEl = document.querySelector(`.sb-item[data-view="${page}"]`);
  if (navEl) navEl.classList.add('active');
  const fns = {
    home: renderHome,
    journal: renderJournal,
    habits: renderHabits,
    budget: renderBudget,
    study: renderStudy,
    notes: renderNotes,
    planner: renderPlanner,
  };
  if (fns[page]) fns[page]();
}

// ===== HOME =====
function renderHome() {
  document.getElementById('hero-date').textContent = new Date().toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  renderProfilePhoto();
  renderWidgets();
}

function renderWidgets() {
  const grid = document.getElementById('widget-grid');
  grid.innerHTML = '';
  widgetOrder.forEach(id => {
    const el = buildWidget(id);
    if (el) grid.appendChild(el);
  });
  if (editMode) grid.classList.add('edit-mode');
  else grid.classList.remove('edit-mode');
  initDragDrop();
}

function buildWidget(id) {
  const w = document.createElement('div');
  w.className = 'widget';
  w.dataset.widget = id;
  const handle = '<div class="widget-drag-handle" draggable="false">\u28bf</div>';

  switch (id) {
    case 'nav':
      w.innerHTML = `${handle}<div class="card-head">\ud83d\udc1a Navigate</div><div class="home-nav-grid">
        <button class="home-nav-btn" onclick="nav('journal')">\ud83d\udcd4 Journal</button>
        <button class="home-nav-btn" onclick="nav('habits')">\u2713 Habits</button>
        <button class="home-nav-btn" onclick="nav('budget')">\ud83d\udcb0 Budget</button>
        <button class="home-nav-btn" onclick="nav('study')">\ud83d\udcda Study Hub</button>
        <button class="home-nav-btn" onclick="nav('notes')">\ud83d\udcdd Notes</button>
        <button class="home-nav-btn" onclick="nav('planner')">\ud83d\udcc5 Planner</button>
      </div>`;
      break;

    case 'today': {
      const today = new Date().toLocaleDateString('sv-SE');
      const todayHabits = habits.filter(h => hChecks[hKey(h.id, today)]);
      const pct = habits.length ? Math.round(todayHabits.length / habits.length * 100) : 0;
      w.innerHTML = `${handle}<div class="card-head">\u2600\ufe0f Today at a Glance</div><div class="widget-body">
        <div style="font-size:13px;color:var(--tm);margin-bottom:10px"><strong>${pct}%</strong> habits done today</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div style="margin-top:12px;display:flex;gap:6px">
          <button class="btn-link" onclick="nav('journal')">+ Journal</button>
          <button class="btn-link" onclick="nav('habits')">Log habits</button>
        </div>
      </div>`;
      break;
    }

    case 'habits-today': {
      const today = new Date().toLocaleDateString('sv-SE');
      const rows = habits.slice(0, 5).map(h => {
        const k = hKey(h.id, today);
        return `<div class="quick-habit-row">
          <span>${h.emoji} ${escHtml(h.name)}</span>
          <input type="checkbox" class="hcb" ${hChecks[k] ? 'checked' : ''} onchange="togHToday('${k}',this.checked)">
        </div>`;
      }).join('');
      w.innerHTML = `${handle}<div class="card-head">\u2713 Habits Today <span style="font-size:10px;color:var(--tl)">${new Date().toLocaleDateString('sv-SE',{weekday:'short'})}</span></div>
        <div class="widget-body">${rows}
        <button class="btn-link" style="margin-top:8px;width:100%;text-align:center" onclick="nav('habits')">See all habits \u2192</button>
      </div>`;
      break;
    }

    case 'budget-mini': {
      let inc = 0, exp = 0, sav = 0;
      budget.forEach(b => { if (b.dir === 'income') inc += b.amount; else if (b.dir === 'expense') exp += b.amount; else sav += b.amount; });
      const bal = inc - exp - sav;
      w.innerHTML = `${handle}<div class="card-head">\ud83d\udcb0 Budget \u00b7 Mars 2026</div><div class="widget-body">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px"><span style="color:var(--tl)">Inkomst</span><span class="income-color">+${fmtKr(inc)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px"><span style="color:var(--tl)">Utgifter</span><span class="expense-color">-${fmtKr(exp + sav)}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border);font-size:14px"><span><strong>Balans</strong></span><span class="balance-color" style="font-weight:700">${fmtKr(bal)}</span></div>
        <button class="btn-link" style="margin-top:10px;width:100%;text-align:center" onclick="nav('budget')">View full budget \u2192</button>
      </div>`;
      break;
    }

    case 'calendar-widget': {
      const now = new Date();
      w.className = 'widget widget-wide';
      w.innerHTML = `${handle}<div class="card-head">\ud83d\udcc5 Calendar \u00b7 ${MONTHS_SV[calM]} ${calY}
        <div style="display:flex;gap:4px">
          <button class="cal-nb" onclick="calPrev();renderWidgets()">\u2039</button>
          <button class="cal-nb" onclick="calNext();renderWidgets()">\u203a</button>
        </div>
      </div><div class="widget-body">${buildCalHtml(now)}</div>`;
      break;
    }

    case 'scrapbook': {
      const preview = photos.slice(0, 4);
      const grid2 = preview.map(p => `<img src="${p}" style="width:100%;height:62px;object-fit:cover;border-radius:5px">`).join('');
      w.innerHTML = `${handle}<div class="card-head">\u2728 Scrapbook</div>
        <div style="padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:5px;min-height:80px;cursor:pointer" onclick="nav('home')">
          ${preview.length ? grid2 : '<div style="grid-column:1/3;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--tl)">+ Add photos \u2728</div>'}
        </div>`;
      break;
    }

    default: return null;
  }
  return w;
}

function buildCalHtml(now) {
  let html = `<div class="cal-grid">`;
  DAYS_SV.forEach(d => html += `<div class="cal-dh">${d}</div>`);
  let dow = new Date(calY, calM, 1).getDay();
  dow = dow === 0 ? 6 : dow - 1;
  const dim = new Date(calY, calM + 1, 0).getDate();
  for (let i = 0; i < dow; i++) html += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= dim; d++) {
    const isT = d === now.getDate() && calM === now.getMonth() && calY === now.getFullYear();
    const hasManualEv = calManualEvents.some(e => {
      const ed = new Date(e.date);
      return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY;
    });
    const hasEv = hasManualEv || gcalEvents.some(e => {
      const ed = new Date(e.start?.dateTime || e.start?.date);
      return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY;
    });
    html += `<div class="cal-day${isT ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="openAddCalEvent(${d},${calM},${calY})">${d}</div>`;
  }
  html += '</div>';
  return html;
}

function calPrev() { calM--; if (calM < 0) { calM = 11; calY--; } renderPlanner(); }
function calNext() { calM++; if (calM > 11) { calM = 0; calY++; } renderPlanner(); }

// Drag & drop widgets
let dragSrc = null;
function initDragDrop() {
  document.querySelectorAll('.widget').forEach(w => {
    w.addEventListener('dragstart', e => { dragSrc = w; w.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    w.addEventListener('dragend', () => { w.classList.remove('dragging'); dragSrc = null; saveWidgetOrder(); });
    w.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragSrc && dragSrc !== w) {
        const rect = w.getBoundingClientRect();
        if (e.clientX < rect.left + rect.width / 2) w.before(dragSrc);
        else w.after(dragSrc);
      }
    });
    if (editMode) w.draggable = true;
  });
}

function saveWidgetOrder() {
  widgetOrder = Array.from(document.querySelectorAll('.widget')).map(w => w.dataset.widget);
  S.set('widgetOrder', widgetOrder);
}

function toggleEditMode() {
  editMode = !editMode;
  const grid = document.getElementById('widget-grid');
  grid.classList.toggle('edit-mode', editMode);
  document.querySelectorAll('.widget').forEach(w => { w.draggable = editMode; });
  const btn = document.querySelector('[onclick="toggleEditMode()"]');
  if (btn) btn.textContent = editMode ? '\u2713 Done' : '\u2726 Customize';
}

function togHToday(k, v) { hChecks[k] = v; S.set('hChecks', hChecks); }

// ===== PROFILE PHOTO =====
function renderProfilePhoto() {
  const photo = S.get('profilePhoto');
  const containers = ['sb-photo-container', 'hero-profile'];
  containers.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (photo) {
      el.innerHTML = `<img src="${photo}" alt="Profile">`;
    } else {
      el.innerHTML = id === 'hero-profile' ? '<span>\ud83d\udc1a</span>' : '<span class="sb-photo-placeholder">\ud83d\udc1a</span>';
    }
  });
}

function triggerProfilePhoto() { document.getElementById('profile-file').click(); }
document.getElementById && window.addEventListener('load', () => {
  document.getElementById('profile-file')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => { S.set('profilePhoto', ev.target.result); renderProfilePhoto(); };
    r.readAsDataURL(file);
    this.value = '';
  });

  document.getElementById('scrap-file')?.addEventListener('change', function (e) {
    const files = Array.from(e.target.files);
    let done = 0;
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        photos.push(ev.target.result);
        done++;
        if (done === files.length) { S.set('photos', photos); renderScrapbook(); }
      };
      r.readAsDataURL(f);
    });
    this.value = '';
  });

  document.getElementById('journal-photo-file')?.addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    let done = 0;
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        pendingJournalPhotos.push(ev.target.result);
        done++;
        if (done === files.length) {
          document.querySelectorAll('.journal-photo-count').forEach(el => {
            el.textContent = pendingJournalPhotos.length ? `📷 ${pendingJournalPhotos.length} photo(s)` : '';
          });
        }
      };
      r.readAsDataURL(f);
    });
    this.value = '';
  });
});

// ===== JOURNAL =====
let currentJTab = 'morning';
let selectedMoods = {};

function renderJournal() {
  const today = new Date().toLocaleDateString('sv-SE');
  document.getElementById('journal-date-label').textContent = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  loadJournalDay(today);
  renderDiaryList();
  renderSbRecentNotes();
}

function loadJournalDay(date) {
  ['morning', 'night', 'thought'].forEach(type => {
    const entry = diary.find(e => e.date === date && e.type === type);
    const ta = document.getElementById(`${type}-ta`);
    if (ta) ta.value = entry ? entry.content : '';
    if (type === 'night') {
      const gtf = document.getElementById('night-grateful');
      if (gtf) gtf.value = entry ? (entry.grateful || '') : '';
    }
    if (entry?.mood) setMoodDisplay(type, entry.mood);
  });
}

function setJTab(tab, btn) {
  currentJTab = tab;
  document.querySelectorAll('.jtab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.journal-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('jpanel-' + tab)?.classList.add('active');
}

function setMood(type, emoji) {
  selectedMoods[type] = emoji;
  setMoodDisplay(type, emoji);
}

function setMoodDisplay(type, emoji) {
  document.querySelectorAll(`#${type}-mood .mood-e`).forEach(e => {
    e.classList.toggle('selected', e.textContent === emoji);
  });
}

function saveJournalEntry(type) {
  const today = new Date().toLocaleDateString('sv-SE');
  const ta = document.getElementById(`${type}-ta`);
  const content = ta ? ta.value.trim() : '';
  if (!content && type !== 'thought') return;
  const titleInput = document.getElementById(`${type}-title-input`);
  const customTitle = titleInput ? titleInput.value.trim() : '';
  const entry = {
    id: Date.now(),
    title: customTitle || (type === 'morning' ? 'Morning \u00b7 ' + today : type === 'night' ? 'Night \u00b7 ' + today : content.slice(0, 40)),
    date: today,
    type,
    mood: selectedMoods[type] || '',
    content,
    grateful: type === 'night' ? (document.getElementById('night-grateful')?.value.trim() || '') : '',
    photos: [...pendingJournalPhotos]
  };
  const idx = diary.findIndex(e => e.date === today && e.type === type);
  if (idx >= 0) diary[idx] = { ...diary[idx], ...entry };
  else diary.unshift(entry);
  S.set('diary', diary);
  if (ta) ta.value = '';
  if (type === 'night') {
    const grateful = document.getElementById('night-grateful');
    if (grateful) grateful.value = '';
  }
  document.querySelectorAll(`#${type}-mood .mood-e`).forEach(e => e.classList.remove('selected'));
  selectedMoods[type] = '';
  if (titleInput) titleInput.value = '';
  pendingJournalPhotos = [];
  document.querySelectorAll('.journal-photo-count').forEach(el => { el.textContent = ''; });
  renderDiaryList();
  const btn = event?.target;
  if (btn) { const orig = btn.textContent; btn.textContent = 'Saved \u2713'; setTimeout(() => btn.textContent = orig, 1500); }
}

function renderDiaryList() {
  const el = document.getElementById('diary-list');
  if (!el) return;
  const moodClass = m => ({ '\ud83d\ude0a': 'mood-happy', '\ud83d\ude0c': 'mood-calm', '\ud83d\ude34': 'mood-tired', '\ud83d\ude24': 'mood-stressed', '\ud83d\ude29': 'mood-stressed', '\ud83e\udd70': 'mood-happy', '\ud83d\ude2d': 'mood-calm' }[m] || 'mood-calm');
  el.innerHTML = diary.map((e, i) => `
    <div class="diary-card" onclick="openDiaryEntry(${i})">
      <div class="diary-card-head">
        <div>
          <div class="diary-title">${escHtml(e.title)}</div>
          <div class="diary-date">${e.date}${e.type ? ' \u00b7 ' + e.type : ''}</div>
        </div>
        <span class="mood-tag ${moodClass(e.mood)}">${e.mood || ''} ${e.type || 'entry'}</span>
      </div>
      <div class="diary-preview">${escHtml((e.content || '').slice(0, 110))}${(e.content || '').length > 110 ? '\u2026' : ''}</div>
      ${e.photos && e.photos.length ? `<div style="display:flex;gap:4px;padding:6px 14px;flex-wrap:wrap">${e.photos.map(p => `<img src="${p}" style="height:48px;width:48px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">`).join('')}</div>` : ''}
    </div>
  `).join('') || '<div style="color:var(--tl);font-style:italic;font-size:13px">No entries yet.</div>';
}

function openDiaryEntry(i) { curDiary = diary[i]; loadDiaryEntry(diary[i]); }

function loadDiaryEntry(e) {
  document.getElementById('de-title').textContent = e.title;
  document.getElementById('de-date').value = e.date || '';
  document.getElementById('de-mood-sel').value = e.mood || '';
  document.getElementById('de-type').value = e.type || 'night';
  document.getElementById('de-content').value = e.content || '';
  document.getElementById('de-grateful').value = e.grateful || '';
  nav('diary-entry');
}

function saveDiaryEntry() {
  if (!curDiary) return;
  curDiary.title = document.getElementById('de-title').textContent;
  curDiary.date = document.getElementById('de-date').value;
  curDiary.mood = document.getElementById('de-mood-sel').value;
  curDiary.type = document.getElementById('de-type').value;
  curDiary.content = document.getElementById('de-content').value;
  curDiary.grateful = document.getElementById('de-grateful').value;
  const idx = diary.findIndex(e => e.id === curDiary.id);
  if (idx >= 0) diary[idx] = curDiary;
  else diary.unshift(curDiary);
  S.set('diary', diary);
  nav('journal');
}

function openNewDiaryModal() { openModal('m-diary'); }

function createDiaryEntry() {
  const title = document.getElementById('md-title').value.trim() || "Today's Thoughts";
  const type = document.getElementById('md-type').value;
  curDiary = { id: Date.now(), title, mood: '', type, date: new Date().toLocaleDateString('sv-SE'), content: '', grateful: '' };
  closeModal('m-diary');
  loadDiaryEntry(curDiary);
}

// ===== HABITS =====
function getWeekDates(off) {
  const n = new Date();
  let d = n.getDay(); d = d === 0 ? 6 : d - 1;
  const m = new Date(n);
  m.setDate(n.getDate() - d + off * 7);
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(m); x.setDate(m.getDate() + i); return x; });
}

function hKey(id, d) {
  const date = d instanceof Date ? d.toLocaleDateString('sv-SE') : d;
  return id + '_' + date;
}

function renderHabits() {
  const days = getWeekDates(hWkOff);
  document.getElementById('habits-week-lbl').textContent = `${days[0].getDate()} ${MONTHS_SV[days[0].getMonth()].toLowerCase()} \u2013 ${days[6].getDate()} ${MONTHS_SV[days[6].getMonth()].toLowerCase()} ${days[0].getFullYear()}`;

  let html = `<thead><tr>
    <th>Habits</th>
    ${DAYS_SV.map((d, i) => `<th>${d}<br><span style="font-weight:400;font-size:9px">${days[i].getDate()}.${days[i].getMonth() + 1}</span></th>`).join('')}
  </tr></thead><tbody>`;

  habits.forEach(h => {
    html += `<tr><td><span style="margin-right:6px">${h.emoji}</span>${escHtml(h.name)}</td>`;
    days.forEach(day => {
      const k = hKey(h.id, day);
      html += `<td><input type="checkbox" class="hcb" ${hChecks[k] ? 'checked' : ''} onchange="togH('${k}',this.checked)"></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  document.getElementById('habits-tbl').innerHTML = html;
  updateHPct(days);
}

function togH(k, v) { hChecks[k] = v; S.set('hChecks', hChecks); updateHPct(getWeekDates(hWkOff)); }

function updateHPct(days) {
  let done = 0, total = habits.length * 7;
  days.forEach(d => habits.forEach(h => { if (hChecks[hKey(h.id, d)]) done++; }));
  const pct = total ? Math.round(done / total * 100) : 0;
  document.getElementById('hab-fill').style.width = pct + '%';
  document.getElementById('hab-pct').textContent = pct + '% this week';
}

function hWeek(d) { hWkOff += d; renderHabits(); }

function addHabit() {
  const name = document.getElementById('mh-name').value.trim();
  const emoji = document.getElementById('mh-emoji').value.trim() || '\u2b50';
  if (!name) return;
  habits.push({ id: Date.now(), name, emoji });
  S.set('habits', habits);
  closeModal('m-habit');
  renderHabits();
}

function deleteHabit(id) {
  habits = habits.filter(h => h.id !== id);
  S.set('habits', habits);
  renderHabits();
}

// ===== BUDGET =====
function renderBudget() {
  let inc = 0, exp = 0, sav = 0;
  budget.forEach(b => { if (b.dir === 'income') inc += b.amount; else if (b.dir === 'expense') exp += b.amount; else sav += b.amount; });
  const bal = inc - exp - sav;
  document.getElementById('bi-total').textContent = '+' + fmtKr(inc);
  document.getElementById('be-total').textContent = '-' + fmtKr(exp + sav);
  document.getElementById('bb-total').textContent = fmtKr(bal);

  const dirMap = { income: ['tag-income', 'Inkomst'], expense: ['tag-expense', 'Utgift'], saving: ['tag-saving', 'Sparande'] };
  document.getElementById('bud-tbody').innerHTML = budget.map(b => {
    const net = b.dir === 'income' ? b.amount : -b.amount;
    const [cls, lbl] = dirMap[b.dir];
    return `<tr>
      <td>${escHtml(b.name)}</td>
      <td>${fmtKr(b.amount)}</td>
      <td><span class="tag ${cls}">${lbl}</span></td>
      <td><span class="tag tag-cat">${escHtml(b.cat)}</span></td>
      <td class="${net > 0 ? 'amount-pos' : 'amount-neg'}">${net > 0 ? '+' : ''}${fmtKr(net)}</td>
      <td><button onclick="deleteBudget(${b.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px">\u2715</button></td>
    </tr>`;
  }).join('');
}

function addBudget() {
  const name = document.getElementById('mb-name').value.trim();
  const amount = parseFloat(document.getElementById('mb-amount').value) || 0;
  const dir = document.getElementById('mb-dir').value;
  const cat = document.getElementById('mb-cat').value.trim() || '\u00d6vrigt';
  if (!name) return;
  budget.push({ id: Date.now(), name, amount, dir, cat });
  S.set('budget', budget);
  closeModal('m-budget');
  renderBudget();
}

function deleteBudget(id) {
  budget = budget.filter(b => b.id !== id);
  S.set('budget', budget);
  renderBudget();
}

function fmtKr(n) { return n.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' kr'; }

// ===== STUDY / POMODORO =====
function renderStudy() {
  renderStudyNotesList();
  pomRender();
}

function pomMode(mode, mins, btn) {
  pomReset();
  pom.mode = mode; pom.total = mins * 60; pom.rem = mins * 60;
  document.querySelectorAll('.pom-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const lbs = { work: 'Focus time', short: 'Short break', long: 'Long break' };
  document.getElementById('pom-label').textContent = lbs[mode];
  pomRender();
}

function pomToggle() {
  if (pom.running) {
    clearInterval(pom.int);
    pom.running = false;
    document.getElementById('pom-btn').textContent = '\u25b6 Resume';
  } else {
    pom.running = true;
    document.getElementById('pom-btn').textContent = '\u23f8 Pause';
    pom.int = setInterval(() => {
      pom.rem--;
      if (pom.rem <= 0) {
        clearInterval(pom.int);
        pom.running = false;
        if (pom.mode === 'work') {
          pom.ses++;
          pom.mins += Math.floor(pom.total / 60);
          document.getElementById('pom-ses').textContent = pom.ses;
          document.getElementById('pom-mins').textContent = pom.mins + 'm';
          const dots = document.querySelectorAll('.pom-dot');
          if (dots[(pom.ses - 1) % 4]) dots[(pom.ses - 1) % 4].classList.add('done');
        }
        pom.rem = 0;
        document.getElementById('pom-btn').textContent = '\u25b6 Start';
        pomRender();
        return;
      }
      pomRender();
    }, 1000);
  }
}

function pomReset() {
  clearInterval(pom.int);
  pom.running = false;
  pom.rem = pom.total;
  document.getElementById('pom-btn').textContent = '\u25b6 Start';
  pomRender();
}

function pomRender() {
  const m = Math.floor(pom.rem / 60).toString().padStart(2, '0');
  const s = (pom.rem % 60).toString().padStart(2, '0');
  const disp = document.getElementById('pom-display');
  if (disp) disp.textContent = `${m}:${s}`;
  const p = pom.total ? pom.rem / pom.total : 1;
  const arc = document.getElementById('pom-arc');
  if (arc) arc.style.strokeDashoffset = 251.3 * (1 - p);
  const pctEl = document.getElementById('pom-pct');
  if (pctEl) pctEl.textContent = Math.round(p * 100) + '%';
}

// ===== NOTES (Cornell) =====
function renderNotes() {
  const el = document.getElementById('notes-grid');
  if (!el) return;
  if (!notes.length) {
    el.innerHTML = '<div style="color:var(--tl);font-style:italic;font-size:13px;padding:12px 0">No notes yet. Create your first Cornell note.</div>';
    return;
  }
  el.innerHTML = notes.map(n => `
    <div class="note-card" onclick="openNote(${n.id})">
      <div class="note-card-thumb">\ud83d\udcdd</div>
      <div class="note-card-body">
        <div class="note-card-title">${escHtml(n.title)}</div>
        <div class="note-card-meta">${escHtml(n.class || 'General')} \u00b7 ${n.date || ''}</div>
      </div>
    </div>
  `).join('');
}

function renderStudyNotesList() {
  const el = document.getElementById('study-notes-list');
  if (!el) return;
  if (!notes.length) { el.innerHTML = '<div style="color:var(--tl);font-style:italic;font-size:13px">No notes yet.</div>'; return; }
  el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap">
    ${notes.slice(0, 10).map(n => `<span style="background:var(--cream);border:1px solid var(--border);border-radius:5px;padding:5px 11px;font-size:12px;cursor:pointer;color:var(--tm)" onclick="openNote(${n.id})">${escHtml(n.title)}</span>`).join('')}
  </div>`;
}

function renderSbRecentNotes() {
  const el = document.getElementById('sb-recent-notes');
  if (!el) return;
  el.innerHTML = notes.slice(0, 4).map(n => `
    <div class="sb-item" onclick="openNote(${n.id})">
      <span class="sb-icon">\ud83d\udcdd</span> ${escHtml(n.title.slice(0, 20))}${n.title.length > 20 ? '\u2026' : ''}
    </div>
  `).join('') || '<div style="font-size:11px;color:var(--tl);padding:4px 14px">No notes yet</div>';
}

function openNewNote() {
  document.getElementById('mn-date').value = new Date().toLocaleDateString('sv-SE');
  document.getElementById('mn-title').value = '';
  document.getElementById('mn-class').value = '';
  openModal('m-note');
}

function createNote() {
  const title = document.getElementById('mn-title').value.trim() || 'Untitled Note';
  const cls = document.getElementById('mn-class').value.trim();
  const date = document.getElementById('mn-date').value;
  curNote = { id: Date.now(), title, class: cls, date, cues: '', notes: '', summary: '', mood: '\u2728' };
  closeModal('m-note');
  loadNote(curNote);
}

function openNote(id) { const n = notes.find(n => n.id === id); if (n) { curNote = n; loadNote(n); } }

function loadNote(n) {
  document.getElementById('note-title').textContent = n.title;
  document.getElementById('note-tag').textContent = n.class || 'Note';
  document.getElementById('note-date').value = n.date || '';
  document.getElementById('note-class').value = n.class || '';
  document.getElementById('note-mood').value = n.mood || '\u2728';
  document.getElementById('note-cues').value = n.cues || '';
  document.getElementById('note-notes').value = n.notes || '';
  document.getElementById('note-summary').value = n.summary || '';
  nav('note');
}

function saveNote() {
  if (!curNote) return;
  curNote.title = document.getElementById('note-title').textContent;
  curNote.class = document.getElementById('note-class').value;
  curNote.date = document.getElementById('note-date').value;
  curNote.mood = document.getElementById('note-mood').value;
  curNote.cues = document.getElementById('note-cues').value;
  curNote.notes = document.getElementById('note-notes').value;
  curNote.summary = document.getElementById('note-summary').value;
  const idx = notes.findIndex(n => n.id === curNote.id);
  if (idx >= 0) notes[idx] = curNote;
  else notes.unshift(curNote);
  S.set('notes', notes);
  nav('notes');
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  S.set('notes', notes);
}

// ===== PLANNER =====
function renderPlanner() {
  renderCal();
  renderSchedule();
  renderPlannerBudgetSnap();
  renderPinterestBoard();
}

function renderPlannerBudgetSnap() {
  const el = document.getElementById('planner-bud-snap');
  if (!el) return;
  let inc = 0, exp = 0, sav = 0;
  budget.forEach(b => { if (b.dir === 'income') inc += b.amount; else if (b.dir === 'expense') exp += b.amount; else sav += b.amount; });
  const bal = inc - exp - sav;
  el.innerHTML = `<div class="card-body" style="font-size:13px">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--tl)">Inkomst</span><span class="income-color">+${fmtKr(inc)}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="color:var(--tl)">Utgifter</span><span class="expense-color">-${fmtKr(exp + sav)}</span></div>
    <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border)"><span><strong>Balans</strong></span><span class="balance-color" style="font-weight:700">${fmtKr(bal)}</span></div>
    <button class="btn-link" style="margin-top:10px;width:100%;text-align:center" onclick="nav('budget')">View full budget \u2192</button>
  </div>`;
}

function renderCal() {
  const el = document.getElementById('cal-grid-main');
  if (!el) return;
  document.getElementById('cal-title-main').textContent = MONTHS_SV[calM] + ' ' + calY;
  const now = new Date();
  let html = DAYS_SV.map(d => `<div class="cal-dh">${d}</div>`).join('');
  let dow = new Date(calY, calM, 1).getDay();
  dow = dow === 0 ? 6 : dow - 1;
  const dim = new Date(calY, calM + 1, 0).getDate();
  for (let i = 0; i < dow; i++) html += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= dim; d++) {
    const isT = d === now.getDate() && calM === now.getMonth() && calY === now.getFullYear();
    const hasManualEv = calManualEvents.some(e => {
      const ed = new Date(e.date);
      return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY;
    });
    const hasEv = hasManualEv || gcalEvents.some(e => {
      const ed = new Date(e.start?.dateTime || e.start?.date);
      return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY;
    });
    html += `<div class="cal-day${isT ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="openAddCalEvent(${d},${calM},${calY})">${d}</div>`;
  }
  el.innerHTML = html;

  // Show month events below calendar
  const monthEvents = calManualEvents.filter(e => {
    const ed = new Date(e.date);
    return ed.getMonth() === calM && ed.getFullYear() === calY;
  });
  const evEl = document.getElementById('cal-events-list');
  if (evEl) {
    evEl.innerHTML = monthEvents.length ? monthEvents.map(e =>
      `<div class="cal-event-item"><span>📅 ${e.date.slice(5)} · ${escHtml(e.title)}</span>
       <button onclick="removeCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button></div>`
    ).join('') : '<div style="font-size:12px;color:var(--tl);font-style:italic">Click any day to add an event</div>';
  }

  renderGCalEvents();
}

// ===== CLASS SCHEDULE =====
function renderSchedule() {
  const el = document.getElementById('schedule-container');
  if (!el) return;
  if (!schedule.length) {
    el.innerHTML = '<div class="card"><div class="card-body" style="color:var(--tl);font-style:italic;font-size:13px">No schedule yet. Click + Week to add one.</div></div>';
    return;
  }
  const DAY_NAMES = ['M\u00e5n', 'Tis', 'Ons', 'Tor', 'Fre'];
  let html = '<div class="card"><div style="padding:0"><table class="sched"><tr><th>V</th>' +
    DAY_NAMES.map(d => `<th>${d}</th>`).join('') +
    (schedEditMode ? '<th></th>' : '') + '</tr>';

  schedule.forEach(week => {
    html += `<tr><td class="week-num">${escHtml(week.week)}</td>`;
    (week.days || []).forEach((day, dayIdx) => {
      html += `<td><span class="sched-date">${escHtml(day.date)}</span>`;
      (day.classes || []).forEach((cls, clsIdx) => {
        html += `<span class="class-pill">${escHtml(cls)}`;
        if (schedEditMode) {
          html += `<button onclick="removeScheduleClass(${week.id},${dayIdx},${clsIdx})" class="sched-pill-del" title="Remove">\u2715</button>`;
        }
        html += '</span>';
      });
      if (schedEditMode) {
        html += `<button onclick="openAddSchedClass(${week.id},${dayIdx})" class="sched-add-cls-btn">+ class</button>`;
      }
      html += '</td>';
    });
    if (schedEditMode) {
      html += `<td><button onclick="removeScheduleWeek(${week.id})" class="sched-del-week" title="Remove week">\u2715</button></td>`;
    }
    html += '</tr>';
  });

  html += '</table></div></div>';
  el.innerHTML = html;
}

function toggleSchedEditMode() {
  schedEditMode = !schedEditMode;
  const btn = document.getElementById('sched-edit-btn');
  if (btn) btn.textContent = schedEditMode ? '\u2713 Done' : '\u270e Edit';
  renderSchedule();
}

let pendingSchedWeekId = null, pendingSchedDayIdx = null;

function openAddSchedClass(weekId, dayIdx) {
  pendingSchedWeekId = weekId;
  pendingSchedDayIdx = dayIdx;
  const week = schedule.find(w => w.id === weekId);
  const day = week?.days[dayIdx];
  const lbl = document.getElementById('ms-context');
  if (lbl) lbl.textContent = week ? `${week.week} \u00b7 ${['M\u00e5n','Tis','Ons','Tor','Fre'][dayIdx] || ''} ${day?.date || ''}` : '';
  document.getElementById('ms-label').value = '';
  openModal('m-sched');
}

function addScheduleClass() {
  const label = document.getElementById('ms-label').value.trim();
  if (!label || pendingSchedWeekId === null) return;
  const week = schedule.find(w => w.id === pendingSchedWeekId);
  if (!week || !week.days[pendingSchedDayIdx]) return;
  week.days[pendingSchedDayIdx].classes.push(label);
  S.set('schedule', schedule);
  closeModal('m-sched');
  renderSchedule();
}

function removeScheduleClass(weekId, dayIdx, clsIdx) {
  const week = schedule.find(w => w.id === weekId);
  if (!week || !week.days[dayIdx]) return;
  week.days[dayIdx].classes.splice(clsIdx, 1);
  S.set('schedule', schedule);
  renderSchedule();
}

function openAddSchedWeek() {
  ['msw-week','msw-d0','msw-d1','msw-d2','msw-d3','msw-d4'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  openModal('m-sched-week');
}

function addScheduleWeek() {
  const weekLabel = document.getElementById('msw-week').value.trim();
  if (!weekLabel) return;
  const dates = ['msw-d0','msw-d1','msw-d2','msw-d3','msw-d4'].map(id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  });
  const days = dates.map(date => ({ date, classes: [] }));
  schedule.push({ id: Date.now(), week: weekLabel, days });
  S.set('schedule', schedule);
  closeModal('m-sched-week');
  renderSchedule();
}

function removeScheduleWeek(id) {
  schedule = schedule.filter(w => w.id !== id);
  S.set('schedule', schedule);
  renderSchedule();
}

// ===== SCRAPBOOK =====
function renderScrapbook() {
  const el = document.getElementById('scrapbook-main');
  if (!el) return;
  let html = photos.map((p, i) => `
    <div class="scrap-slot">
      <img src="${p}" alt="photo">
      <button class="scrap-del" onclick="delScrap(${i})">\u2715</button>
    </div>
  `).join('');
  html += `<div class="scrap-slot" onclick="addScrap()"><div class="scrap-hint"><span class="plus">\uff0b</span>Add Photo</div></div>`;
  el.innerHTML = html;
}

function addScrap() { document.getElementById('scrap-file').click(); }

function delScrap(i) { photos.splice(i, 1); S.set('photos', photos); renderScrapbook(); }

// ===== RADIO =====
function toggleRadio() {
  radioOpen = !radioOpen;
  const player = document.getElementById('radio-player');
  player.classList.toggle('open', radioOpen);
  if (radioOpen) renderRadio();
}

function renderRadio() {
  const el = document.getElementById('radio-stations');
  if (!el) return;
  el.innerHTML = radioStations.map((s, i) => `
    <span class="radio-stn-wrap">
      <button class="radio-stn${currentStation === i ? ' playing' : ''}" onclick="playStation(${i})">${escHtml(s.name)}</button>${radioEditMode ? `<button onclick="removeRadioStation(${i})" class="radio-stn-del" title="Remove">\u2715</button>` : ''}
    </span>
  `).join('');
  const editBtn = document.getElementById('radio-edit-btn');
  if (editBtn) editBtn.textContent = radioEditMode ? '\u2713' : '\u2699\ufe0f';
  const editArea = document.getElementById('radio-edit-area');
  if (editArea) editArea.style.display = radioEditMode ? 'block' : 'none';
}

function toggleRadioEditMode() {
  radioEditMode = !radioEditMode;
  renderRadio();
}

function playStation(i) {
  currentStation = i;
  const audio = document.getElementById('radio-audio');
  const stn = radioStations[i];
  if (!stn) return;
  audio.src = stn.url;
  audio.volume = parseFloat(document.getElementById('radio-vol')?.value || 0.7);
  audio.play().catch(() => {});
  document.getElementById('radio-name').textContent = stn.name;
  document.getElementById('radio-stream').textContent = 'Playing...';
  document.getElementById('radio-btn').textContent = '\u23f8';
  document.querySelectorAll('.radio-stn').forEach((b, j) => b.classList.toggle('playing', j === i));
}

function addRadioStation() {
  const name = document.getElementById('radio-new-name').value.trim();
  const url = document.getElementById('radio-new-url').value.trim();
  if (!name || !url) return;
  radioStations.push({ name, url });
  S.set('radioStations', radioStations);
  document.getElementById('radio-new-name').value = '';
  document.getElementById('radio-new-url').value = '';
  renderRadio();
}

function removeRadioStation(i) {
  if (currentStation === i) {
    const audio = document.getElementById('radio-audio');
    if (audio) { audio.pause(); audio.src = ''; }
    currentStation = null;
    document.getElementById('radio-name').textContent = 'Radio';
    document.getElementById('radio-stream').textContent = 'Select a station';
    document.getElementById('radio-btn').textContent = '\u25b6';
  } else if (currentStation !== null && currentStation > i) {
    currentStation--;
  }
  radioStations.splice(i, 1);
  S.set('radioStations', radioStations);
  renderRadio();
}

function radioToggle() {
  const audio = document.getElementById('radio-audio');
  if (!audio) return;
  if (audio.paused) {
    if (currentStation !== null) audio.play().catch(() => {});
    document.getElementById('radio-btn').textContent = '\u23f8';
  } else {
    audio.pause();
    document.getElementById('radio-btn').textContent = '\u25b6';
  }
}

window.addEventListener('load', () => {
  const vol = document.getElementById('radio-vol');
  vol?.addEventListener('input', () => {
    const audio = document.getElementById('radio-audio');
    if (audio) audio.volume = parseFloat(vol.value);
  });
});

// ===== GOOGLE CALENDAR =====
// Uses Google Identity Services (GIS) token client – no backend required.
// Token is in-memory only (expires after 1 h). gcalClientId is persisted.

function toggleGCal() {
  if (!gcalClientId) {
    openModal('m-gcal');
  } else if (gcalToken) {
    if (confirm('Disconnect Google Calendar?')) {
      gcalToken = null;
      gcalClientId = '';
      S.set('gcalClientId', '');
      gcalEvents = [];
      updateGCalBtnUI(false);
      renderGCalEvents();
    }
  } else {
    // clientId set but token expired/missing – re-authenticate
    startGCalAuth();
  }
}

function updateGCalBtnUI(connected) {
  const btn = document.getElementById('sb-gcal-btn');
  if (!btn) return;
  btn.textContent = connected ? '\u2713 Google Cal' : '\ud83d\udcc5 Google Cal';
  btn.classList.toggle('connected', !!connected);
}

function saveGCalClientId() {
  const id = document.getElementById('gcal-client-id').value.trim();
  if (!id) return;
  gcalClientId = id;
  S.set('gcalClientId', id);
  closeModal('m-gcal');
  startGCalAuth();
}

function startGCalAuth() {
  if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
    alert('Google Sign-In library is still loading. Please try again in a moment.');
    return;
  }
  const client = google.accounts.oauth2.initTokenClient({
    client_id: gcalClientId,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    callback: resp => {
      if (resp.error) { console.error('GCal auth error:', resp.error); return; }
      gcalToken = resp.access_token;
      updateGCalBtnUI(true);
      fetchGCalEvents();
    }
  });
  client.requestAccessToken();
}

function tryGCalSilentAuth() {
  if (!gcalClientId) return;
  if (typeof google === 'undefined' || !google?.accounts?.oauth2) {
    setTimeout(tryGCalSilentAuth, 800);
    return;
  }
  const client = google.accounts.oauth2.initTokenClient({
    client_id: gcalClientId,
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    prompt: '',
    callback: resp => {
      if (!resp.error && resp.access_token) {
        gcalToken = resp.access_token;
        updateGCalBtnUI(true);
        fetchGCalEvents();
      }
    }
  });
  client.requestAccessToken();
}

async function fetchGCalEvents() {
  if (!gcalToken) return;
  const now = new Date();
  const min = now.toISOString();
  const max = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${min}&timeMax=${max}&singleEvents=true&orderBy=startTime&maxResults=20`, {
      headers: { Authorization: 'Bearer ' + gcalToken }
    });
    if (res.status === 401) {
      gcalToken = null;
      updateGCalBtnUI(false);
      renderGCalEvents();
      return;
    }
    const data = await res.json();
    gcalEvents = data.items || [];
    renderGCalEvents();
  } catch (e) { console.error('GCal fetch error', e); }
}

function renderGCalEvents() {
  const el = document.getElementById('gcal-events');
  if (!el) return;

  let html = '';

  // Manual events always shown
  const today = new Date();
  const upcomingManual = manualGcalEvents
    .filter(e => new Date(e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  if (!gcalToken) {
    if (!upcomingManual.length) {
      html = '<div class="gcal-widget-empty">Not connected. Add events manually or connect Google Cal in the sidebar.</div>';
    }
  } else {
    if (!gcalEvents.length && !upcomingManual.length) {
      html = '<div class="gcal-widget-empty">No upcoming events.</div>';
    } else {
      const upcoming = gcalEvents.filter(e => {
        const d = new Date(e.start?.dateTime || e.start?.date);
        return d >= today;
      }).slice(0, 5);
      html += upcoming.map(e => {
        const start = new Date(e.start?.dateTime || e.start?.date);
        const time = e.start?.dateTime
          ? start.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
          : start.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
        return `<div class="gcal-event"><div class="gcal-event-time">${time}</div><div class="gcal-event-title">${escHtml(e.summary || 'Event')}</div></div>`;
      }).join('');
    }
  }

  // Manual events
  html += upcomingManual.map(e =>
    `<div class="gcal-event" style="border-color:var(--warm)">
      <div class="gcal-event-time">${e.date}${e.time ? ' · ' + e.time : ''}</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="gcal-event-title">${escHtml(e.title)}</div>
        <button onclick="removeManualGcalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:10px">✕</button>
      </div>
    </div>`
  ).join('');

  html += `<button class="btn-link" style="width:100%;margin-top:8px;text-align:center;font-size:12px" onclick="openAddManualGcalEvent()">+ Add Event</button>`;

  el.innerHTML = html;
}

// ===== CALENDAR MANUAL EVENTS =====
function openAddCalEvent(day, month, year) {
  pendingCalDate = { day, month, year };
  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  document.getElementById('mce-date').value = dateStr;
  document.getElementById('mce-title').value = '';
  openModal('m-cal-event');
}

function addCalEvent() {
  const title = document.getElementById('mce-title').value.trim();
  const date = document.getElementById('mce-date').value;
  if (!title || !date) return;
  calManualEvents.push({ id: Date.now(), date, title });
  S.set('calManualEvents', calManualEvents);
  closeModal('m-cal-event');
  renderCal();
  renderWidgets();
}

function removeCalEvent(id) {
  calManualEvents = calManualEvents.filter(e => e.id !== id);
  S.set('calManualEvents', calManualEvents);
  renderCal();
  renderWidgets();
}

// ===== MANUAL GCAL EVENTS =====
function openAddManualGcalEvent() {
  document.getElementById('mgcal-title').value = '';
  document.getElementById('mgcal-date').value = new Date().toLocaleDateString('sv-SE');
  document.getElementById('mgcal-time').value = '';
  openModal('m-manual-gcal');
}

function addManualGcalEvent() {
  const title = document.getElementById('mgcal-title').value.trim();
  const date = document.getElementById('mgcal-date').value;
  const time = document.getElementById('mgcal-time').value;
  if (!title || !date) return;
  manualGcalEvents.push({ id: Date.now(), title, date, time });
  S.set('manualGcalEvents', manualGcalEvents);
  closeModal('m-manual-gcal');
  renderGCalEvents();
}

function removeManualGcalEvent(id) {
  manualGcalEvents = manualGcalEvents.filter(e => e.id !== id);
  S.set('manualGcalEvents', manualGcalEvents);
  renderGCalEvents();
}

// ===== PINTEREST =====
function savePinterestBoard() {
  const url = document.getElementById('pin-url').value.trim();
  if (!url) return;
  pinterestBoardUrl = url;
  S.set('pinterestBoard', url);
  closeModal('m-pinterest');
  renderPinterestBoard();
}

function renderPinterestBoard() {
  const el = document.getElementById('pinterest-body');
  if (!el) return;
  if (!pinterestBoardUrl) {
    el.innerHTML = '<div class="gcal-widget-empty">No board set. Click "Set Board" to connect your Pinterest.</div>';
    return;
  }
  el.innerHTML = `
    <a href="${escHtml(pinterestBoardUrl)}" target="_blank"
       style="display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--td);font-size:13px;padding:8px 0">
      <span style="font-size:20px">📌</span>
      <div>
        <div style="font-weight:600">View Pinterest Board</div>
        <div style="font-size:11px;color:var(--tl)">${escHtml(pinterestBoardUrl.replace('https://www.pinterest.com/','').replace(/\/$/,''))}</div>
      </div>
      <span style="margin-left:auto;color:var(--tl)">→</span>
    </a>
    <a data-pin-do="embedBoard"
       data-pin-board-width="220"
       data-pin-scale-height="180"
       data-pin-scale-width="60"
       href="${escHtml(pinterestBoardUrl)}">
    </a>
  `;
  if (window.PinUtils) window.PinUtils.build();
}

// ===== JOURNAL PHOTOS =====
function triggerJournalPhoto() {
  document.getElementById('journal-photo-file').click();
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

window.addEventListener('load', () => {
  document.querySelectorAll('.modal-bg').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});

// ===== SIDEBAR DATE =====
function updateSbDate() {
  const el = document.getElementById('sb-date');
  if (el) el.textContent = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
}

// ===== INIT =====
window.addEventListener('load', () => {
  updateSbDate();
  renderProfilePhoto();
  renderSbRecentNotes();

  document.querySelectorAll('.sb-item[data-view]').forEach(item => {
    item.addEventListener('click', () => nav(item.dataset.view));
  });

  // If clientId is saved, show connected state and try silent auth
  if (gcalClientId) {
    updateGCalBtnUI(true);
    setTimeout(tryGCalSilentAuth, 1000);
  }

  // Radio FAB
  document.getElementById('radio-fab').addEventListener('click', () => { toggleRadio(); if (radioOpen) renderRadio(); });

  renderScrapbook();
  renderPinterestBoard();
  nav('home');
});
