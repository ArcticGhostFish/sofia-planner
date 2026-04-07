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

// Calendar – always initialise to the current month/year
const _calInit = new Date();
let calY = _calInit.getFullYear(), calM = _calInit.getMonth();
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
let widgetOrder = S.get('widgetOrder') || ['nav', 'today', 'habits-today', 'upcoming', 'budget-mini', 'calendar-widget', 'scrapbook'];
let widgetSizes = S.get('widgetSizes') || { 'calendar-widget': 'md' };

// Moodboard
let moodboardImages = S.get('moodboardImages') || [];

// Hero sizes
let heroSizes = S.get('heroSizes') || {};

// Calendar manual events
let calManualEvents = S.get('calManualEvents') || [];
let pendingCalDate = null;

// Manual GCal events
let manualGcalEvents = S.get('manualGcalEvents') || [];

// Journal photos
let pendingJournalPhotos = [];

// Pinterest
let pinterestBoardUrl = S.get('pinterestBoard') || '';

// Header images per page
let headerImages = S.get('headerImages') || {};
let pendingHeaderView = null;

// Scrapbook
let scrapbookPhotos = S.get('scrapbookPhotos') || [];

// Classes (Study Hub)
let classes = S.get('classes') || [];
let classExams = S.get('classExams') || [];
let classGrades = S.get('classGrades') || [];
let activeClassId = null;
let activeClassSection = 'notes';

// Tasks
let tasks = S.get('tasks') || [];

// Dark mode
let darkMode = S.get('darkMode') || false;

// Calendar view
let calView = 'month'; // 'month' | 'week' | 'day'

// Notes search
let notesSearchQuery = '';

// Study time analytics log
let pomLog = S.get('pomLog') || {}; // { 'YYYY-MM-DD': { sessions, mins } }

// Habit heatmap toggle
let habitView = 'weekly'; // 'weekly' | 'heatmap'

// Class filter
let showArchivedClasses = false;

// Class editing
let editingClassId = null;

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
    today: renderToday,
    journal: renderJournal,
    habits: renderHabits,
    budget: renderBudget,
    study: renderStudy,
    notes: renderNotes,
    tasks: renderTasks,
    planner: renderPlanner,
    scrapbook: renderScrapbook,
  };
  if (fns[page]) fns[page]();
}

// ===== TODAY VIEW =====
function renderToday() {
  const now = new Date();
  const todayStr = now.toLocaleDateString('sv-SE');
  const titleEl = document.getElementById('today-view-title');
  if (titleEl) titleEl.textContent = now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  const body = document.getElementById('today-body');
  if (!body) return;

  // Today's events
  const todayEvs = calManualEvents.filter(e => e.date === todayStr);
  const gcalToday = gcalEvents.filter(e => { const d = new Date(e.start?.dateTime || e.start?.date); return d.toLocaleDateString('sv-SE') === todayStr; });
  const evHtml = [...todayEvs.map(e => `<div class="today-event-row"><span class="today-time-tag">${e.time || 'All day'}</span><span>${escHtml(e.title)}</span></div>`),
    ...gcalToday.map(e => { const h = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}) : 'All day'; return `<div class="today-event-row"><span class="today-time-tag">${h}</span><span>${escHtml(e.summary||'Event')}</span><span style="font-size:10px;color:var(--teal);margin-left:auto">GCal</span></div>`; })
  ].join('') || '<div style="font-size:13px;color:var(--tl);font-style:italic">No events today</div>';

  // Habits
  const habitHtml = habits.slice(0, 8).map(h => {
    const k = hKey(h.id, todayStr);
    return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
      <input type="checkbox" class="hcb" ${hChecks[k] ? 'checked' : ''} onchange="togHToday('${k}',this.checked)" style="accent-color:var(--teal);width:16px;height:16px;cursor:pointer">
      <span style="font-size:13px;color:var(--tm)">${h.emoji} ${escHtml(h.name)}</span>
    </div>`;
  }).join('') || '<div style="font-size:13px;color:var(--tl);font-style:italic">No habits set up</div>';

  // Tasks due today or overdue
  const overdue = tasks.filter(t => !t.done && t.due && t.due <= todayStr);
  const taskHtml = overdue.length
    ? overdue.map(t => `<div class="today-event-row"><span style="font-size:10px;font-weight:700;color:${t.due < todayStr ? 'var(--rose)' : 'var(--teal)'};min-width:54px">${t.due < todayStr ? 'OVERDUE' : 'TODAY'}</span><span>${escHtml(t.title)}</span></div>`).join('')
    : '<div style="font-size:13px;color:var(--tl);font-style:italic">No tasks due today</div>';

  // Next exam
  const nextExam = classExams.filter(e => !e.done && e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date))[0];
  const examHtml = nextExam
    ? (() => { const cls = classes.find(c => c.id === nextExam.classId); const days = Math.round((new Date(nextExam.date) - now) / 86400000); return `<div class="today-event-row"><span class="today-time-tag" style="color:${days <= 3 ? 'var(--rose)' : 'var(--teal)'}">in ${days}d</span><span>${escHtml(nextExam.title)}</span><span class="upcoming-cls" style="margin-left:auto">${cls ? escHtml(cls.name) : ''}</span></div>`; })()
    : '<div style="font-size:13px;color:var(--tl);font-style:italic">No upcoming exams</div>';

  body.innerHTML = `
    <div class="today-section"><div class="today-section-title">Events</div>${evHtml}</div>
    <div class="today-section"><div class="today-section-title">Habits</div>${habitHtml}</div>
    <div class="today-section"><div class="today-section-title">Tasks due today</div>${taskHtml}</div>
    <div class="today-section"><div class="today-section-title">Next exam</div>${examHtml}</div>
  `;
}

// ===== FAB =====
let fabOpen = false;
function toggleFab() {
  fabOpen = !fabOpen;
  const menu = document.getElementById('fab-menu');
  const btn = document.getElementById('fab-btn');
  if (menu) menu.classList.toggle('open', fabOpen);
  if (btn) btn.style.transform = fabOpen ? 'rotate(45deg)' : '';
}
function closeFab() { fabOpen = false; const menu = document.getElementById('fab-menu'); if (menu) menu.classList.remove('open'); const btn = document.getElementById('fab-btn'); if (btn) btn.style.transform = ''; }

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
  if (editMode) {
    grid.classList.add('edit-mode');
    // Add widget picker
    const ALL_WIDGETS = [
      { id: 'nav', label: '🐚 Navigate' },
      { id: 'today', label: '☀️ Today' },
      { id: 'habits-today', label: '✓ Habits Today' },
      { id: 'upcoming', label: '🗓 Upcoming Deadlines' },
      { id: 'budget-mini', label: '💰 Budget' },
      { id: 'calendar-widget', label: '📅 Calendar' },
      { id: 'scrapbook', label: '🖼️ Scrapbook' },
      { id: 'pinterest-widget', label: '📌 Pinterest' },
    ];
    const available = ALL_WIDGETS.filter(w => !widgetOrder.includes(w.id));
    if (available.length) {
      const picker = document.createElement('div');
      picker.className = 'widget-add-row';
      picker.innerHTML = '<span style="font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--tl)">+ Add widget</span>' +
        available.map(w => `<button class="widget-add-btn" onclick="addWidget('${w.id}')">${w.label}</button>`).join('');
      grid.appendChild(picker);
    }
  } else {
    grid.classList.remove('edit-mode');
  }
  initDragDrop();
  renderMoodboard();
}

function buildWidget(id) {
  const w = document.createElement('div');
  const sz = widgetSizes[id] || (id === 'calendar-widget' ? 'md' : 'sm');
  w.className = 'widget' + (sz === 'md' ? ' widget-wide' : sz === 'lg' ? ' widget-full' : '');
  w.dataset.widget = id;
  const handle = '<div class="widget-drag-handle" draggable="false">\u28bf</div>';
  const sizeBtns = `<div class="widget-size-btns">
    <button onclick="setWidgetSize('${id}','sm')" class="${sz==='sm'?'active':''}">S</button>
    <button onclick="setWidgetSize('${id}','md')" class="${sz==='md'?'active':''}">M</button>
    <button onclick="setWidgetSize('${id}','lg')" class="${sz==='lg'?'active':''}">L</button>
  </div><button class="widget-remove-btn" onclick="removeWidget('${id}')">✕</button>`;

  switch (id) {
    case 'nav':
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\udc1a Navigate</div><div class="home-nav-grid">
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
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\u2600\ufe0f Today at a Glance</div><div class="widget-body">
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
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\u2713 Habits Today <span style="font-size:10px;color:var(--tl)">${new Date().toLocaleDateString('sv-SE',{weekday:'short'})}</span></div>
        <div class="widget-body">${rows}
        <button class="btn-link" style="margin-top:8px;width:100%;text-align:center" onclick="nav('habits')">See all habits \u2192</button>
      </div>`;
      break;
    }

    case 'budget-mini': {
      let inc = 0, exp = 0, sav = 0;
      budget.forEach(b => { if (b.dir === 'income') inc += b.amount; else if (b.dir === 'expense') exp += b.amount; else sav += b.amount; });
      const bal = inc - exp - sav;
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\udcb0 Budget \u00b7 ${MONTHS_SV[new Date().getMonth()]} ${new Date().getFullYear()}</div><div class="widget-body">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px"><span style="color:var(--tl)">Inkomst</span><span class="income-color">+${fmtKr(inc)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px"><span style="color:var(--tl)">Utgifter</span><span class="expense-color">-${fmtKr(exp + sav)}</span></div>
        <div style="display:flex;justify-content:space-between;padding-top:6px;border-top:1px solid var(--border);font-size:14px"><span><strong>Balans</strong></span><span class="balance-color" style="font-weight:700">${fmtKr(bal)}</span></div>
        <button class="btn-link" style="margin-top:10px;width:100%;text-align:center" onclick="nav('budget')">View full budget \u2192</button>
      </div>`;
      break;
    }

    case 'calendar-widget': {
      const now = new Date();
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\udcc5 Calendar \u00b7 ${MONTHS_SV[calM]} ${calY}
        <div style="display:flex;gap:4px">
          <button class="cal-nb" onclick="calPrev();renderWidgets()">\u2039</button>
          <button class="cal-nb" onclick="calNext();renderWidgets()">\u203a</button>
        </div>
      </div><div class="widget-body">${buildCalHtml(now)}</div>`;
      break;
    }

    case 'scrapbook': {
      const preview = scrapbookPhotos.slice(0, 6);
      const grid2 = preview.map(p => `<img src="${escHtml(p.url)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px" onerror="this.style.display='none'">`).join('');
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\uddbc\ufe0f Scrapbook
        <button class="btn-link" onclick="openAddScrapPhoto()" style="font-size:11px">+ Add</button>
      </div>
      <div style="padding:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:6px;cursor:pointer" onclick="nav('scrapbook')">
        ${preview.length ? grid2 : '<div style=\'grid-column:1/4;text-align:center;padding:20px 0;font-size:13px;color:var(--tl)\'>No photos yet</div>'}
      </div>`;
      break;
    }

    case 'upcoming': {
      const todayStr2 = new Date().toLocaleDateString('sv-SE');
      const cutoff = new Date(Date.now() + 30 * 86400000).toLocaleDateString('sv-SE');
      const upItems = [];
      classExams.forEach(e => {
        if (!e.done && e.date >= todayStr2 && e.date <= cutoff) {
          const cls = classes.find(c => c.id === e.classId);
          const days = Math.round((new Date(e.date) - new Date()) / 86400000);
          upItems.push({ date: e.date, title: e.title, cls: cls ? cls.name : '', color: cls?.color || 'var(--teal)', days });
        }
      });
      upItems.sort((a, b) => a.date.localeCompare(b.date));
      const rows = upItems.slice(0, 5).map(i => `
        <div class="upcoming-row">
          <span class="upcoming-dot" style="background:${i.color}"></span>
          <div style="min-width:0;flex:1">
            <div style="font-size:13px;color:var(--td);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(i.title)}</div>
            <div class="upcoming-cls">${escHtml(i.cls)} · ${i.date.slice(5)}</div>
          </div>
          <span class="upcoming-days${i.days <= 3 ? ' urgent' : ''}">in ${i.days}d</span>
        </div>`).join('');
      w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\uddd3\ufe0f Upcoming Deadlines</div><div class="widget-body">
        ${rows || '<div style="font-size:13px;color:var(--tl);font-style:italic">No deadlines in the next 30 days</div>'}
        <button class="btn-link" style="margin-top:10px;width:100%;text-align:center" onclick="nav('study')">View all \u2192</button>
      </div>`;
      break;
    }

    case 'pinterest-widget': {
      if (!pinterestBoardUrl) {
        w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\udccc Pinterest</div>
          <div class="widget-body" style="text-align:center;padding:20px">
            <div style="font-size:13px;color:var(--tl);margin-bottom:12px">Connect your Pinterest board to see it here</div>
            <button class="btn-primary" onclick="openModal('m-pinterest')">+ Set Up Board</button>
          </div>`;
      } else {
        const boardName = pinterestBoardUrl.replace(/\/$/, '').split('/').slice(-2).join('/');
        w.innerHTML = `${handle}${sizeBtns}<div class="card-head">\ud83d\udccc Pinterest
          <a href="${escHtml(pinterestBoardUrl)}" target="_blank" class="btn-link" style="font-size:11px">Open \u2197</a>
        </div>
        <div class="widget-body" style="padding:10px">
          <a data-pin-do="embedBoard" data-pin-board-width="100%" data-pin-scale-height="240" data-pin-scale-width="80"
             href="${escHtml(pinterestBoardUrl)}"></a>
          <div style="margin-top:10px;display:flex;gap:8px">
            <a href="${escHtml(pinterestBoardUrl)}" target="_blank" class="btn-primary" style="text-decoration:none;font-size:12px;padding:5px 12px">View Board \u2197</a>
            <button class="btn-secondary" style="font-size:12px;padding:5px 12px" onclick="openModal('m-pinterest')">Change Board</button>
          </div>
        </div>`;
        setTimeout(() => { if (window.PinUtils) window.PinUtils.build(); }, 100);
      }
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
    // Collect event colors for this day
    const evColors = [];
    calManualEvents.filter(e => { const ed = new Date(e.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(e => { const cls = classes.find(c => e.classId === c.id); evColors.push(cls?.color || 'var(--warm)'); });
    gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(() => evColors.push('var(--teal)'));
    const dots = evColors.slice(0, 3).map(c => `<span class="cal-dot" style="background:${c}"></span>`).join('');
    html += `<div class="cal-day${isT ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="openAddCalEvent(${d},${calM},${calY})">${d}${dots ? `<div class="cal-dots">${dots}</div>` : ''}</div>`;
  }
  html += '</div>';
  return html;
}

function calPrev() {
  if (calView === 'week') { calWeekOff--; }
  else if (calView === 'day') { calDayNum = (calDayNum || 0) - 1; }
  else { calM--; if (calM < 0) { calM = 11; calY--; } }
  renderPlanner();
}
function calNext() {
  if (calView === 'week') { calWeekOff++; }
  else if (calView === 'day') { calDayNum = (calDayNum || 0) + 1; }
  else { calM++; if (calM > 11) { calM = 0; calY++; } }
  renderPlanner();
}

function duplicateCalEvent(id) {
  const ev = calManualEvents.find(e => e.id === id);
  if (!ev) return;
  const copy = { ...ev, id: Date.now(), title: ev.title + ' (copy)' };
  calManualEvents.push(copy);
  S.set('calManualEvents', calManualEvents);
  renderCal();
  renderWidgets();
}

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

function setWidgetSize(id, sz) {
  widgetSizes[id] = sz;
  S.set('widgetSizes', widgetSizes);
  renderWidgets();
}

function addWidget(id) {
  if (!widgetOrder.includes(id)) {
    widgetOrder.push(id);
    S.set('widgetOrder', widgetOrder);
    renderWidgets();
  }
}

function removeWidget(id) {
  widgetOrder = widgetOrder.filter(w => w !== id);
  S.set('widgetOrder', widgetOrder);
  renderWidgets();
}

// ===== MOODBOARD =====
let moodboardPendingTarget = null;

function renderMoodboard() {
  const el = document.getElementById('dash-moodboard');
  if (!el) return;
  // Update canvas height based on content
  const maxBottom = moodboardImages.reduce((max, img) => {
    return Math.max(max, img.y + (img.h || img.w * 0.75));
  }, 30);
  el.style.minHeight = Math.max(220, maxBottom + 20) + 'px';

  el.innerHTML = moodboardImages.map(img => `
    <div class="mb-img" id="mb-${img.id}" data-id="${img.id}"
         style="left:${img.x}%;top:${img.y}px;width:${img.w}%">
      <img src="${escHtml(img.url)}" onerror="this.style.opacity='0.3'">
      <button class="mb-delete" onclick="removeMoodImage(${img.id})">✕</button>
      <div class="mb-resize-handle" data-id="${img.id}"></div>
    </div>`).join('') || `<div class="mb-empty">Your mood board · Click "+ Add Image" to place images anywhere</div>`;
  initMoodboardDrag();
}

function initMoodboardDrag() {
  const canvas = document.getElementById('dash-moodboard');
  if (!canvas) return;
  canvas.querySelectorAll('.mb-img').forEach(imgEl => {
    const id = Number(imgEl.dataset.id);
    // Drag to move
    imgEl.addEventListener('mousedown', e => {
      if (e.target.classList.contains('mb-delete') || e.target.classList.contains('mb-resize-handle')) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const startX = e.clientX, startY = e.clientY;
      const img = moodboardImages.find(i => i.id === id);
      if (!img) return;
      const origX = img.x, origY = img.y;
      const onMove = mv => {
        const dx = ((mv.clientX - startX) / rect.width) * 100;
        const dy = mv.clientY - startY;
        img.x = Math.max(0, Math.min(95 - img.w, origX + dx));
        img.y = Math.max(0, origY + dy);
        imgEl.style.left = img.x + '%';
        imgEl.style.top = img.y + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        S.set('moodboardImages', moodboardImages);
        renderMoodboard();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    // Resize handle
    const resizeHandle = imgEl.querySelector('.mb-resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const img = moodboardImages.find(i => i.id === id);
        if (!img) return;
        const startX = e.clientX, origW = img.w;
        const onMove = mv => {
          const dx = ((mv.clientX - startX) / rect.width) * 100;
          img.w = Math.max(10, Math.min(100, origW + dx));
          imgEl.style.width = img.w + '%';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          S.set('moodboardImages', moodboardImages);
          renderMoodboard();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  });
}

function openAddMoodImage() {
  moodboardPendingTarget = 'moodboard';
  document.getElementById('photo-url-input').value = '';
  openModal('m-photo-input');
}

function removeMoodImage(id) {
  moodboardImages = moodboardImages.filter(i => i.id !== id);
  S.set('moodboardImages', moodboardImages);
  renderMoodboard();
}

// ===== HERO SIZE =====
function applyHeroSizes() {
  Object.entries(heroSizes).forEach(([view, sz]) => {
    const el = document.getElementById('hero-' + view);
    if (el) el.style.height = sz === 'sm' ? '160px' : sz === 'lg' ? '380px' : '260px';
  });
}

function setHeroSize(sz) {
  if (!pendingHeaderView) return;
  heroSizes[pendingHeaderView] = sz;
  S.set('heroSizes', heroSizes);
  applyHeroSizes();
  // Update active button
  document.querySelectorAll('.hero-size-btn').forEach(b => b.classList.remove('active'));
  const active = document.querySelector(`.hero-size-btn[data-sz="${sz}"]`);
  if (active) active.classList.add('active');
}

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
  renderSbUpcoming();
  setTimeout(renderMoodChart, 50);
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
    <div class="diary-card">
      <div class="diary-card-head" onclick="openDiaryEntry(${i})" style="cursor:pointer">
        <div>
          <div class="diary-title">${escHtml(e.title)}</div>
          <div class="diary-date">${e.date}${e.type ? ' \u00b7 ' + e.type : ''}</div>
        </div>
        <span class="mood-tag ${moodClass(e.mood)}">${e.mood || ''} ${e.type || 'entry'}</span>
      </div>
      <div class="diary-preview" onclick="openDiaryEntry(${i})" style="cursor:pointer">${escHtml((e.content || '').slice(0, 110))}${(e.content || '').length > 110 ? '\u2026' : ''}</div>
      ${e.photos && e.photos.length ? `<div style="display:flex;gap:4px;padding:6px 14px;flex-wrap:wrap">${e.photos.map(p => `<img src="${p}" style="height:48px;width:48px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">`).join('')}</div>` : ''}
      <div class="diary-card-actions">
        <button class="diary-action-btn" onclick="editDiaryEntry(${e.id})">✏️ Edit</button>
        <button class="diary-action-btn del" onclick="deleteDiaryEntry(${e.id})">🗑 Delete</button>
      </div>
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

function editDiaryEntry(id) {
  const entry = diary.find(e => e.id === id);
  if (!entry) return;
  curDiary = entry;
  loadDiaryEntry(entry);
}

function deleteDiaryEntry(id) {
  if (!confirm('Delete this journal entry?')) return;
  diary = diary.filter(e => e.id !== id);
  S.set('diary', diary);
  renderDiaryList();
}

// ===== HABITS =====
// ===== HABIT STREAKS =====
function getHabitStreak(habitId) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (hChecks[hKey(habitId, d)]) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function getLongestStreak(habitId) {
  let longest = 0, cur = 0;
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (hChecks[hKey(habitId, d)]) { cur++; if (cur > longest) longest = cur; }
    else cur = 0;
  }
  return longest;
}

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
  if (habitView === 'heatmap') { renderHabitHeatmap(); return; }

  const days = getWeekDates(hWkOff);
  document.getElementById('habits-week-lbl').textContent = `${days[0].getDate()} ${MONTHS_SV[days[0].getMonth()].toLowerCase()} \u2013 ${days[6].getDate()} ${MONTHS_SV[days[6].getMonth()].toLowerCase()} ${days[0].getFullYear()}`;

  // Update view toggle buttons
  const weekBtn = document.getElementById('habit-view-weekly');
  const heatBtn = document.getElementById('habit-view-heatmap');
  if (weekBtn) weekBtn.classList.toggle('active', habitView === 'weekly');
  if (heatBtn) heatBtn.classList.toggle('active', habitView === 'heatmap');

  let html = `<thead><tr>
    <th>Habits</th>
    ${DAYS_SV.map((d, i) => `<th>${d}<br><span style="font-weight:400;font-size:9px">${days[i].getDate()}.${days[i].getMonth() + 1}</span></th>`).join('')}
    <th style="white-space:nowrap">🔥 Streak</th>
    <th></th>
  </tr></thead><tbody>`;

  habits.forEach(h => {
    const streak = getHabitStreak(h.id);
    const longest = getLongestStreak(h.id);
    html += `<tr><td><span style="margin-right:6px">${h.emoji}</span>${escHtml(h.name)}</td>`;
    days.forEach(day => {
      const k = hKey(h.id, day);
      html += `<td><input type="checkbox" class="hcb" ${hChecks[k] ? 'checked' : ''} onchange="togH('${k}',this.checked)"></td>`;
    });
    html += `<td style="text-align:center;white-space:nowrap">
      <span class="streak-badge${streak > 0 ? ' active' : ''}" title="Longest: ${longest} days">
        ${streak > 0 ? '🔥' : '—'} ${streak > 0 ? streak : ''}
      </span>
    </td>
    <td><button onclick="deleteHabit(${h.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button></td>`;
    html += '</tr>';
  });
  html += '</tbody>';
  document.getElementById('habits-tbl').innerHTML = html;
  updateHPct(days);
}

function renderHabitHeatmap() {
  const el = document.getElementById('habits-tbl');
  const lbl = document.getElementById('habits-week-lbl');
  if (!el) return;

  // Update view toggle buttons
  const weekBtn = document.getElementById('habit-view-weekly');
  const heatBtn = document.getElementById('habit-view-heatmap');
  if (weekBtn) weekBtn.classList.toggle('active', false);
  if (heatBtn) heatBtn.classList.toggle('active', true);

  const today = new Date();
  // Build last 12 weeks × 7 days grid (84 days)
  const days = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  if (lbl) lbl.textContent = 'Last 12 weeks';

  let html = '<thead><tr><th>Habit</th>';
  // Week labels (show Mon date of each week)
  for (let w = 0; w < 12; w++) {
    const d = days[w * 7];
    html += `<th style="font-size:9px;font-weight:400">${d.getDate()}.${d.getMonth()+1}</th>`;
  }
  html += '<th>Streak</th></tr></thead><tbody>';

  habits.forEach(h => {
    const streak = getHabitStreak(h.id);
    html += `<tr><td>${h.emoji} ${escHtml(h.name)}</td>`;
    for (let w = 0; w < 12; w++) {
      const weekDays = days.slice(w * 7, w * 7 + 7);
      const done = weekDays.filter(d => hChecks[hKey(h.id, d)]).length;
      const opacity = done === 0 ? 0.08 : done <= 2 ? 0.25 : done <= 4 ? 0.5 : done <= 6 ? 0.75 : 1;
      html += `<td style="padding:3px"><div class="heat-cell" style="background:var(--teal);opacity:${opacity}" title="${done}/7 days"></div></td>`;
    }
    html += `<td><span class="streak-badge${streak > 0 ? ' active' : ''}">${streak > 0 ? '🔥' + streak : '—'}</span></td></tr>`;
  });
  html += '</tbody>';
  el.innerHTML = html;
  updateHPct(getWeekDates(hWkOff));
}

function setHabitView(v) {
  habitView = v;
  renderHabits();
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
function togglePomCard() {
  const el = document.getElementById('pom-inline-card');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  pomRender();
}

function toggleToolsCard() {
  const el = document.getElementById('tools-inline-card');
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function renderStudy() {
  if (!activeClassId && classes.length) activeClassId = classes[0].id;
  renderClassTabs();
  renderClassContent();
  pomRender();
}

// ===== CLASSES =====
function renderClassTabs() {
  const list = document.getElementById('class-tabs-list');
  if (!list) return;
  const visible = classes.filter(c => showArchivedClasses ? c.archived : !c.archived);
  const hasArchived = classes.some(c => c.archived);
  if (!visible.length && !classes.length) {
    list.innerHTML = '<div style="font-size:14px;color:var(--tl);font-style:italic">No classes yet — add one to get started.</div>';
    return;
  }
  list.innerHTML = visible.map(c => {
    const col = c.color || '#0d9488';
    const isActive = c.id === activeClassId;
    const style = isActive
      ? `background:${col};border-color:${col};color:white`
      : `border-color:${col}40;color:var(--tm)`;
    return `<button class="class-tab${isActive ? ' active' : ''}" style="${style}" onclick="switchClass(${c.id})">${c.emoji || '📚'} ${escHtml(c.name)}</button>`;
  }).join('') +
  (hasArchived ? `<button class="class-tab" style="opacity:.6;font-size:12px" onclick="toggleArchivedClasses()">${showArchivedClasses ? '← Active' : '📦 Archived'}</button>` : '');
}

function toggleArchivedClasses() {
  showArchivedClasses = !showArchivedClasses;
  if (classes.filter(c => showArchivedClasses ? c.archived : !c.archived).length) {
    activeClassId = classes.find(c => showArchivedClasses ? c.archived : !c.archived)?.id || null;
  }
  renderStudy();
}

function archiveClass(id) {
  const cls = classes.find(c => c.id === id);
  if (!cls) return;
  cls.archived = !cls.archived;
  S.set('classes', classes);
  activeClassId = classes.find(c => !c.archived)?.id || null;
  renderStudy();
}

function switchClass(id) {
  activeClassId = id;
  activeClassSection = 'notes';
  renderClassTabs();
  renderClassContent();
}

function switchClassSection(section) {
  activeClassSection = section;
  renderClassContent();
}

function renderClassContent() {
  const el = document.getElementById('class-content-area');
  if (!el) return;
  if (!classes.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--tl)"><div style="font-size:48px;margin-bottom:12px">📚</div><div style="font-size:16px">Add your first class using the button above.</div></div>';
    return;
  }
  const cls = classes.find(c => c.id === activeClassId);
  if (!cls) return;
  const sections = ['notes', 'exams', 'grades', 'goals'];
  const labels = { notes: '📝 Notes', exams: '📅 Exams', grades: '⭐ Grades', goals: '🎯 Goals' };
  const col = cls.color || '#0d9488';
  const profInfo = [
    cls.professor ? `👤 ${escHtml(cls.professor)}` : '',
    cls.profEmail ? `<a href="mailto:${escHtml(cls.profEmail)}" style="color:${col};text-decoration:none">${escHtml(cls.profEmail)}</a>` : '',
    cls.officeHours ? `🕐 ${escHtml(cls.officeHours)}` : '',
    cls.room ? `📍 ${escHtml(cls.room)}` : '',
    cls.semester ? `📆 ${escHtml(cls.semester)}` : ''
  ].filter(Boolean).join(' &nbsp;·&nbsp; ');
  el.innerHTML = `
    <div style="border-left:4px solid ${col};padding-left:16px;margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:600;color:var(--td)">${cls.emoji || '📚'} ${escHtml(cls.name)}</div>
          ${profInfo ? `<div style="font-size:12px;color:var(--tl);margin-top:4px;flex-wrap:wrap;display:flex;gap:6px;align-items:center">${profInfo}</div>` : ''}
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
            <span style="font-size:13px;color:var(--tl)">Current grade:</span>
            <input type="text" value="${escHtml(cls.currentGrade || '')}" placeholder="e.g. A / 88%"
              style="border:none;border-bottom:1px dashed var(--border);background:none;font-size:14px;color:${col};font-weight:600;width:100px;outline:none;padding:2px 4px"
              onchange="updateClassGrade(${cls.id}, this.value)"/>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button onclick="editClass(${cls.id})" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--tl);cursor:pointer;font-size:12px;padding:4px 10px">✏️ Edit</button>
          <button onclick="archiveClass(${cls.id})" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--tl);cursor:pointer;font-size:12px;padding:4px 10px">${cls.archived ? '↩ Unarchive' : '📦 Archive'}</button>
          <button onclick="deleteClass(${cls.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px">✕ Remove</button>
        </div>
      </div>
    </div>
    <div class="class-section-tabs">
      ${sections.map(s => `<button class="class-stab${s === activeClassSection ? ' active' : ''}" onclick="switchClassSection('${s}')">${labels[s]}</button>`).join('')}
    </div>
    <div id="class-section-body"></div>
  `;
  renderClassSectionBody(cls);
}

function renderClassSectionBody(cls) {
  const el = document.getElementById('class-section-body');
  if (!el) return;
  if (activeClassSection === 'notes') el.innerHTML = buildClassNotes(cls);
  else if (activeClassSection === 'exams') el.innerHTML = buildClassExams(cls);
  else if (activeClassSection === 'grades') el.innerHTML = buildClassGrades(cls);
  else if (activeClassSection === 'goals') el.innerHTML = buildClassGoals(cls);
}

function buildClassNotes(cls) {
  const classNotes = notes.filter(n => n.class === cls.name);
  const cards = classNotes.length
    ? classNotes.map(n => `
        <div class="note-card" onclick="openNote(${n.id})">
          <div class="note-card-thumb"></div>
          <div class="note-card-body">
            <div class="note-card-title">${escHtml(n.title)}</div>
            <div class="note-card-meta">${n.date}</div>
          </div>
        </div>`).join('')
    : '<div style="color:var(--tl);font-style:italic;font-size:14px;padding:16px 0">No notes yet for this class.</div>';
  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="btn-primary" onclick="openNewNoteForClass('${escHtml(cls.name)}')">+ New Cornell Note</button>
    </div>
    <div class="notes-grid">${cards}</div>`;
}

function buildClassExams(cls) {
  const exams = classExams.filter(e => e.classId === cls.id).sort((a,b) => a.date.localeCompare(b.date));
  const rows = exams.length
    ? exams.map(e => `
        <div class="exam-row${e.done ? ' done' : ''}">
          <input type="checkbox" ${e.done ? 'checked' : ''} onchange="toggleExam(${e.id})" style="width:18px;height:18px;accent-color:var(--teal);cursor:pointer;flex-shrink:0">
          <div class="exam-title" style="flex:1;font-size:15px">${escHtml(e.title)}</div>
          <div style="font-size:13px;color:var(--tl);white-space:nowrap">${e.date}</div>
          <button onclick="removeExam(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px">✕</button>
        </div>`).join('')
    : '<div style="color:var(--tl);font-style:italic;font-size:14px;padding:16px 0">No exams or deadlines yet.</div>';
  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="btn-primary" onclick="openAddExam(${cls.id})">+ Add Exam / Deadline</button>
    </div>
    <div>${rows}</div>`;
}

function pctToLetter(pct) {
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function letterToGpa(l) {
  return { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 }[l] || 0;
}

function buildClassGrades(cls) {
  const grades = classGrades.filter(g => g.classId === cls.id);
  let avg = 0;
  let hasAvg = false;
  if (grades.length) {
    const totalWeight = grades.reduce((s, g) => s + (g.weight || 0), 0);
    if (totalWeight > 0) {
      avg = grades.reduce((s, g) => s + (g.grade * (g.weight || 0)), 0) / totalWeight;
    } else {
      avg = grades.reduce((s, g) => s + g.grade, 0) / grades.length;
    }
    hasAvg = true;
  }

  // Projected final grade
  const totalWeight = grades.reduce((s, g) => s + (g.weight || 0), 0);
  const remainingWeight = totalWeight > 0 ? Math.max(0, 100 - totalWeight) : 0;
  const projected = hasAvg && totalWeight > 0 && remainingWeight > 0
    ? `Projected final (assuming 70% on remaining ${remainingWeight}%): <strong>${((avg * totalWeight + 70 * remainingWeight) / 100).toFixed(1)}%</strong>`
    : '';

  const rows = grades.length
    ? grades.map(g => `
        <tr>
          <td>${escHtml(g.task)}</td>
          <td style="font-weight:600;color:var(--teal-d)">${g.grade}%</td>
          <td style="color:var(--tl)">${g.weight ? g.weight + '%' : '—'}</td>
          <td style="color:var(--tl)">${g.weight ? pctToLetter(g.grade) : ''}</td>
          <td><button onclick="removeGrade(${g.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px">✕</button></td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="color:var(--tl);font-style:italic;padding:16px 0">No grades yet.</td></tr>';

  // Cross-class GPA
  const allClasses = classes.filter(c => !c.archived);
  const classGpaItems = allClasses.map(c => {
    const cGrades = classGrades.filter(g => g.classId === c.id);
    if (!cGrades.length) return null;
    const tw = cGrades.reduce((s, g) => s + (g.weight || 0), 0);
    const cAvg = tw > 0
      ? cGrades.reduce((s, g) => s + g.grade * (g.weight || 0), 0) / tw
      : cGrades.reduce((s, g) => s + g.grade, 0) / cGrades.length;
    return { name: c.name, avg: cAvg, letter: pctToLetter(cAvg), gpa: letterToGpa(pctToLetter(cAvg)) };
  }).filter(Boolean);
  const overallGpa = classGpaItems.length ? (classGpaItems.reduce((s, c) => s + c.gpa, 0) / classGpaItems.length).toFixed(2) : null;

  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="btn-primary" onclick="openAddGrade(${cls.id})">+ Add Grade</button>
    </div>
    <table class="grades-table">
      <thead><tr><th>Task</th><th>Grade</th><th>Weight</th><th>Letter</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${hasAvg ? `<div class="grades-avg">
      Average: ${avg.toFixed(1)}% &nbsp;·&nbsp; <span style="color:var(--warm)">${pctToLetter(avg)}</span>
      &nbsp;·&nbsp; GPA points: ${letterToGpa(pctToLetter(avg)).toFixed(1)}
    </div>` : ''}
    ${projected ? `<div style="font-size:13px;color:var(--tm);margin-top:8px">${projected}</div>` : ''}
    ${overallGpa && classGpaItems.length > 1 ? `
    <div style="margin-top:16px;padding:14px;background:var(--teal-l);border-radius:var(--radius-sm);border:1px solid rgba(13,148,136,.2)">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--tl);margin-bottom:6px">Overall GPA</div>
      <div style="font-size:28px;font-family:'Playfair Display',serif;font-weight:600;color:var(--teal-d)">${overallGpa}</div>
      <div style="font-size:11px;color:var(--tm);margin-top:4px">${classGpaItems.map(c => `${escHtml(c.name)}: ${c.letter} (${c.gpa.toFixed(1)})`).join(' · ')}</div>
    </div>` : ''}`;
}

function buildClassGoals(cls) {
  return `
    <div style="margin-bottom:10px;font-size:14px;color:var(--tl)">Write what you want to achieve in this class.</div>
    <textarea class="journal-ta" style="min-height:200px" placeholder="Goals, learning objectives, what you want to master..."
      onblur="saveClassGoals(${cls.id}, this.value)">${escHtml(cls.goals || '')}</textarea>`;
}

function addClass() {
  const name = document.getElementById('ac-name').value.trim();
  const emoji = document.getElementById('ac-emoji').value.trim() || '📚';
  const color = document.getElementById('ac-color')?.value || '#0d9488';
  const professor = document.getElementById('ac-professor')?.value.trim() || '';
  const profEmail = document.getElementById('ac-prof-email')?.value.trim() || '';
  const officeHours = document.getElementById('ac-office-hours')?.value.trim() || '';
  const room = document.getElementById('ac-room')?.value.trim() || '';
  const semester = document.getElementById('ac-semester')?.value.trim() || '';
  if (!name) return;

  if (editingClassId) {
    const idx = classes.findIndex(c => c.id === editingClassId);
    if (idx >= 0) {
      classes[idx] = { ...classes[idx], name, emoji, color, professor, profEmail, officeHours, room, semester };
    }
    editingClassId = null;
  } else {
    const newClass = { id: Date.now(), name, emoji, color, professor, profEmail, officeHours, room, semester, currentGrade: '', goals: '', archived: false };
    classes.push(newClass);
    activeClassId = newClass.id;
  }

  S.set('classes', classes);
  closeModal('m-add-class');
  // Reset modal title back to Add
  const modalTitle = document.querySelector('#m-add-class .modal-title');
  if (modalTitle) modalTitle.textContent = 'Add Class';
  ['ac-name','ac-emoji','ac-professor','ac-prof-email','ac-office-hours','ac-room','ac-semester'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  renderStudy();
}

function editClass(id) {
  const cls = classes.find(c => c.id === id);
  if (!cls) return;
  editingClassId = id;
  // Pre-fill modal fields
  document.getElementById('ac-name').value = cls.name;
  document.getElementById('ac-emoji').value = cls.emoji || '';
  if (document.getElementById('ac-color')) document.getElementById('ac-color').value = cls.color || '#0d9488';
  if (document.getElementById('ac-professor')) document.getElementById('ac-professor').value = cls.professor || '';
  if (document.getElementById('ac-prof-email')) document.getElementById('ac-prof-email').value = cls.profEmail || '';
  if (document.getElementById('ac-office-hours')) document.getElementById('ac-office-hours').value = cls.officeHours || '';
  if (document.getElementById('ac-room')) document.getElementById('ac-room').value = cls.room || '';
  if (document.getElementById('ac-semester')) document.getElementById('ac-semester').value = cls.semester || '';
  // Update modal title to indicate edit mode
  const modalTitle = document.querySelector('#m-add-class .modal-title');
  if (modalTitle) modalTitle.textContent = 'Edit Class';
  openModal('m-add-class');
}

function deleteClass(id) {
  if (!confirm('Remove this class?')) return;
  classes = classes.filter(c => c.id !== id);
  S.set('classes', classes);
  activeClassId = classes.length ? classes[0].id : null;
  renderStudy();
}

function updateClassGrade(id, grade) {
  const cls = classes.find(c => c.id === id);
  if (cls) { cls.currentGrade = grade; S.set('classes', classes); }
}

function saveClassGoals(id, goals) {
  const cls = classes.find(c => c.id === id);
  if (cls) { cls.goals = goals; S.set('classes', classes); }
}

function openAddExam(classId) {
  document.getElementById('ae-title').value = '';
  document.getElementById('ae-date').value = new Date().toLocaleDateString('sv-SE');
  openModal('m-add-exam');
  document.getElementById('m-add-exam').dataset.classId = classId;
}

function addExam() {
  const classId = parseInt(document.getElementById('m-add-exam').dataset.classId);
  const title = document.getElementById('ae-title').value.trim();
  const date = document.getElementById('ae-date').value;
  if (!title || !date) return;
  classExams.push({ id: Date.now(), classId, title, date, done: false });
  S.set('classExams', classExams);
  closeModal('m-add-exam');
  renderClassContent();
}

function toggleExam(id) {
  const exam = classExams.find(e => e.id === id);
  if (exam) { exam.done = !exam.done; S.set('classExams', classExams); }
  const cls = classes.find(c => c.id === activeClassId);
  if (cls) renderClassSectionBody(cls);
}

function removeExam(id) {
  classExams = classExams.filter(e => e.id !== id);
  S.set('classExams', classExams);
  const cls = classes.find(c => c.id === activeClassId);
  if (cls) renderClassSectionBody(cls);
}

function openAddGrade(classId) {
  document.getElementById('ag-task').value = '';
  document.getElementById('ag-grade').value = '';
  document.getElementById('ag-weight').value = '';
  openModal('m-add-grade');
  document.getElementById('m-add-grade').dataset.classId = classId;
}

function addGrade() {
  const classId = parseInt(document.getElementById('m-add-grade').dataset.classId);
  const task = document.getElementById('ag-task').value.trim();
  const grade = parseFloat(document.getElementById('ag-grade').value) || 0;
  const weight = parseFloat(document.getElementById('ag-weight').value) || 0;
  if (!task) return;
  classGrades.push({ id: Date.now(), classId, task, grade, weight });
  S.set('classGrades', classGrades);
  closeModal('m-add-grade');
  renderClassContent();
}

function removeGrade(id) {
  classGrades = classGrades.filter(g => g.id !== id);
  S.set('classGrades', classGrades);
  const cls = classes.find(c => c.id === activeClassId);
  if (cls) renderClassSectionBody(cls);
}

function openNewNoteForClass(className) {
  // Skip the modal — create note directly with class pre-filled
  curNote = {
    id: Date.now(),
    title: 'New Note',
    class: className,
    date: new Date().toLocaleDateString('sv-SE'),
    cues: '', notes: '', summary: '', mood: '\u2728'
  };
  loadNote(curNote);
}

function pomBeep() {
  try {
    const ctx = new (window.AudioContext || window['webkitAudioContext'])();
    const freqs = [880, 1100, 880];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.35, ctx.currentTime + i * 0.22);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.22 + 0.18);
      o.start(ctx.currentTime + i * 0.22);
      o.stop(ctx.currentTime + i * 0.22 + 0.2);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch (e) { /* AudioContext unavailable */ }
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
        pomBeep();
        if (pom.mode === 'work') {
          pom.ses++;
          pom.mins += Math.floor(pom.total / 60);
          document.getElementById('pom-ses').textContent = pom.ses;
          document.getElementById('pom-mins').textContent = pom.mins + 'm';
          const dots = document.querySelectorAll('.pom-dot');
          if (dots[(pom.ses - 1) % 4]) dots[(pom.ses - 1) % 4].classList.add('done');
          // Log session
          const today = new Date().toLocaleDateString('sv-SE');
          if (!pomLog[today]) pomLog[today] = { sessions: 0, mins: 0 };
          pomLog[today].sessions++;
          pomLog[today].mins += Math.floor(pom.total / 60);
          S.set('pomLog', pomLog);
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
  renderPomWeeklyStats();
}

function renderPomWeeklyStats() {
  const el = document.getElementById('pom-weekly-stats');
  if (!el) return;
  const today = new Date();
  let totalMins = 0, totalSessions = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toLocaleDateString('sv-SE');
    totalMins += pomLog[key]?.mins || 0;
    totalSessions += pomLog[key]?.sessions || 0;
  }
  el.innerHTML = totalSessions ? `This week: <strong>${totalSessions}</strong> sessions · <strong>${totalMins}m</strong> focused` : 'No sessions this week yet';
}

// ===== NOTES (Cornell) =====
function renderNotes() {
  const el = document.getElementById('notes-grid');
  if (!el) return;

  // Render class browse cards when no query
  if (!notesSearchQuery) {
    const classesWithNotes = classes.filter(c => notes.some(n => n.class === c.name));
    const generalNotes = notes.filter(n => !n.class || !classes.find(c => c.name === n.class));

    let html = '';
    if (classesWithNotes.length) {
      html += classesWithNotes.map(c => {
        const cnt = notes.filter(n => n.class === c.name).length;
        const col = c.color || 'var(--teal)';
        return `<div class="note-class-card" onclick="nav('study');setTimeout(()=>{switchClass(${c.id})},50)">
          <div class="note-class-thumb" style="background:${col}20;border-color:${col}">${c.emoji || '📚'}</div>
          <div class="note-card-body">
            <div class="note-card-title">${escHtml(c.name)}</div>
            <div class="note-card-meta">${cnt} note${cnt !== 1 ? 's' : ''}</div>
          </div>
        </div>`;
      }).join('');
    }
    if (generalNotes.length) {
      html += generalNotes.map(n => `
        <div class="note-card" onclick="openNote(${n.id})">
          <div class="note-card-thumb">📝</div>
          <div class="note-card-body">
            <div class="note-card-title">${escHtml(n.title)}</div>
            <div class="note-card-meta">General · ${n.date || ''}</div>
          </div>
        </div>`).join('');
    }
    if (!html) {
      html = `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--tl)">
        <div style="font-size:48px;margin-bottom:12px">📝</div>
        <div style="font-size:15px">Notes live inside each class in Study Hub.<br>Search above to find any note, or go to <button class="btn-link" onclick="nav('study')">Study Hub</button> to browse by class.</div>
      </div>`;
    }
    el.innerHTML = html;
    return;
  }

  // Search mode
  const q = notesSearchQuery.toLowerCase();
  const results = notes.filter(n =>
    n.title.toLowerCase().includes(q) ||
    (n.notes || '').toLowerCase().includes(q) ||
    (n.cues || '').toLowerCase().includes(q) ||
    (n.summary || '').toLowerCase().includes(q) ||
    (n.class || '').toLowerCase().includes(q)
  );
  if (!results.length) {
    el.innerHTML = `<div style="grid-column:1/-1;color:var(--tl);font-style:italic;font-size:13px;padding:12px 0">No notes match "${escHtml(notesSearchQuery)}".</div>`;
    return;
  }
  el.innerHTML = results.map(n => {
    const cls = classes.find(c => c.name === n.class);
    const badgeColor = cls?.color || '#6b7280';
    const badgeLabel = n.class || 'General';
    return `<div class="note-card" onclick="openNote(${n.id})">
      <div class="note-card-thumb">📝</div>
      <div class="note-card-body">
        <div class="note-card-title">${escHtml(n.title)}</div>
        <div class="note-card-meta">${n.date || ''}</div>
        <span class="note-class-badge" style="background:${badgeColor}">${escHtml(badgeLabel)}</span>
      </div>
    </div>`;
  }).join('');
}

function notesSearch(q) {
  notesSearchQuery = q;
  renderNotes();
}

function renderStudyNotesList() {
  const el = document.getElementById('study-notes-list');
  if (!el) return;
  if (!notes.length) { el.innerHTML = '<div style="color:var(--tl);font-style:italic;font-size:13px">No notes yet.</div>'; return; }
  el.innerHTML = `<div style="display:flex;gap:8px;flex-wrap:wrap">
    ${notes.slice(0, 10).map(n => `<span style="background:var(--cream);border:1px solid var(--border);border-radius:5px;padding:5px 11px;font-size:12px;cursor:pointer;color:var(--tm)" onclick="openNote(${n.id})">${escHtml(n.title)}</span>`).join('')}
  </div>`;
}

function renderSbUpcoming() {
  const el = document.getElementById('sb-upcoming');
  if (!el) return;
  const today = new Date();
  const todayStr = today.toLocaleDateString('sv-SE');
  const limit = new Date(today.getTime() + 7 * 86400000).toLocaleDateString('sv-SE');

  const items = [];
  // Exams from all classes
  classExams.forEach(e => {
    if (!e.done && e.date >= todayStr && e.date <= limit) {
      const cls = classes.find(c => c.id === e.classId);
      items.push({ date: e.date, title: e.title, sub: cls ? cls.name : 'Exam' });
    }
  });
  // Manual calendar events
  calManualEvents.forEach(e => {
    if (e.date >= todayStr && e.date <= limit) {
      items.push({ date: e.date, title: e.title, sub: 'Event' });
    }
  });
  items.sort((a, b) => a.date.localeCompare(b.date));
  const top = items.slice(0, 3);
  el.innerHTML = top.length
    ? top.map(i => `<div class="sb-upcoming-item">
        <div class="sb-upcoming-title">${escHtml(i.title)}</div>
        <div class="sb-upcoming-date">${i.date.slice(5)} · ${escHtml(i.sub)}</div>
      </div>`).join('')
    : '<div style="font-size:11px;color:var(--tl);padding:4px 16px">Nothing upcoming</div>';
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

let _noteAutosaveTimer = null;

function scheduleNoteAutosave() {
  clearTimeout(_noteAutosaveTimer);
  _noteAutosaveTimer = setTimeout(() => {
    autoSaveNote();
  }, 800);
}

function autoSaveNote() {
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
  const ind = document.getElementById('note-autosave-indicator');
  if (ind) { ind.textContent = 'Saved ✓'; setTimeout(() => { if (ind) ind.textContent = ''; }, 2000); }
}

function saveNote() {
  if (!curNote) return;
  autoSaveNote();
  nav('study');
}

function navFromNote() {
  autoSaveNote();
  nav('study');
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

// Week view offset + day view day number
let calWeekOff = 0;
let calDayNum = null;

function renderCal() {
  ['month','week','day'].forEach(v => {
    const btn = document.getElementById(`cal-view-${v}`);
    if (btn) btn.classList.toggle('active', calView === v);
  });
  if (calView === 'week') { renderCalWeek(); return; }
  if (calView === 'day') { renderCalDay(); return; }
  renderCalMonth();
}

function setCalView(v) { calView = v; renderCal(); }

function calGoToday() {
  const t = new Date();
  calY = t.getFullYear(); calM = t.getMonth();
  calWeekOff = 0; calDayNum = null;
  renderCal();
}

function renderCalMonth() {
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
    const hasManualEv = calManualEvents.some(e => { const ed = new Date(e.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; });
    const hasEv = hasManualEv || gcalEvents.some(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; });
    const evColors = [];
    calManualEvents.filter(e => { const ed = new Date(e.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(e => { const cls = classes.find(c => e.classId === c.id); evColors.push(cls?.color || 'var(--warm)'); });
    gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(() => evColors.push('var(--teal)'));
    const dots = evColors.slice(0, 3).map(c => `<span class="cal-dot" style="background:${c}"></span>`).join('');
    html += `<div class="cal-day${isT ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="openAddCalEvent(${d},${calM},${calY})">${d}${dots ? `<div class="cal-dots">${dots}</div>` : ''}</div>`;
  }
  el.innerHTML = html;

  const monthEvents = calManualEvents.filter(e => { const ed = new Date(e.date); return ed.getMonth() === calM && ed.getFullYear() === calY; });
  const evEl = document.getElementById('cal-events-list');
  if (evEl) {
    evEl.innerHTML = monthEvents.length ? monthEvents.map(e =>
      `<div class="cal-event-item">
        <span>📅 ${e.date.slice(5)} · ${escHtml(e.title)}</span>
        <div style="display:flex;gap:4px">
          <button onclick="duplicateCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:10px" title="Duplicate">⧉</button>
          <button onclick="removeCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button>
        </div>
      </div>`
    ).join('') : '<div style="font-size:12px;color:var(--tl);font-style:italic">Click any day to add an event</div>';
  }
  renderGCalEvents();
}

function renderCalWeek() {
  const el = document.getElementById('cal-grid-main');
  if (!el) return;
  const today = new Date();
  let todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const mon = new Date(today); mon.setDate(today.getDate() - todayDow + calWeekOff * 7);
  const sun = new Date(mon.getTime() + 6 * 86400000);
  document.getElementById('cal-title-main').textContent =
    `${mon.getDate()} ${MONTHS_SV[mon.getMonth()].slice(0,3)} – ${sun.getDate()} ${MONTHS_SV[sun.getMonth()].slice(0,3)} ${mon.getFullYear()}`;

  const hours = Array.from({length: 15}, (_, i) => i + 7);
  let html = `<div class="cal-week-grid">
    <div class="cal-week-time-col"><div class="cal-week-corner"></div>${hours.map(h => `<div class="cal-week-hour">${h}:00</div>`).join('')}</div>`;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon.getTime() + i * 86400000);
    const dStr = d.toLocaleDateString('sv-SE');
    const isT = dStr === today.toLocaleDateString('sv-SE');
    const dayEvs = calManualEvents.filter(e => e.date === dStr);
    const gcalDayEvs = gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.toLocaleDateString('sv-SE') === dStr; });
    html += `<div class="cal-week-col">
      <div class="cal-week-dh${isT ? ' today' : ''}" onclick="openAddCalEvent(${d.getDate()},${d.getMonth()},${d.getFullYear()})">${DAYS_SV[i]} ${d.getDate()}</div>
      ${hours.map(h => {
        const slotEvs = dayEvs.filter(e => e.time && parseInt(e.time) === h);
        const gcalSlotEvs = gcalDayEvs.filter(e => { if (!e.start?.dateTime) return false; return new Date(e.start.dateTime).getHours() === h; });
        const allDayEvs = h === 7 ? dayEvs.filter(e => !e.time) : [];
        return `<div class="cal-week-slot" onclick="openAddCalEventWithTime('${dStr}',${h})">
          ${allDayEvs.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px">✕</button></div>`).join('')}
          ${slotEvs.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px">✕</button></div>`).join('')}
          ${gcalSlotEvs.map(e => `<div class="cal-week-ev gcal-ev">${escHtml(e.summary || 'Event')}</div>`).join('')}
        </div>`;
      }).join('')}
    </div>`;
  }
  html += '</div>';
  el.innerHTML = html;
  const evEl = document.getElementById('cal-events-list');
  if (evEl) evEl.innerHTML = '';
  renderGCalEvents();
}

function renderCalDay() {
  const el = document.getElementById('cal-grid-main');
  if (!el) return;
  const base = new Date(); base.setDate(base.getDate() + (calDayNum || 0));
  const dStr = base.toLocaleDateString('sv-SE');
  const dow = base.getDay() === 0 ? 6 : base.getDay() - 1;
  document.getElementById('cal-title-main').textContent = `${DAYS_SV[dow]} ${base.getDate()} ${MONTHS_SV[base.getMonth()]} ${base.getFullYear()}`;
  const hours = Array.from({length: 17}, (_, i) => i + 6);
  const dayEvs = calManualEvents.filter(e => e.date === dStr);
  const gcalDayEvs = gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.toLocaleDateString('sv-SE') === dStr; });
  let html = `<div class="cal-day-view">`;
  hours.forEach(h => {
    const slotEvs = dayEvs.filter(e => e.time && parseInt(e.time) === h);
    const allDay = h === 6 ? dayEvs.filter(e => !e.time) : [];
    const gcalSlotEvs = gcalDayEvs.filter(e => { if (!e.start?.dateTime) return h === 6; return new Date(e.start.dateTime).getHours() === h; });
    html += `<div class="cal-day-row" onclick="openAddCalEventWithTime('${dStr}',${h})">
      <div class="cal-day-hour">${h}:00</div>
      <div class="cal-day-slot">
        ${allDay.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px">✕</button></div>`).join('')}
        ${slotEvs.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px">✕</button></div>`).join('')}
        ${gcalSlotEvs.map(e => `<div class="cal-week-ev gcal-ev">${escHtml(e.summary || 'Event')}</div>`).join('')}
      </div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;
  const evEl = document.getElementById('cal-events-list');
  if (evEl) evEl.innerHTML = '';
  renderGCalEvents();
}

function openAddCalEventWithTime(dateStr, hour) {
  pendingCalDate = null;
  document.getElementById('mce-date').value = dateStr;
  document.getElementById('mce-title').value = '';
  const timeEl = document.getElementById('mce-time');
  if (timeEl) timeEl.value = `${String(hour).padStart(2,'0')}:00`;
  openModal('m-cal-event');
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
        const matchedClass = classes.find(c => cls.includes(c.name));
        const pillColor = matchedClass?.color ? `background:${matchedClass.color}20;color:${matchedClass.color};border:1px solid ${matchedClass.color}40` : '';
        html += `<span class="class-pill" ${pillColor ? `style="${pillColor}"` : ''}>${escHtml(cls)}`;
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
    scope: 'https://www.googleapis.com/auth/calendar.events',
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
    scope: 'https://www.googleapis.com/auth/calendar.events',
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
  const time = document.getElementById('mce-time')?.value || '';
  const recurrence = document.getElementById('mce-recurrence')?.value || 'none';
  const classId = parseInt(document.getElementById('mce-class')?.value || '') || null;
  if (!title || !date) return;

  const baseEvent = { id: Date.now(), date, title, time, classId };
  calManualEvents.push(baseEvent);

  // Generate recurring occurrences (up to 12 more)
  if (recurrence !== 'none') {
    const baseDate = new Date(date);
    for (let i = 1; i <= 12; i++) {
      const nd = new Date(baseDate);
      if (recurrence === 'daily') nd.setDate(baseDate.getDate() + i);
      else if (recurrence === 'weekly') nd.setDate(baseDate.getDate() + i * 7);
      else if (recurrence === 'monthly') nd.setMonth(baseDate.getMonth() + i);
      calManualEvents.push({ id: Date.now() + i, date: nd.toLocaleDateString('sv-SE'), title, time, classId, recurringId: baseEvent.id });
    }
  }

  S.set('calManualEvents', calManualEvents);
  closeModal('m-cal-event');
  renderCal();
  renderWidgets();

  // Push to Google Calendar if connected (only the base event, not recurring copies)
  if (gcalToken) {
    createGCalEvent(title, date, time).then(ok => {
      if (ok) fetchGCalEvents();
    });
  }
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
  updatePinSidebarBtn();
}

function updatePinSidebarBtn() {
  const btn = document.getElementById('sb-pin-btn');
  if (btn) btn.textContent = pinterestBoardUrl ? '✓ Pinterest' : '📌 Pinterest';
}

function openPinterestFromSidebar() {
  if (pinterestBoardUrl) {
    window.open(pinterestBoardUrl, '_blank');
  } else {
    openModal('m-pinterest');
  }
}

function renderPinterestBoard() {
  const el = document.getElementById('pinterest-body');
  if (!el) return;
  if (!pinterestBoardUrl) {
    el.innerHTML = `
      <div style="text-align:center;padding:20px 10px">
        <div style="font-size:36px;margin-bottom:10px">📌</div>
        <div style="font-size:14px;color:var(--tm);margin-bottom:14px">Connect your Pinterest board to see it here.</div>
        <button class="btn-primary" onclick="openModal('m-pinterest')" style="width:100%">Set Pinterest Board</button>
      </div>`;
    return;
  }
  const boardName = escHtml(pinterestBoardUrl.replace('https://www.pinterest.com/','').replace(/\/$/,''));
  el.innerHTML = `
    <div style="background:var(--teal);padding:10px 14px;margin:-16px -20px 14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:22px">📌</span>
      <div style="flex:1">
        <div style="font-weight:700;color:white;font-size:14px">Pinterest Board</div>
        <div style="font-size:11px;color:rgba(255,255,255,.75)">${boardName}</div>
      </div>
      <a href="${escHtml(pinterestBoardUrl)}" target="_blank"
         style="color:white;font-size:12px;text-decoration:none;background:rgba(255,255,255,.2);padding:4px 10px;border-radius:12px">Open →</a>
    </div>
    <a data-pin-do="embedBoard"
       data-pin-board-width="280"
       data-pin-scale-height="240"
       data-pin-scale-width="80"
       href="${escHtml(pinterestBoardUrl)}">
    </a>
    <button class="btn-link" onclick="openModal('m-pinterest')" style="margin-top:10px;width:100%;text-align:center">Change board</button>
  `;
  if (window.PinUtils) window.PinUtils.build();
}

// ===== HEADER IMAGES =====
function setHeaderImage(view) {
  pendingHeaderView = view;
  document.getElementById('hi-url').value = headerImages[view] || '';
  // Highlight active size
  const curSz = heroSizes[view] || 'md';
  document.querySelectorAll('.hero-size-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.sz === curSz);
  });
  openModal('m-header-image');
}

function saveHeaderImageFromUrl() {
  const url = document.getElementById('hi-url').value.trim();
  if (!url || !pendingHeaderView) return;
  headerImages[pendingHeaderView] = url;
  S.set('headerImages', headerImages);
  applyHeaderImage(pendingHeaderView);
  closeModal('m-header-image');
}

function handleHeaderFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('hi-url').value = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeHeaderImage() {
  if (!pendingHeaderView) return;
  delete headerImages[pendingHeaderView];
  S.set('headerImages', headerImages);
  applyHeaderImage(pendingHeaderView);
  closeModal('m-header-image');
}

function applyHeaderImage(view) {
  const el = document.getElementById('hero-' + view);
  if (!el) return;
  const url = headerImages[view];
  if (url) {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
  } else {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
  }
}

function applyAllHeaderImages() {
  ['home','journal','habits','budget','study','notes','planner','scrapbook'].forEach(applyHeaderImage);
}

// ===== SCRAPBOOK =====
function renderScrapbook() {
  const el = document.getElementById('scrapbook-grid');
  if (!el) return;

  // Migrate old items that lack position data
  let changed = false;
  scrapbookPhotos.forEach((p, i) => {
    if (p.x === undefined) {
      p.x = (i % 4) * 26;
      p.y = Math.floor(i / 4) * 220 + 10;
      p.w = 22;
      changed = true;
    }
  });
  if (changed) S.set('scrapbookPhotos', scrapbookPhotos);

  const maxBottom = scrapbookPhotos.reduce((m, p) => Math.max(m, p.y + 200), 260);
  el.style.minHeight = Math.max(400, maxBottom + 40) + 'px';
  el.style.position = 'relative';

  if (!scrapbookPhotos.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--tl)"><div style="font-size:48px;margin-bottom:12px">🖼</div><div style="font-size:16px">No photos yet. Click "+ Add Photo" to start your scrapbook.</div></div>';
    return;
  }

  el.innerHTML = scrapbookPhotos.map(p => `
    <div class="sc-img" data-id="${p.id}" style="left:${p.x}%;top:${p.y}px;width:${p.w}%">
      <img src="${escHtml(p.url)}" alt="${escHtml(p.caption || '')}" onerror="this.style.opacity='.3'">
      ${p.caption ? `<div class="sc-caption">${escHtml(p.caption)}</div>` : ''}
      <button class="sc-delete" onclick="removeScrapPhoto(${p.id})">✕</button>
      <div class="sc-resize" data-id="${p.id}"></div>
    </div>`).join('');

  initScrapbookDrag();
}

function initScrapbookDrag() {
  const canvas = document.getElementById('scrapbook-grid');
  if (!canvas) return;
  canvas.querySelectorAll('.sc-img').forEach(imgEl => {
    const id = Number(imgEl.dataset.id);

    imgEl.addEventListener('mousedown', e => {
      if (e.target.classList.contains('sc-delete') || e.target.classList.contains('sc-resize')) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const p = scrapbookPhotos.find(i => i.id === id);
      if (!p) return;
      const startX = e.clientX, startY = e.clientY, origX = p.x, origY = p.y;
      const onMove = mv => {
        const dx = ((mv.clientX - startX) / rect.width) * 100;
        p.x = Math.max(0, Math.min(100 - p.w, origX + dx));
        p.y = Math.max(0, origY + (mv.clientY - startY));
        imgEl.style.left = p.x + '%';
        imgEl.style.top = p.y + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        S.set('scrapbookPhotos', scrapbookPhotos);
        renderScrapbook();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    const resizeHandle = imgEl.querySelector('.sc-resize');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const p = scrapbookPhotos.find(i => i.id === id);
        if (!p) return;
        const startX = e.clientX, origW = p.w;
        const onMove = mv => {
          p.w = Math.max(10, Math.min(100, origW + ((mv.clientX - startX) / rect.width) * 100));
          imgEl.style.width = p.w + '%';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          S.set('scrapbookPhotos', scrapbookPhotos);
          renderScrapbook();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  });
}

function openAddScrapPhoto() {
  document.getElementById('sp-url').value = '';
  document.getElementById('sp-caption').value = '';
  openModal('m-scrap-photo');
}

function handleScrapFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('sp-url').value = e.target.result; };
  reader.readAsDataURL(file);
}

function addScrapPhoto() {
  const url = document.getElementById('sp-url').value.trim();
  const caption = document.getElementById('sp-caption').value.trim();
  if (!url) return;
  const n = scrapbookPhotos.length;
  scrapbookPhotos.unshift({ id: Date.now(), url, caption, date: new Date().toLocaleDateString('sv-SE'), x: (n % 4) * 26, y: 10, w: 22 });
  S.set('scrapbookPhotos', scrapbookPhotos);
  closeModal('m-scrap-photo');
  renderScrapbook();
}

function removeScrapPhoto(id) {
  scrapbookPhotos = scrapbookPhotos.filter(p => p.id !== id);
  S.set('scrapbookPhotos', scrapbookPhotos);
  renderScrapbook();
}

// ===== JOURNAL PHOTOS =====
function triggerJournalPhoto() {
  document.getElementById('photo-url-input').value = '';
  openModal('m-photo-input');
}

function addPhotoFromUrl() {
  const url = document.getElementById('photo-url-input').value.trim();
  if (!url) return;
  if (moodboardPendingTarget === 'moodboard') {
    moodboardPendingTarget = null;
    const id = Date.now();
    moodboardImages.push({ id, url, x: 5, y: 10, w: 28 });
    S.set('moodboardImages', moodboardImages);
    closeModal('m-photo-input');
    renderMoodboard();
    return;
  }
  pendingJournalPhotos.push(url);
  closeModal('m-photo-input');
  document.querySelectorAll('.journal-photo-count').forEach(el => {
    el.textContent = pendingJournalPhotos.length + ' photo(s) attached';
  });
}

// Populate class dropdowns in task/event modals
function populateClassDropdowns() {
  ['mt-class', 'mce-class'].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = selId === 'mt-class'
      ? '<option value="">No class</option>'
      : '<option value="">None</option>';
    classes.filter(c => !c.archived).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.emoji || '📚'} ${c.name}`;
      sel.appendChild(opt);
    });
    sel.value = current;
  });
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id)?.classList.add('open');
  if (id === 'm-add-task' || id === 'm-cal-event') populateClassDropdowns();
}
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

window.addEventListener('load', () => {
  document.querySelectorAll('.modal-bg').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
});

// ===== DARK MODE =====
function toggleDarkMode() {
  darkMode = !darkMode;
  S.set('darkMode', darkMode);
  applyDarkMode();
}

function applyDarkMode() {
  document.body.classList.toggle('dark', darkMode);
  const btn = document.getElementById('dark-mode-btn');
  if (btn) btn.textContent = darkMode ? '☀️ Light' : '🌙 Dark';
}

// ===== GLOBAL SEARCH =====
function openSearch() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) { overlay.classList.add('open'); document.getElementById('search-input')?.focus(); }
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (overlay) overlay.classList.remove('open');
  const results = document.getElementById('search-results');
  if (results) results.innerHTML = '';
}

function performSearch(q) {
  const results = document.getElementById('search-results');
  if (!results) return;
  if (!q || q.length < 2) { results.innerHTML = ''; return; }
  const lo = q.toLowerCase();
  const hits = [];

  notes.filter(n => n.title.toLowerCase().includes(lo) || (n.notes||'').toLowerCase().includes(lo) || (n.class||'').toLowerCase().includes(lo))
    .forEach(n => hits.push({ icon: '📝', label: escHtml(n.title), sub: escHtml(n.class || 'General'), action: `closeSearch();openNote(${n.id})` }));

  classExams.filter(e => e.title.toLowerCase().includes(lo))
    .forEach(e => { const cls = classes.find(c => c.id === e.classId); hits.push({ icon: '📅', label: escHtml(e.title), sub: escHtml(cls?.name || ''), action: `closeSearch();nav('study');setTimeout(()=>{switchClass(${e.classId});switchClassSection('exams')},50)` }); });

  diary.filter(d => (d.title||'').toLowerCase().includes(lo) || (d.content||'').toLowerCase().includes(lo))
    .forEach(d => { const idx = diary.indexOf(d); hits.push({ icon: '📔', label: escHtml(d.title), sub: d.date, action: `closeSearch();openDiaryEntry(${idx})` }); });

  classes.filter(c => c.name.toLowerCase().includes(lo))
    .forEach(c => hits.push({ icon: c.emoji || '📚', label: escHtml(c.name), sub: 'Class', action: `closeSearch();nav('study');setTimeout(()=>switchClass(${c.id}),50)` }));

  if (!hits.length) { results.innerHTML = `<div class="search-empty">No results for "${escHtml(q)}"</div>`; return; }
  results.innerHTML = hits.slice(0, 12).map(h =>
    `<div class="search-result" onclick="${h.action}">
      <span class="search-icon">${h.icon}</span>
      <div><div class="search-label">${h.label}</div><div class="search-sub">${h.sub}</div></div>
    </div>`
  ).join('');
}

// ===== SIDEBAR DATE =====
function updateSbDate() {
  const el = document.getElementById('sb-date');
  if (el) el.textContent = new Date().toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' });
}

// ===== GCAL CREATE EVENT =====
async function createGCalEvent(title, date, time) {
  if (!gcalToken) return false;
  const start = time ? `${date}T${time}:00` : date;
  const end = time ? `${date}T${String(parseInt(time) + 1).padStart(2,'0')}:00:00` : date;
  const body = { summary: title, start: time ? { dateTime: start, timeZone: 'Europe/Stockholm' } : { date }, end: time ? { dateTime: end, timeZone: 'Europe/Stockholm' } : { date } };
  try {
    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + gcalToken, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) { fetchGCalEvents(); return true; }
  } catch (e) { console.error('GCal create error', e); }
  return false;
}

// ===== MOOD TREND CHART =====
function renderMoodChart() {
  const el = document.getElementById('mood-chart-canvas');
  if (!el) return;
  const moodToVal = { '😊': 5, '🤩': 5, '🥰': 5, '😌': 4, '😴': 3, '😩': 2, '😤': 2, '😭': 1 };
  const last30 = diary.filter(e => e.mood).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  if (last30.length < 2) {
    el.parentElement.style.display = 'none';
    return;
  }
  el.parentElement.style.display = 'block';
  const W = el.offsetWidth || 300, H = 80;
  el.width = W; el.height = H;
  const ctx = el.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const vals = last30.map(e => moodToVal[e.mood] || 3);
  const minV = 1, maxV = 5;
  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--teal').trim() || '#0d9488';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  vals.forEach((v, i) => {
    const x = (i / (vals.length - 1)) * (W - 20) + 10;
    const y = H - 10 - ((v - minV) / (maxV - minV)) * (H - 20);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // Fill
  ctx.beginPath();
  vals.forEach((v, i) => {
    const x = (i / (vals.length - 1)) * (W - 20) + 10;
    const y = H - 10 - ((v - minV) / (maxV - minV)) * (H - 20);
    i === 0 ? ctx.moveTo(x, H - 10) || ctx.lineTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo((W - 20) + 10, H - 10);
  ctx.closePath();
  ctx.fillStyle = 'rgba(13,148,136,.12)';
  ctx.fill();
}

// ===== TASKS =====
function renderTasks() {
  const el = document.getElementById('tasks-list');
  if (!el) return;
  const filter = document.getElementById('task-filter')?.value || 'all';
  let filtered = tasks;
  if (filter === 'active') filtered = tasks.filter(t => !t.done);
  if (filter === 'done') filtered = tasks.filter(t => t.done);
  const prioOrder = { high: 0, medium: 1, low: 2, none: 3 };
  filtered = [...filtered].sort((a, b) => (prioOrder[a.priority] || 3) - (prioOrder[b.priority] || 3));

  if (!filtered.length) {
    el.innerHTML = '<div style="color:var(--tl);font-style:italic;font-size:13px;padding:20px 0">No tasks yet.</div>';
    return;
  }

  const prioColor = { high: 'var(--rose)', medium: 'var(--warm)', low: 'var(--sage)', none: 'var(--border)' };
  el.innerHTML = filtered.map(t => `
    <div class="task-row${t.done ? ' done' : ''}">
      <input type="checkbox" class="hcb" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id},this.checked)">
      <div style="flex:1;min-width:0">
        <div class="task-title">${escHtml(t.title)}</div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:3px">
          ${t.dueDate ? `<span style="font-size:11px;color:var(--tl)">📅 ${t.dueDate}</span>` : ''}
          ${t.classId ? `<span style="font-size:11px;color:var(--teal-d)">${escHtml(classes.find(c=>c.id===t.classId)?.name||'')}</span>` : ''}
          ${t.priority && t.priority !== 'none' ? `<span style="font-size:10px;font-weight:700;color:${prioColor[t.priority]};text-transform:uppercase">${t.priority}</span>` : ''}
        </div>
        ${t.subtasks?.length ? `<div style="margin-top:6px;display:flex;flex-direction:column;gap:3px">
          ${t.subtasks.map((s, si) => `<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:${s.done?'var(--tl)':'var(--tm)'}">
            <input type="checkbox" ${s.done?'checked':''} onchange="toggleSubtask(${t.id},${si},this.checked)">
            <span style="${s.done?'text-decoration:line-through':''}">${escHtml(s.title)}</span>
          </label>`).join('')}
        </div>` : ''}
      </div>
      <div style="display:flex;gap:4px;align-items:flex-start;flex-shrink:0">
        <div class="task-prio-dot" style="background:${prioColor[t.priority||'none']}"></div>
        <button onclick="deleteTask(${t.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px">✕</button>
      </div>
    </div>
  `).join('');
}

function addTask() {
  const title = document.getElementById('mt-title')?.value.trim();
  if (!title) return;
  const priority = document.getElementById('mt-priority')?.value || 'none';
  const dueDate = document.getElementById('mt-due')?.value || '';
  const classId = parseInt(document.getElementById('mt-class')?.value || '') || null;
  const subtasksRaw = document.getElementById('mt-subtasks')?.value.trim() || '';
  const subtasks = subtasksRaw ? subtasksRaw.split('\n').filter(Boolean).map(s => ({ title: s.trim(), done: false })) : [];
  tasks.unshift({ id: Date.now(), title, priority, dueDate, classId, subtasks, done: false });
  S.set('tasks', tasks);
  closeModal('m-add-task');
  ['mt-title','mt-due','mt-subtasks'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  renderTasks();
}

function toggleTask(id, done) {
  const t = tasks.find(t => t.id === id);
  if (t) { t.done = done; S.set('tasks', tasks); renderTasks(); }
}

function toggleSubtask(taskId, subIdx, done) {
  const t = tasks.find(t => t.id === taskId);
  if (t?.subtasks?.[subIdx]) { t.subtasks[subIdx].done = done; S.set('tasks', tasks); renderTasks(); }
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  S.set('tasks', tasks);
  renderTasks();
}

// ===== EXPORT / BACKUP =====
function exportData() {
  const data = {};
  ['notes','diary','habits','hChecks','budget','schedule','classes','classExams','classGrades',
   'journalMoods','radioStations','widgetOrder','widgetSizes','moodboardImages','heroSizes',
   'calManualEvents','manualGcalEvents','scrapbookPhotos','pinterestBoard','headerImages',
   'gcalClientId','profilePhoto','tasks','pomLog','darkMode'].forEach(k => {
    data[k] = S.get(k);
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `sofia-planner-backup-${new Date().toLocaleDateString('sv-SE')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm('This will overwrite all your current data. Continue?')) return;
      Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) S.set(k, v); });
      location.reload();
    } catch { alert('Invalid backup file.'); }
  };
  reader.readAsText(file);
  input.value = '';
}

// ===== MOBILE SIDEBAR =====
function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ===== BROWSER NOTIFICATIONS =====
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function scheduleExamNotifications() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const today = new Date().toLocaleDateString('sv-SE');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('sv-SE');
  classExams.filter(e => !e.done && (e.date === today || e.date === tomorrowStr)).forEach(e => {
    const cls = classes.find(c => c.id === e.classId);
    const when = e.date === today ? 'today' : 'tomorrow';
    new Notification(`📅 ${e.title}`, { body: `Due ${when}${cls ? ' · ' + cls.name : ''}`, icon: '' });
  });
}

// ===== INIT =====
window.addEventListener('load', () => {
  updateSbDate();
  renderProfilePhoto();
  renderSbUpcoming();

  document.querySelectorAll('.sb-item[data-view]').forEach(item => {
    item.addEventListener('click', () => nav(item.dataset.view));
  });

  // If clientId is saved, show connected state (no auto-auth on load)
  if (gcalClientId) {
    updateGCalBtnUI(true);
  }

  // Radio FAB
  document.getElementById('radio-fab').addEventListener('click', () => { toggleRadio(); if (radioOpen) renderRadio(); });

  applyAllHeaderImages();
  applyHeroSizes();
  renderPinterestBoard();
  updatePinSidebarBtn();
  applyDarkMode();
  requestNotificationPermission();
  setTimeout(scheduleExamNotifications, 2000);

  // Keyboard shortcut: Ctrl+K or / opens search
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
      e.preventDefault();
      openSearch();
    }
    if (e.key === 'Escape') { closeSearch(); closeFab(); }
  });

  // Close FAB when clicking outside
  document.addEventListener('click', e => {
    if (fabOpen && !document.getElementById('fab-wrap')?.contains(e.target)) closeFab();
  });

  // Close sidebar on mobile when nav item clicked
  document.querySelectorAll('.sb-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('open');
    });
  });

  nav('home');
});
