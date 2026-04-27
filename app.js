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
// photos (legacy) removed — all photos now in scrapbookPhotos

// Class Schedule – stored in localStorage, editable via UI
let schedule = S.get('schedule') || [];
// One-time migration: clear old hardcoded Feb 2026 default schedule (V6–V9)
if (schedule.length && schedule[0]?.id === 1 && schedule[0]?.week === 'V6' && !S.get('schedCleared')) {
  schedule = [];
  S.set('schedule', schedule);
  S.set('schedCleared', true);
}

let curNote  = null, curDiary = null;
let hWkOff   = 0;
let editMode = false;
// journalMoods key removed — mood data lives in diary[].mood, rendered via renderMoodTrend()
let schedEditMode = false;
let schedWeekIdx = 0; // which week is currently shown in the schedule
let schedHistory = S.get('schedHistory') || []; // archived past weeks
let schedShowHistory = false;
let radioEditMode = false;

// Calendar – always initialise to the current month/year
const _calInit = new Date();
let calY = _calInit.getFullYear(), calM = _calInit.getMonth();
const MONTHS_SV = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
const DAYS_SV = ['M\u00e5n','Tis','Ons','Tor','Fre','L\u00f6r','S\u00f6n'];

// Pomodoro — restore persisted state across navigation and refresh
const _savedPom = S.get('pomState') || {};
let pom = {
  running: false,
  mode:  _savedPom.mode  || 'work',
  total: _savedPom.total || 25 * 60,
  rem:   _savedPom.rem   || _savedPom.total || 25 * 60,
  int:   null,
  ses:   _savedPom.ses   || 0,
  mins:  _savedPom.mins  || 0
};

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
let headerPositions = S.get('headerPositions') || {}; // 0–100 percentage Y
let headerFit = S.get('headerFit') || {}; // 'cover' | 'contain'
let pendingHeaderView = null;

// Scrapbook
let scrapbookPhotos = S.get('scrapbookPhotos') || [];

// Classes (Study Hub)
let classes = S.get('classes') || [];
let classExams = S.get('classExams') || [];
let classGrades = S.get('classGrades') || [];
let classTranscriptions = S.get('classTranscriptions') || [];
let activeClassId = null;
let activeClassSection = 'notes';

// Tasks
let tasks = S.get('tasks') || [];

// Dark mode
let darkMode = S.get('darkMode') || false;

// Calendar view — default to month
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

// Profile
let profileName = S.get('profileName') || 'Sofia Merdovic';
let profileSub  = S.get('profileSub')  || 'Life Planner';

// Edit-in-place flags
let editingBudgetId  = null;
let editingHabitId   = null;
let editingExamId    = null;
let editingTaskId    = null;
let editingCalEventId = null;

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
  // Persist the view so reload returns here
  const persistable = ['home','today','journal','habits','budget','study','notes','tasks','planner','scrapbook'];
  if (persistable.includes(page)) S.set('lastView', page);
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
  // Clear unsaved journal photo attachments when leaving the journal
  if (page !== 'journal') {
    pendingJournalPhotos = [];
    document.querySelectorAll('.journal-photo-count').forEach(el => { el.textContent = ''; });
  }
}

// ===== TODAY VIEW =====

// Returns today's class entries from the schedule array (handles YYYY-MM-DD and legacy d.m formats)
function getTodayScheduleClasses() {
  const today = new Date();
  const todayStr = today.toLocaleDateString('sv-SE');
  const legacyStr = `${today.getDate()}.${today.getMonth() + 1}`;
  for (const week of schedule) {
    for (const day of (week.days || [])) {
      if (day.date === todayStr || day.date === legacyStr) {
        return day.classes || [];
      }
    }
  }
  return [];
}

function renderToday() {
  const now = new Date();
  const todayStr = now.toLocaleDateString('sv-SE');
  const titleEl = document.getElementById('today-view-title');
  if (titleEl) titleEl.textContent = now.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  const body = document.getElementById('today-body');
  if (!body) return;

  // Today's events — manual + GCal, sorted by time
  const todayEvs = calManualEvents.filter(e => e.date === todayStr);
  const manualGcalToday = manualGcalEvents.filter(e => e.date === todayStr);
  const gcalToday = gcalEvents.filter(e => {
    const d = new Date(e.start?.dateTime || e.start?.date);
    return d.toLocaleDateString('sv-SE') === todayStr;
  });
  const allTodayEvents = [
    ...todayEvs.map(e => ({ time: e.time || '00:00', title: e.title, tag: '' })),
    ...manualGcalToday.map(e => ({ time: e.time || '00:00', title: e.title, tag: '' })),
    ...gcalToday.map(e => {
      const h = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}) : '00:00';
      return { time: h, title: e.summary || 'Event', tag: '<span style="font-size:10px;color:var(--teal);margin-left:auto">GCal</span>' };
    })
  ].sort((a,b) => a.time.localeCompare(b.time));

  const gcalStatus = !gcalToken && gcalClientId
    ? '<div style="font-size:11px;color:var(--tl);margin-top:4px">GCal reconnecting… click "Google Cal" in sidebar if events are missing.</div>'
    : '';
  const evHtml = (allTodayEvents.length
    ? allTodayEvents.map(e => `<div class="today-event-row"><span class="today-time-tag">${e.time === '00:00' ? 'All day' : e.time}</span><span>${escHtml(e.title)}</span>${e.tag}</div>`).join('')
    : '<div style="font-size:13px;color:var(--tl);font-style:italic">No events today</div>') + gcalStatus;

  // Habits
  const habitHtml = habits.slice(0, 8).map(h => {
    const k = hKey(h.id, todayStr);
    return `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
      <input type="checkbox" class="hcb" ${hChecks[k] ? 'checked' : ''} onchange="togHToday('${k}',this.checked)" style="accent-color:var(--teal);width:16px;height:16px;cursor:pointer">
      <span style="font-size:13px;color:var(--tm)">${h.emoji} ${escHtml(h.name)}</span>
    </div>`;
  }).join('') || '<div style="font-size:13px;color:var(--tl);font-style:italic">No habits set up</div>';

  // Tasks — overdue first (red), then due today (teal), then no-due incomplete tasks
  const overdueTasks = tasks.filter(t => !t.done && t.due && t.due < todayStr);
  const todayTasks = tasks.filter(t => !t.done && t.due === todayStr);
  const noDueTasks = tasks.filter(t => !t.done && !t.due).slice(0, 3);
  const allDisplayTasks = [...overdueTasks, ...todayTasks, ...noDueTasks];
  const taskHtml = allDisplayTasks.length
    ? allDisplayTasks.map(t => {
        const label = t.due < todayStr ? 'OVERDUE' : t.due === todayStr ? 'TODAY' : 'NO DUE';
        const color = t.due < todayStr ? 'var(--rose)' : t.due === todayStr ? 'var(--teal)' : 'var(--tl)';
        return `<div class="today-event-row">
          <span style="font-size:10px;font-weight:700;color:${color};min-width:54px">${label}</span>
          <span style="font-size:13px">${escHtml(t.title)}</span>
          ${t.priority ? `<span style="font-size:10px;color:var(--tl);margin-left:auto">${t.priority}</span>` : ''}
        </div>`;
      }).join('')
    : '<div style="font-size:13px;color:var(--tl);font-style:italic">All tasks done ✓</div>';

  // Classes today from schedule
  const todayClasses = getTodayScheduleClasses();
  const classHtml = todayClasses.length
    ? todayClasses.map(c => {
        const cls = classes.find(mc => c.includes(mc.name));
        const clickAttr = cls ? `onclick="openClassInStudyHub(${cls.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px"` : '';
        return `<div class="today-event-row"><span class="today-time-tag" style="color:var(--warm-d,#92400e)">Class</span><span ${clickAttr} title="${cls ? 'Open in Study Hub' : ''}">${escHtml(c)}</span></div>`;
      }).join('')
    : '<div style="font-size:13px;color:var(--tl);font-style:italic">No classes scheduled today</div>';

  // Exams — today's shown urgent, then next upcoming
  const todayExams = classExams.filter(e => !e.done && e.date === todayStr);
  const nextExam = classExams.filter(e => !e.done && e.date > todayStr).sort((a,b) => a.date.localeCompare(b.date))[0];
  const examRows = [
    ...todayExams.map(e => {
      const cls = classes.find(c => c.id === e.classId);
      const clsClick = cls ? `onclick="openClassInStudyHub(${cls.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px"` : '';
      return `<div class="today-event-row" style="background:rgba(244,63,94,.07);border-radius:6px;padding:4px 6px"><span class="today-time-tag" style="color:var(--rose);min-width:54px">TODAY</span><span style="font-weight:600">${escHtml(e.title)}</span>${cls ? `<span ${clsClick} style="font-size:10px;color:var(--tl);margin-left:auto${cls ? ';cursor:pointer' : ''}">${escHtml(cls.name)}</span>` : ''}</div>`;
    }),
    nextExam ? (() => {
      const cls = classes.find(c => c.id === nextExam.classId);
      const clsClick = cls ? `onclick="openClassInStudyHub(${cls.id})" style="cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px"` : '';
      const daysUntil = Math.round((new Date(nextExam.date) - now) / 86400000);
      return `<div class="today-event-row"><span class="today-time-tag" style="color:${daysUntil <= 3 ? 'var(--rose)' : 'var(--teal)'}">in ${daysUntil}d</span><span>${escHtml(nextExam.title)}</span>${cls ? `<span ${clsClick} style="font-size:10px;color:var(--tl);margin-left:auto">${escHtml(cls.name)}</span>` : ''}</div>`;
    })() : null
  ].filter(Boolean).join('');
  const examHtml = examRows || '<div style="font-size:13px;color:var(--tl);font-style:italic">No upcoming exams</div>';

  body.innerHTML = `
    <div class="today-section"><div class="today-section-title">Classes Today</div>${classHtml}</div>
    <div class="today-section"><div class="today-section-title">Events & Google Calendar</div>${evHtml}</div>
    <div class="today-section"><div class="today-section-title">Tasks</div>${taskHtml}</div>
    <div class="today-section"><div class="today-section-title">Habits</div>${habitHtml}</div>
    <div class="today-section"><div class="today-section-title">Exams</div>${examHtml}</div>
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
    const evColors = [];
    calManualEvents.filter(e => { const ed = new Date(e.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(e => { const cls = classes.find(c => e.classId === c.id); evColors.push(cls?.color || 'var(--warm)'); });
    gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(() => evColors.push('var(--teal)'));
    const dots = evColors.slice(0, 3).map(c => `<span class="cal-dot" style="background:${c}"></span>`).join('');
    // Click: if day has events show them in a popup; if empty open add-event modal
    html += `<div class="cal-day${isT ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="calWidgetDayClick(${d},${calM},${calY},${hasEv})">${d}${dots ? `<div class="cal-dots">${dots}</div>` : ''}</div>`;
  }
  html += '</div>';
  return html;
}

function calWidgetDayClick(d, m, y, hasEv) {
  if (!hasEv) { openAddCalEvent(d, m, y); return; }
  const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const manual = calManualEvents.filter(e => e.date === dateStr);
  const gcal = gcalEvents.filter(e => {
    const ed = new Date(e.start?.dateTime || e.start?.date);
    return ed.toLocaleDateString('sv-SE') === dateStr;
  });
  const dayLabel = new Date(y, m, d).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
  const rows = [
    ...manual.map(e => `<div class="today-event-row"><span class="today-time-tag">${e.time || 'All day'}</span><span>${escHtml(e.title)}</span><button onclick="removeCalEvent(${e.id});renderWidgets()" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:10px;margin-left:auto">✕</button></div>`),
    ...gcal.map(e => { const t = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}) : 'All day'; return `<div class="today-event-row"><span class="today-time-tag">${t}</span><span>${escHtml(e.summary||'Event')}</span><span style="font-size:10px;color:var(--teal);margin-left:auto">GCal</span></div>`; })
  ].join('');
  // Show in a lightweight inline popup anchored to the widget
  let pop = document.getElementById('cal-widget-popup');
  if (!pop) { pop = document.createElement('div'); pop.id = 'cal-widget-popup'; document.body.appendChild(pop); }
  pop.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
    <span style="font-size:13px;font-weight:600;color:var(--td)">${dayLabel}</span>
    <button onclick="document.getElementById('cal-widget-popup').style.display='none'" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:16px;line-height:1">✕</button>
  </div>
  ${rows}
  <button class="btn-link" onclick="document.getElementById('cal-widget-popup').style.display='none';openAddCalEvent(${d},${m},${y})" style="width:100%;text-align:center;margin-top:8px;font-size:12px">+ Add event</button>`;
  pop.style.cssText = 'position:fixed;z-index:9000;background:var(--warm-white,#fff);border:1px solid var(--border);border-radius:12px;padding:14px;box-shadow:0 8px 32px rgba(0,0,0,.15);min-width:260px;max-width:320px;top:50%;left:50%;transform:translate(-50%,-50%)';
  pop.style.display = 'block';
  // Close on outside click
  setTimeout(() => {
    const close = e => { if (!pop.contains(e.target)) { pop.style.display='none'; document.removeEventListener('click', close); } };
    document.addEventListener('click', close);
  }, 0);
}

// ── Cross-feature navigation helpers ─────────────────────────────────────────

function openJournalForDate(dateStr) {
  nav('journal');
  loadJournalDay(dateStr);
  // Update the journal date label to reflect the selected date
  const label = document.getElementById('journal-date-label');
  if (label) {
    try {
      const d = new Date(dateStr);
      label.textContent = d.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {}
  }
}

function openClassInStudyHub(classId) {
  nav('study');
  if (classId) switchClass(classId);
}

function openClassInStudyHubByName(name) {
  const cls = classes.find(c => c.name === name);
  if (cls) openClassInStudyHub(cls.id);
}

function openPlannerAtDate(dateStr) {
  try {
    const d = new Date(dateStr);
    calY = d.getFullYear(); calM = d.getMonth();
    calView = 'month';
  } catch {}
  nav('planner');
}

// ─────────────────────────────────────────────────────────────────────────────

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

// ===== MOODBOARD (unified with Scrapbook — both use scrapbookPhotos) =====
let moodboardPendingTarget = null;

function renderMoodboard() {
  const el = document.getElementById('dash-moodboard');
  if (!el) return;
  const maxBottom = scrapbookPhotos.reduce((m, p) => Math.max(m, (p.y || 0) + 200), 220);
  el.style.minHeight = Math.max(220, maxBottom + 20) + 'px';
  el.style.position = 'relative';

  el.innerHTML = scrapbookPhotos.map(p => `
    <div class="mb-img" data-id="${p.id}" style="left:${p.x||5}%;top:${p.y||10}px;width:${p.w||22}%">
      <img src="${escHtml(p.url)}" onerror="this.style.opacity='0.3'">
      <button class="mb-delete" onclick="removeScrapPhoto(${p.id});renderMoodboard()">✕</button>
      <div class="mb-resize-handle" data-id="${p.id}"></div>
    </div>`).join('') || `<div class="mb-empty">Your mood board &amp; scrapbook · Click "+ Add Image" below</div>`;
  initMoodboardDrag();
}

function initMoodboardDrag() {
  const canvas = document.getElementById('dash-moodboard');
  if (!canvas) return;
  canvas.querySelectorAll('.mb-img').forEach(imgEl => {
    const id = Number(imgEl.dataset.id);
    imgEl.addEventListener('mousedown', e => {
      if (e.target.classList.contains('mb-delete') || e.target.classList.contains('mb-resize-handle')) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const p = scrapbookPhotos.find(i => i.id === id);
      if (!p) return;
      const startX = e.clientX, startY = e.clientY, origX = p.x || 5, origY = p.y || 10;
      const onMove = mv => {
        p.x = Math.max(0, Math.min(95 - (p.w || 22), origX + ((mv.clientX - startX) / rect.width) * 100));
        p.y = Math.max(0, origY + (mv.clientY - startY));
        imgEl.style.left = p.x + '%';
        imgEl.style.top = p.y + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        S.set('scrapbookPhotos', scrapbookPhotos);
        renderMoodboard();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    const resizeHandle = imgEl.querySelector('.mb-resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        const rect = canvas.getBoundingClientRect();
        const p = scrapbookPhotos.find(i => i.id === id);
        if (!p) return;
        const startX = e.clientX, origW = p.w || 22;
        const onMove = mv => {
          p.w = Math.max(10, Math.min(100, origW + ((mv.clientX - startX) / rect.width) * 100));
          imgEl.style.width = p.w + '%';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          S.set('scrapbookPhotos', scrapbookPhotos);
          renderMoodboard();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  });
}

function openAddMoodImage() {
  openAddScrapPhoto(); // same collection now
}

function removeMoodImage(id) {
  removeScrapPhoto(id);
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
  setTimeout(renderMoodTrend, 60);
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
    <td style="display:flex;gap:2px;align-items:center">
      <button onclick="editHabit(${h.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px" title="Edit">✏️</button>
      <button onclick="deleteHabit(${h.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button>
    </td>`;
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

function editHabit(id) {
  const h = habits.find(x => x.id === id);
  if (!h) return;
  editingHabitId = id;
  document.getElementById('mh-name').value = h.name;
  document.getElementById('mh-emoji').value = h.emoji;
  const t = document.querySelector('#m-habit .modal-title');
  if (t) t.textContent = 'Edit Habit';
  openModal('m-habit');
}

function addHabit() {
  const name = document.getElementById('mh-name').value.trim();
  const emoji = document.getElementById('mh-emoji').value.trim() || '\u2b50';
  if (!name) return;
  if (editingHabitId) {
    const h = habits.find(x => x.id === editingHabitId);
    if (h) Object.assign(h, { name, emoji });
    editingHabitId = null;
    const t = document.querySelector('#m-habit .modal-title');
    if (t) t.textContent = 'Add Habit';
  } else {
    habits.push({ id: Date.now(), name, emoji });
  }
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
  const bml = document.getElementById('budget-month-label');
  if (bml) bml.textContent = MONTHS_SV[new Date().getMonth()] + ' ' + new Date().getFullYear();
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
      <td style="display:flex;gap:4px;align-items:center">
        <button onclick="editBudget(${b.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px" title="Edit">✏️</button>
        <button onclick="deleteBudget(${b.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px">\u2715</button>
      </td>
    </tr>`;
  }).join('');
}

function addBudget() {
  const name = document.getElementById('mb-name').value.trim();
  const amount = parseFloat(document.getElementById('mb-amount').value) || 0;
  const dir = document.getElementById('mb-dir').value;
  const cat = document.getElementById('mb-cat').value.trim() || '\u00d6vrigt';
  if (!name) return;
  if (editingBudgetId) {
    const b = budget.find(x => x.id === editingBudgetId);
    if (b) Object.assign(b, { name, amount, dir, cat });
    editingBudgetId = null;
    const t = document.querySelector('#m-budget .modal-title');
    if (t) t.textContent = 'Add Budget Item';
  } else {
    budget.push({ id: Date.now(), name, amount, dir, cat });
  }
  S.set('budget', budget);
  closeModal('m-budget');
  renderBudget();
}

function editBudget(id) {
  const b = budget.find(x => x.id === id);
  if (!b) return;
  editingBudgetId = id;
  document.getElementById('mb-name').value = b.name;
  document.getElementById('mb-amount').value = b.amount;
  document.getElementById('mb-dir').value = b.dir;
  document.getElementById('mb-cat').value = b.cat;
  const t = document.querySelector('#m-budget .modal-title');
  if (t) t.textContent = 'Edit Budget Item';
  openModal('m-budget');
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
  if (el) {
    const showing = el.style.display !== 'none';
    el.style.display = showing ? 'none' : 'block';
    if (!showing) renderStudyTools();
  }
}

// ── Study Tools (editable) ────────────────────────────────────────────────────
const DEFAULT_STUDY_TOOLS = [
  { id: 1, icon: '🎙️', name: 'Otter.ai', desc: 'Live transcription & meeting notes', url: 'https://otter.ai' },
  { id: 2, icon: '📖', name: 'Notebook LM', desc: 'AI-powered study notes by Google', url: 'https://notebooklm.google.com' },
  { id: 3, icon: '🃏', name: 'Anki Web', desc: 'Spaced repetition flashcards', url: 'https://ankiweb.net' },
  { id: 4, icon: '🤖', name: 'Claude AI', desc: 'Explain concepts, review notes', url: 'https://claude.ai' },
  { id: 5, icon: '🎓', name: 'ITSLEARNING', desc: 'Course platform', url: 'https://itslearning.com' },
  { id: 6, icon: '🧪', name: 'Khan Academy', desc: 'Free courses', url: 'https://www.khanacademy.org' },
];
let studyTools = S.get('studyTools') || DEFAULT_STUDY_TOOLS;

function saveStudyToolsData() { S.set('studyTools', studyTools); }

function renderStudyTools() {
  const el = document.getElementById('study-tools-list');
  if (!el) return;
  if (!studyTools.length) {
    el.innerHTML = '<div style="padding:16px;color:var(--tl);font-size:13px">No tools yet. Click + Add to add one.</div>';
    return;
  }
  el.innerHTML = studyTools.map(t => `
    <div class="study-link" style="position:relative">
      <a href="${escHtml(t.url)}" target="_blank" style="display:flex;align-items:center;gap:12px;flex:1;text-decoration:none;color:inherit;min-width:0">
        <span class="sl-icon">${escHtml(t.icon)}</span>
        <div style="min-width:0"><div class="sl-name">${escHtml(t.name)}</div><div class="sl-desc">${escHtml(t.desc)}</div></div>
        <span class="sl-arr">→</span>
      </a>
      <div style="display:flex;gap:4px;margin-left:8px;flex-shrink:0">
        <button onclick="editStudyTool(${t.id})" style="background:none;border:none;cursor:pointer;color:var(--tl);font-size:13px;padding:4px" title="Edit">✎</button>
        <button onclick="deleteStudyTool(${t.id})" style="background:none;border:none;cursor:pointer;color:#c18a8a;font-size:13px;padding:4px" title="Delete">✕</button>
      </div>
    </div>`).join('');
}

let _editingToolId = null;

function openAddStudyTool() {
  _editingToolId = null;
  document.getElementById('study-tool-modal-title').textContent = 'Add Study Resource';
  document.getElementById('st-icon').value = '';
  document.getElementById('st-name').value = '';
  document.getElementById('st-desc').value = '';
  document.getElementById('st-url').value = '';
  openModal('m-study-tool');
}

function editStudyTool(id) {
  const tool = studyTools.find(t => t.id === id);
  if (!tool) return;
  _editingToolId = id;
  document.getElementById('study-tool-modal-title').textContent = 'Edit Study Resource';
  document.getElementById('st-icon').value = tool.icon;
  document.getElementById('st-name').value = tool.name;
  document.getElementById('st-desc').value = tool.desc;
  document.getElementById('st-url').value = tool.url;
  openModal('m-study-tool');
}

function saveStudyTool() {
  const icon = document.getElementById('st-icon').value.trim() || '🔗';
  const name = document.getElementById('st-name').value.trim();
  const desc = document.getElementById('st-desc').value.trim();
  const url  = document.getElementById('st-url').value.trim();
  if (!name || !url) return;
  if (_editingToolId) {
    const t = studyTools.find(t => t.id === _editingToolId);
    if (t) { t.icon = icon; t.name = name; t.desc = desc; t.url = url; }
  } else {
    studyTools.push({ id: Date.now(), icon, name, desc, url });
  }
  saveStudyToolsData();
  closeModal('m-study-tool');
  renderStudyTools();
}

function deleteStudyTool(id) {
  studyTools = studyTools.filter(t => t.id !== id);
  saveStudyToolsData();
  renderStudyTools();
}

function renderStudy() {
  // Do NOT auto-open a class — let the user pick
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
  if (!cls) {
    el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--tl)"><div style="font-size:48px;margin-bottom:12px">📚</div><div style="font-size:16px">Select a class above to get started.</div></div>';
    return;
  }
  const sections = ['notes', 'exams', 'grades', 'goals', 'resources', 'record'];
  const labels = { notes: '📝 Notes', exams: '📅 Exams', grades: '⭐ Grades', goals: '🎯 Goals', resources: '🔗 Resources', record: '🎙️ Record' };
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
  else if (activeClassSection === 'resources') el.innerHTML = buildClassResources(cls);
  else if (activeClassSection === 'record') el.innerHTML = buildClassRecord(cls);
}

function buildClassNotes(cls) {
  // Match by classId first (new), fall back to name string (legacy)
  const classNotes = notes.filter(n => n.classId === cls.id || (!n.classId && n.class === cls.name));
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
          <div style="font-size:13px;color:var(--teal-d);white-space:nowrap;cursor:pointer;text-decoration:underline dotted;text-underline-offset:2px" onclick="openPlannerAtDate('${e.date}')" title="Open in Planner">${e.date}</div>
          <button onclick="editExam(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px" title="Edit">✏️</button>
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

// ===== CLASS RESOURCES =====
let classResources = S.get('classResources') || []; // [{ id, classId, label, url }]

function buildClassResources(cls) {
  const res = classResources.filter(r => r.classId === cls.id);
  const rows = res.map(r => `
    <div class="resource-row" id="res-${r.id}">
      <span style="font-size:16px">🔗</span>
      <a href="${escHtml(r.url)}" target="_blank" rel="noopener" style="font-size:14px;color:var(--teal-d);flex:1;text-decoration:none;word-break:break-all">${escHtml(r.label || r.url)}</a>
      <button onclick="editResource(${r.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px" title="Edit">✏️</button>
      <button onclick="removeResource(${r.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px" title="Remove">✕</button>
    </div>`).join('') || '<div style="color:var(--tl);font-style:italic;font-size:14px;padding:16px 0">No resources yet. Add links to textbooks, lecture slides, YouTube videos, etc.</div>';

  return `
    <div style="display:flex;justify-content:flex-end;margin-bottom:14px">
      <button class="btn-primary" onclick="openAddResource(${cls.id})">+ Add Resource</button>
    </div>
    <div id="resource-list">${rows}</div>
    <div id="resource-inline-form" style="display:none;margin-top:12px" class="card">
      <div class="card-body">
        <div class="field"><label>Label</label><input class="fi" id="res-label" placeholder="e.g. Lecture slides Week 3"/></div>
        <div class="field"><label>URL</label><input class="fi" id="res-url" placeholder="https://..."/></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
          <button class="btn-secondary" onclick="closeResourceForm()">Cancel</button>
          <button class="btn-primary" onclick="saveResource(${cls.id})">Save →</button>
        </div>
      </div>
    </div>`;
}

let editingResourceId = null;

function openAddResource(_classId) {
  editingResourceId = null;
  document.getElementById('res-label').value = '';
  document.getElementById('res-url').value = '';
  document.getElementById('resource-inline-form').style.display = 'block';
  document.getElementById('res-label').focus();
}

function editResource(id) {
  const r = classResources.find(r => r.id === id);
  if (!r) return;
  editingResourceId = id;
  document.getElementById('res-label').value = r.label || '';
  document.getElementById('res-url').value = r.url || '';
  document.getElementById('resource-inline-form').style.display = 'block';
  document.getElementById('res-label').focus();
}

function saveResource(classId) {
  const label = document.getElementById('res-label').value.trim();
  const url = document.getElementById('res-url').value.trim();
  if (!url) return;
  if (editingResourceId) {
    const r = classResources.find(r => r.id === editingResourceId);
    if (r) { r.label = label; r.url = url; }
    editingResourceId = null;
  } else {
    classResources.push({ id: Date.now(), classId, label, url });
  }
  S.set('classResources', classResources);
  const cls = classes.find(c => c.id === classId);
  if (cls) renderClassSectionBody(cls);
}

function removeResource(id) {
  classResources = classResources.filter(r => r.id !== id);
  S.set('classResources', classResources);
  const cls = classes.find(c => c.id === activeClassId);
  if (cls) renderClassSectionBody(cls);
}

function closeResourceForm() {
  const form = document.getElementById('resource-inline-form');
  if (form) form.style.display = 'none';
  editingResourceId = null;
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

function editExam(id) {
  const e = classExams.find(x => x.id === id);
  if (!e) return;
  editingExamId = id;
  document.getElementById('ae-title').value = e.title;
  document.getElementById('ae-date').value = e.date;
  document.getElementById('m-add-exam').dataset.classId = e.classId;
  const t = document.querySelector('#m-add-exam .modal-title');
  if (t) t.textContent = 'Edit Exam';
  openModal('m-add-exam');
}

function addExam() {
  const classId = parseInt(document.getElementById('m-add-exam').dataset.classId);
  const title = document.getElementById('ae-title').value.trim();
  const date = document.getElementById('ae-date').value;
  if (!title || !date) return;
  if (editingExamId) {
    const e = classExams.find(x => x.id === editingExamId);
    if (e) Object.assign(e, { title, date });
    editingExamId = null;
    const t = document.querySelector('#m-add-exam .modal-title');
    if (t) t.textContent = 'Add Exam / Deadline';
  } else {
    classExams.push({ id: Date.now(), classId, title, date, done: false });
  }
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
    S.set('pomState', { running: false, mode: pom.mode, total: pom.total, rem: pom.rem, ses: pom.ses, mins: pom.mins });
    document.getElementById('pom-btn').textContent = '\u25b6 Resume';
  } else {
    pom.running = true;
    document.getElementById('pom-btn').textContent = '\u23f8 Pause';
    pom.int = setInterval(() => {
      pom.rem--;
      // Persist every tick so navigation/refresh doesn't lose progress
      S.set('pomState', { running: pom.running, mode: pom.mode, total: pom.total, rem: pom.rem, ses: pom.ses, mins: pom.mins });
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
          const today = new Date().toLocaleDateString('sv-SE');
          if (!pomLog[today]) pomLog[today] = { sessions: 0, mins: 0 };
          pomLog[today].sessions++;
          pomLog[today].mins += Math.floor(pom.total / 60);
          S.set('pomLog', pomLog);
        }
        pom.rem = 0;
        S.set('pomState', { running: pom.running, mode: pom.mode, total: pom.total, rem: pom.rem, ses: pom.ses, mins: pom.mins });
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
    const classesWithNotes = classes.filter(c => notes.some(n => n.classId === c.id || (!n.classId && n.class === c.name)));
    const generalNotes = notes.filter(n => !n.class && !n.classId);

    let html = '';
    if (classesWithNotes.length) {
      html += classesWithNotes.map(c => {
        const cnt = notes.filter(n => n.classId === c.id || (!n.classId && n.class === c.name)).length;
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

  const items = [];
  // Today's exams
  classExams.forEach(e => {
    if (!e.done && e.date === todayStr) {
      const cls = classes.find(c => c.id === e.classId);
      items.push({ time: '', title: e.title, sub: cls ? cls.name : 'Exam' });
    }
  });
  // Today's manual calendar events
  calManualEvents.forEach(e => {
    if (e.date === todayStr) {
      items.push({ time: e.time || '', title: e.title, sub: 'Event' });
    }
  });
  // Today's GCal events
  gcalEvents.forEach(e => {
    const d = new Date(e.start?.dateTime || e.start?.date);
    if (d.toLocaleDateString('sv-SE') === todayStr) {
      const t = e.start?.dateTime ? d.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}) : '';
      items.push({ time: t, title: e.summary || 'Event', sub: 'GCal' });
    }
  });
  // Today's scheduled classes
  getTodayScheduleClasses().forEach(cls => {
    items.push({ time: '', title: cls, sub: 'Class' });
  });
  items.sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const label = document.getElementById('sb-upcoming-label');
  if (label) label.textContent = "Today";

  el.innerHTML = items.length
    ? items.map(i => `<div class="sb-upcoming-item">
        ${i.time ? `<div style="font-size:10px;color:var(--teal);font-weight:600">${i.time}</div>` : ''}
        <div class="sb-upcoming-title">${escHtml(i.title)}</div>
        <div class="sb-upcoming-date">${escHtml(i.sub)}</div>
      </div>`).join('')
    : '<div style="font-size:11px;color:var(--tl);padding:4px 16px">Nothing today</div>';
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
  // Also stamp classId for reliable cross-referencing when class is renamed
  const matchedCls = classes.find(c => c.name === curNote.class);
  if (matchedCls) curNote.classId = matchedCls.id;
  else delete curNote.classId;
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
  const pml = document.getElementById('planner-month-label');
  if (pml) pml.textContent = 'Monthly overview \u00b7 ' + MONTHS_SV[calM] + ' ' + calY;
  const sml = document.getElementById('schedule-month-label');
  if (sml) sml.textContent = MONTHS_SV[new Date().getMonth()];
  renderCal();
  renderSchedule();
  renderScheduleHistory();
  renderScheduleGCal();
  renderGCalEvents();
  renderPlannerBudgetSnap();
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
  calWeekOff = 0; calDayNum = 0;
  calView = 'day';
  renderCal();
}

function renderCalMonth() {
  const el = document.getElementById('cal-grid-main');
  if (!el) return;
  el.className = 'cal-grid'; // apply 7-column grid layout
  document.getElementById('cal-title-main').textContent = MONTHS_SV[calM] + ' ' + calY;
  const now = new Date();
  let html = DAYS_SV.map(d => `<div class="cal-dh">${d}</div>`).join('');
  let dow = new Date(calY, calM, 1).getDay();
  dow = dow === 0 ? 6 : dow - 1;
  const dim = new Date(calY, calM + 1, 0).getDate();
  for (let i = 0; i < dow; i++) html += `<div class="cal-day other-month"></div>`;
  for (let d = 1; d <= dim; d++) {
    const dStr = `${calY}-${String(calM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const isT = d === now.getDate() && calM === now.getMonth() && calY === now.getFullYear();
    const hasManualEv = calManualEvents.some(e => { const ed = new Date(e.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; });
    const hasEv = hasManualEv || gcalEvents.some(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; });
    const hasDiary = diary.some(e => e.date === dStr);
    const hasTasks = tasks.some(t => !t.done && t.dueDate === dStr);
    const evColors = [];
    calManualEvents.filter(e => { const ed = new Date(e.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(e => { const cls = classes.find(c => e.classId === c.id); evColors.push(cls?.color || 'var(--warm)'); });
    gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.getDate() === d && ed.getMonth() === calM && ed.getFullYear() === calY; })
      .forEach(() => evColors.push('var(--teal)'));
    if (hasTasks) evColors.push('var(--rose)');
    if (hasDiary) evColors.push('var(--sage)');
    const dots = evColors.slice(0, 4).map(c => `<span class="cal-dot" style="background:${c}"></span>`).join('');
    html += `<div class="cal-day${isT ? ' today' : ''}${hasEv ? ' has-event' : ''}" onclick="selectCalDay(${d},${calM},${calY})">${d}${dots ? `<div class="cal-dots">${dots}</div>` : ''}</div>`;
  }
  el.innerHTML = html;

  const monthEvents = calManualEvents.filter(e => { const ed = new Date(e.date); return ed.getMonth() === calM && ed.getFullYear() === calY; });
  const evEl = document.getElementById('cal-events-list');
  if (evEl) {
    evEl.innerHTML = monthEvents.length ? monthEvents.map(e =>
      `<div class="cal-event-item">
        <span>📅 ${e.date.slice(5)} · ${escHtml(e.title)}</span>
        <div style="display:flex;gap:4px">
          <button onclick="editCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px" title="Edit">✏️</button>
          <button onclick="duplicateCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:10px" title="Duplicate">⧉</button>
          <button onclick="removeCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button>
        </div>
      </div>`
    ).join('') : '<div style="font-size:12px;color:var(--tl);font-style:italic">Click any day to see details or add an event</div>';
  }
  renderGCalEvents();
}

function selectCalDay(d, month, year) {
  const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const evEl = document.getElementById('cal-events-list');
  if (!evEl) { openAddCalEvent(d, month, year); return; }

  const dayEvs = calManualEvents.filter(e => e.date === dStr);
  const gcalDayEvs = gcalEvents.filter(e => { const ed = new Date(e.start?.dateTime || e.start?.date); return ed.toLocaleDateString('sv-SE') === dStr; });
  const dayTasks = tasks.filter(t => !t.done && t.dueDate === dStr);
  const hasDiary = diary.some(e => e.date === dStr);

  const dateLabel = new Date(dStr).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  const evRows = [...dayEvs.map(e => `<div style="display:flex;align-items:center;gap:6px;font-size:13px;padding:3px 0">
    <span style="color:var(--tl);min-width:44px">${e.time || 'All day'}</span>
    <span style="flex:1">${escHtml(e.title)}</span>
    <button onclick="editCalEvent(${e.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✏️</button>
    <button onclick="removeCalEvent(${e.id});selectCalDay(${d},${month},${year})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button>
  </div>`),
  ...gcalDayEvs.map(e => `<div style="font-size:13px;padding:3px 0;color:var(--teal)">🗓 ${escHtml(e.summary || 'GCal event')}</div>`)].join('') || '<div style="font-size:12px;color:var(--tl);font-style:italic;padding:3px 0">No events</div>';

  const taskRows = dayTasks.map(t => `<div style="font-size:13px;padding:2px 0">✅ ${escHtml(t.title)}</div>`).join('') || '';

  evEl.innerHTML = `
    <div style="padding:10px 0 6px;border-top:1px solid var(--border);margin-top:8px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <strong style="font-size:14px;color:var(--td)">${dateLabel}</strong>
        <button onclick="document.getElementById('cal-events-list').innerHTML=''" style="background:none;border:none;cursor:pointer;color:var(--tl);font-size:13px">✕</button>
      </div>
      ${evRows}
      ${taskRows ? `<div style="margin-top:4px;padding-top:4px;border-top:1px solid var(--border)">${taskRows}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="btn-primary" style="font-size:12px;padding:5px 10px" onclick="openAddTaskForDate('${dStr}')">✅ Add Task</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="openJournalForDate('${dStr}')">📔 ${hasDiary ? 'Journal' : 'Write Journal'}</button>
        <button class="btn-secondary" style="font-size:12px;padding:5px 10px" onclick="openAddCalEvent(${d},${month},${year})">＋ Event</button>
      </div>
    </div>`;
}

function renderCalWeek() {
  const el = document.getElementById('cal-grid-main');
  if (!el) return;
  el.className = ''; // clear month grid class
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
          ${allDayEvs.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="editCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px" title="Edit">✏️</button><button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:2px">✕</button></div>`).join('')}
          ${slotEvs.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="editCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px" title="Edit">✏️</button><button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:2px">✕</button></div>`).join('')}
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
  el.className = ''; // clear month grid class
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
        ${allDay.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="editCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px" title="Edit">✏️</button><button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:2px">✕</button></div>`).join('')}
        ${slotEvs.map(e => `<div class="cal-week-ev" onclick="event.stopPropagation()">${escHtml(e.title)}<button onclick="editCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:3px" title="Edit">✏️</button><button onclick="removeCalEvent(${e.id});event.stopPropagation()" style="background:none;border:none;color:inherit;cursor:pointer;font-size:9px;margin-left:2px">✕</button></div>`).join('')}
        ${gcalSlotEvs.map(e => `<div class="cal-week-ev gcal-ev">${escHtml(e.summary || 'Event')}</div>`).join('')}
      </div>
    </div>`;
  });
  html += '</div>';
  el.innerHTML = html;

  // Show tasks due today below the day view
  const dayTasks = tasks.filter(t => !t.done && t.dueDate === dStr);
  const evEl = document.getElementById('cal-events-list');
  if (evEl) {
    evEl.innerHTML = dayTasks.length
      ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border)">
          <div style="font-size:11px;font-weight:700;color:var(--tl);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Tasks due today</div>
          ${dayTasks.map(t => `<div style="font-size:13px;padding:3px 0;display:flex;align-items:center;gap:8px">
            <span style="font-size:10px;color:var(--rose)">●</span> ${escHtml(t.title)}
          </div>`).join('')}
        </div>`
      : '';
  }
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
function schedPrev() { schedWeekIdx = Math.max(0, schedWeekIdx - 1); renderSchedule(); }
function schedNext() { schedWeekIdx = Math.min(schedule.length - 1, schedWeekIdx + 1); renderSchedule(); }
function schedToggleDay(btn) {
  const pillsEl = btn.closest('.sched-h-pills');
  if (!pillsEl) return;
  const hidden = pillsEl.querySelectorAll('.sched-pill-hidden');
  if (hidden.length) {
    hidden.forEach(p => p.classList.remove('sched-pill-hidden'));
    btn.textContent = 'Show less';
  } else {
    // re-collapse — just re-render
    renderSchedule();
  }
}

function renderSchedule() {
  const el = document.getElementById('schedule-container');
  if (!el) return;
  if (!schedule.length) {
    el.innerHTML = '<div class="card"><div class="card-body" style="color:var(--tl);font-style:italic;font-size:13px">No schedule yet. Click + Week to add one.</div></div>';
    return;
  }
  schedWeekIdx = Math.max(0, Math.min(schedWeekIdx, schedule.length - 1));
  const week = schedule[schedWeekIdx];
  const DAY_FULL = ['M\u00e5n', 'Tis', 'Ons', 'Tor', 'Fre'];
  const COLLAPSE_AT = 2; // show this many pills before "show more"

  const nav = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
    <button class="cal-nb" onclick="schedPrev()" ${schedWeekIdx === 0 ? 'disabled style="opacity:.3"' : ''}>\u2039</button>
    <span style="font-size:13px;font-weight:600;color:var(--td)">${escHtml(week.week)}</span>
    <button class="cal-nb" onclick="schedNext()" ${schedWeekIdx === schedule.length - 1 ? 'disabled style="opacity:.3"' : ''}>\u203a</button>
  </div>`;

  // Horizontal day columns
  const cols = (week.days || []).map((day, dayIdx) => {
    const cls = day.classes || [];
    const hidden = schedEditMode ? [] : cls.slice(COLLAPSE_AT);

    const pills = cls.map((c, clsIdx) => {
      const matchedClass = classes.find(mc => c.includes(mc.name));
      const pillColor = matchedClass?.color ? `background:${matchedClass.color}20;color:${matchedClass.color};border:1px solid ${matchedClass.color}40` : '';
      const isHidden = !schedEditMode && clsIdx >= COLLAPSE_AT;
      const clickAttr = matchedClass && !schedEditMode ? `onclick="openClassInStudyHub(${matchedClass.id})" title="Open in Study Hub" style="cursor:pointer"` : `title="Double-click to edit"`;
      return `<div class="class-pill sched-h-pill${isHidden ? ' sched-pill-hidden' : ''}" data-week="${week.id}" data-day="${dayIdx}" ${pillColor ? `style="${pillColor}"` : ''}>
        <span id="scls-${week.id}-${dayIdx}-${clsIdx}" ondblclick="inlineEditSchedClass(${week.id},${dayIdx},${clsIdx})" ${clickAttr}>${escHtml(c)}</span>
        ${schedEditMode ? `<button onclick="inlineEditSchedClass(${week.id},${dayIdx},${clsIdx})" class="sched-pill-del" style="color:var(--tl)" title="Edit">✏️</button><button onclick="removeScheduleClass(${week.id},${dayIdx},${clsIdx})" class="sched-pill-del" title="Remove">\u2715</button>` : ''}
      </div>`;
    }).join('');

    const moreBtn = !schedEditMode && hidden.length
      ? `<button class="btn-link sched-show-more" onclick="schedToggleDay(this)" style="font-size:10px;margin-top:3px">+${hidden.length} more</button>`
      : '';

    const addBtn = schedEditMode
      ? `<button onclick="openAddSchedClass(${week.id},${dayIdx})" class="sched-add-cls-btn" style="margin-top:4px;width:100%">+ class</button>`
      : '';

    return `<div class="sched-h-day">
      <div class="sched-h-dayname">${DAY_FULL[dayIdx]}</div>
      <div class="sched-h-date">${escHtml(day.date)}</div>
      <div class="sched-h-pills">${pills}${moreBtn}${addBtn}</div>
    </div>`;
  }).join('');

  const delWeekBtn = schedEditMode
    ? `<button onclick="removeScheduleWeek(${week.id})" class="btn-link" style="color:var(--rose);font-size:11px;margin-top:6px">✕ Remove week</button>`
    : '';

  el.innerHTML = `<div class="card"><div style="padding:8px 10px">${nav}<div class="sched-h-grid">${cols}</div>${delWeekBtn}</div></div>`;
}

function renderScheduleGCal() {
  const el = document.getElementById('schedule-gcal');
  if (!el) return;
  // Get Mon–Sun of current week
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0=Mon
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - dow); weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7);
  const todayStr = now.toLocaleDateString('sv-SE');

  // Manual events this week
  const manualThisWeek = manualGcalEvents.filter(e => e.date >= weekStart.toLocaleDateString('sv-SE') && e.date <= weekEnd.toLocaleDateString('sv-SE'))
    .sort((a,b) => a.date.localeCompare(b.date));

  // GCal events this week
  const gcalThisWeek = gcalEvents.filter(e => {
    const d = new Date(e.start?.dateTime || e.start?.date);
    return d >= weekStart && d < weekEnd;
  }).sort((a,b) => (a.start?.dateTime || a.start?.date).localeCompare(b.start?.dateTime || b.start?.date));

  if (!gcalToken && !manualThisWeek.length) {
    el.innerHTML = '';
    return;
  }

  const allEvents = [
    ...gcalThisWeek.map(e => {
      const d = new Date(e.start?.dateTime || e.start?.date);
      const dateStr = d.toLocaleDateString('sv-SE');
      const time = e.start?.dateTime ? d.toLocaleTimeString('sv-SE',{hour:'2-digit',minute:'2-digit'}) : 'All day';
      return { dateStr, time, title: e.summary || 'Event', isGcal: true };
    }),
    ...manualThisWeek.map(e => ({ dateStr: e.date, time: e.time || 'All day', title: e.title, isGcal: false }))
  ].sort((a,b) => a.dateStr.localeCompare(b.dateStr) || a.time.localeCompare(b.time));

  const hasActiveWeek = schedule.length > 0;
  const DAY_NAMES = ['Mån','Tis','Ons','Tor','Fre','Lör','Sön'];

  // Build 7 day columns (Mon–Sun), group events by day
  const byDay = {};
  allEvents.forEach(e => {
    if (!byDay[e.dateStr]) byDay[e.dateStr] = [];
    byDay[e.dateStr].push(e);
  });

  const cols = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const dateStr = d.toLocaleDateString('sv-SE');
    const isToday = dateStr === todayStr;
    const evs = byDay[dateStr] || [];
    const dow = i;
    const pills = evs.map(e => {
      const copyBtn = hasActiveWeek && dow < 5
        ? `<button onclick="copyGCalToSchedule('${dateStr}','${e.time}','${escHtml(e.title).replace(/'/g,"\\'")}',${dow},this)" style="background:none;border:1px solid var(--teal);border-radius:3px;font-size:9px;color:var(--teal);cursor:pointer;padding:0 4px;margin-top:2px;display:block" title="Copy to class schedule">+ Sched</button>` : '';
      return `<div style="background:${e.isGcal ? 'rgba(13,148,136,.13)' : 'rgba(180,120,60,.1)'};border-radius:4px;padding:2px 5px;margin-bottom:3px;font-size:10px;color:var(--td)">
        ${e.time !== 'All day' ? `<span style="color:var(--tl);display:block;font-size:9px">${e.time}</span>` : ''}
        <span>${escHtml(e.title)}</span>
        ${copyBtn}
      </div>`;
    }).join('') || '';

    return `<div style="flex:1;min-width:0;background:${isToday ? 'rgba(13,148,136,.07)' : 'transparent'};border-radius:8px;padding:5px 4px;border:1px solid ${isToday ? 'var(--teal)' : 'var(--border)'}">
      <div style="font-size:10px;font-weight:700;color:${isToday ? 'var(--teal)' : 'var(--tl)'};text-transform:uppercase;letter-spacing:.04em">${DAY_NAMES[i]}</div>
      <div style="font-size:11px;color:var(--tm);margin-bottom:4px">${d.getDate()}</div>
      ${pills || '<div style="font-size:10px;color:var(--border)">—</div>'}
    </div>`;
  }).join('');

  if (!Object.keys(byDay).length) { el.innerHTML = ''; return; }

  el.innerHTML = `<div class="section-header" style="margin-top:14px;margin-bottom:8px">This Week's Events</div>
    <div class="card"><div style="padding:8px;display:flex;gap:4px">${cols}</div></div>`;
}

// Copy a GCal/manual event title into the current schedule week on the matching day
function copyGCalToSchedule(dateStr, time, title, dow, btn) {
  if (!schedule.length) return;
  const week = schedule[schedWeekIdx];
  if (!week || !week.days[dow]) return;
  const label = time && time !== 'All day' ? `${time} ${title}` : title;
  week.days[dow].classes.push(label);
  S.set('schedule', schedule);
  renderSchedule();
  if (btn) { btn.textContent = '✓'; btn.disabled = true; setTimeout(() => renderScheduleGCal(), 1200); }
}

// Archive the current schedule week to history and remove it from active schedule
function archiveScheduleWeek() {
  if (!schedule.length) return;
  const week = schedule[schedWeekIdx];
  if (!confirm(`Archive "${week.week}" to history and remove from active schedule?`)) return;
  schedHistory.unshift({ ...week, archivedAt: new Date().toLocaleDateString('sv-SE') });
  S.set('schedHistory', schedHistory);
  schedule.splice(schedWeekIdx, 1);
  S.set('schedule', schedule);
  schedWeekIdx = Math.max(0, schedWeekIdx - 1);
  renderSchedule();
  renderScheduleGCal();
}

// Restore an archived week back into active schedule
function restoreScheduleWeek(idx) {
  const week = schedHistory[idx];
  if (!week) return;
  schedule.push({ ...week, id: Date.now() });
  S.set('schedule', schedule);
  schedHistory.splice(idx, 1);
  S.set('schedHistory', schedHistory);
  schedWeekIdx = schedule.length - 1;
  schedShowHistory = false;
  renderSchedule();
  renderScheduleHistory();
}

function deleteHistoryWeek(idx) {
  schedHistory.splice(idx, 1);
  S.set('schedHistory', schedHistory);
  renderScheduleHistory();
}

function toggleScheduleHistory() {
  schedShowHistory = !schedShowHistory;
  renderScheduleHistory();
}

function renderScheduleHistory() {
  let el = document.getElementById('schedule-history');
  if (!el) return;
  if (!schedShowHistory || !schedHistory.length) {
    el.innerHTML = '';
    return;
  }
  const rows = schedHistory.map((w, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px">
      <span style="font-weight:600;color:var(--td);min-width:36px">${escHtml(w.week)}</span>
      <span style="color:var(--tl);flex:1">Archived ${w.archivedAt || ''}</span>
      <button class="btn-link" onclick="restoreScheduleWeek(${i})" style="font-size:11px">Restore</button>
      <button onclick="deleteHistoryWeek(${i})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button>
    </div>`).join('');
  el.innerHTML = `<div class="card" style="margin-top:8px"><div class="card-body" style="padding:8px 10px">
    <div style="font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--tl);margin-bottom:6px">Past Weeks</div>
    ${rows}
  </div></div>`;
}

function inlineEditSchedClass(weekId, dayIdx, clsIdx) {
  const span = document.getElementById(`scls-${weekId}-${dayIdx}-${clsIdx}`);
  if (!span) return;
  const week = schedule.find(w => w.id === weekId);
  if (!week) return;
  const current = week.days[dayIdx]?.classes[clsIdx] || '';
  const input = document.createElement('input');
  input.value = current;
  input.style.cssText = 'width:100px;font-size:11px;border:1px solid var(--teal);border-radius:3px;padding:1px 4px;background:var(--warm-white);color:var(--td);outline:none';
  span.replaceWith(input);
  input.focus();
  input.select();
  const save = () => {
    const val = input.value.trim();
    if (val && week.days[dayIdx]) {
      week.days[dayIdx].classes[clsIdx] = val;
      S.set('schedule', schedule);
    }
    renderSchedule();
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save(); } if (e.key === 'Escape') renderSchedule(); });
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
    <span class="radio-stn-wrap" id="rstn-wrap-${i}">
      <button class="radio-stn${currentStation === i ? ' playing' : ''}" onclick="playStation(${i})">${escHtml(s.name)}</button>
      ${radioEditMode ? `<button onclick="inlineEditStation(${i})" class="radio-stn-del" title="Edit" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px;padding:2px 4px">✏️</button><button onclick="removeRadioStation(${i})" class="radio-stn-del" title="Remove">\u2715</button>` : ''}
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

function inlineEditStation(i) {
  const wrap = document.getElementById(`rstn-wrap-${i}`);
  if (!wrap) return;
  const s = radioStations[i];
  wrap.innerHTML = `
    <input id="re-name-${i}" value="${escHtml(s.name)}" style="width:80px;font-size:12px;border:1px solid var(--border);border-radius:4px;padding:2px 4px;background:var(--warm-white);color:var(--td)">
    <input id="re-url-${i}" value="${escHtml(s.url)}" style="width:130px;font-size:11px;border:1px solid var(--border);border-radius:4px;padding:2px 4px;background:var(--warm-white);color:var(--td)">
    <button onclick="saveStation(${i})" style="background:var(--teal);color:white;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;font-size:11px">✓</button>
    <button onclick="renderRadio()" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:11px">✕</button>`;
}

function saveStation(i) {
  const name = document.getElementById(`re-name-${i}`)?.value.trim();
  const url = document.getElementById(`re-url-${i}`)?.value.trim();
  if (!name || !url) return;
  radioStations[i] = { name, url };
  S.set('radioStations', radioStations);
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
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
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
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
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
  const headers = { Authorization: 'Bearer ' + gcalToken };
  try {
    // 1. Get all calendars owned by this account
    const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers });
    if (listRes.status === 401) {
      gcalToken = null;
      updateGCalBtnUI(false);
      renderGCalEvents();
      return;
    }
    const listData = await listRes.json();
    const calIds = (listData.items || [])
      .filter(c => c.accessRole === 'owner' || c.accessRole === 'writer')
      .map(c => c.id);
    if (!calIds.length) calIds.push('primary');

    // 2. Fetch events from every calendar in parallel
    const results = await Promise.all(calIds.map(id =>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events?timeMin=${min}&timeMax=${max}&singleEvents=true&orderBy=startTime&maxResults=50`, { headers })
        .then(r => r.ok ? r.json() : { items: [] })
        .then(d => d.items || [])
        .catch(() => [])
    ));

    // 3. Merge, deduplicate by event id, sort by start
    const seen = new Set();
    gcalEvents = results.flat().filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    }).sort((a, b) => (a.start?.dateTime || a.start?.date || '').localeCompare(b.start?.dateTime || b.start?.date || ''));

    renderGCalEvents();
    renderScheduleGCal();
    renderSbUpcoming();
    if (document.getElementById('view-today')?.classList.contains('active')) renderToday();
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

// ===== ADD TASK FOR DATE =====
function openAddTaskForDate(dateStr) {
  editingTaskId = null;
  if (document.getElementById('mt-title')) document.getElementById('mt-title').value = '';
  if (document.getElementById('mt-due')) document.getElementById('mt-due').value = dateStr;
  if (document.getElementById('mt-priority')) document.getElementById('mt-priority').value = 'none';
  if (document.getElementById('mt-subtasks')) document.getElementById('mt-subtasks').value = '';
  if (document.getElementById('mt-class')) document.getElementById('mt-class').value = '';
  const tl = document.querySelector('#m-add-task .modal-title');
  if (tl) tl.textContent = 'New Task';
  openModal('m-add-task');
}

// ===== CALENDAR MANUAL EVENTS =====
function openAddCalEvent(day, month, year) {
  pendingCalDate = { day, month, year };
  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  document.getElementById('mce-date').value = dateStr;
  document.getElementById('mce-title').value = '';
  openModal('m-cal-event');
}

function editCalEvent(id) {
  const e = calManualEvents.find(x => x.id === id);
  if (!e) return;
  editingCalEventId = id;
  document.getElementById('mce-title').value = e.title;
  document.getElementById('mce-date').value = e.date;
  if (document.getElementById('mce-time')) document.getElementById('mce-time').value = e.time || '';
  if (document.getElementById('mce-recurrence')) document.getElementById('mce-recurrence').value = 'none';
  populateClassDropdowns();
  if (document.getElementById('mce-class') && e.classId) document.getElementById('mce-class').value = e.classId;
  const tl = document.querySelector('#m-cal-event .modal-title');
  if (tl) tl.textContent = 'Edit Event';
  openModal('m-cal-event');
}

function addCalEvent() {
  const title = document.getElementById('mce-title').value.trim();
  const date = document.getElementById('mce-date').value;
  const time = document.getElementById('mce-time')?.value || '';
  const recurrence = document.getElementById('mce-recurrence')?.value || 'none';
  const classId = parseInt(document.getElementById('mce-class')?.value || '') || null;
  if (!title || !date) return;

  if (editingCalEventId) {
    const e = calManualEvents.find(x => x.id === editingCalEventId);
    if (e) Object.assign(e, { title, date, time, classId });
    editingCalEventId = null;
    const tl = document.querySelector('#m-cal-event .modal-title');
    if (tl) tl.textContent = 'Add Event';
    S.set('calManualEvents', calManualEvents);
    closeModal('m-cal-event');
    renderCal(); renderWidgets();
    return;
  }

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
  document.getElementById('hi-pos-y').value = headerPositions[view] ?? 50;
  const curFit = headerFit[view] || 'cover';
  document.querySelectorAll('.hi-fit-btn').forEach(b => b.classList.toggle('active', b.dataset.fit === curFit));
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
  headerPositions[pendingHeaderView] = parseInt(document.getElementById('hi-pos-y').value) || 50;
  const activeFitBtn = document.querySelector('.hi-fit-btn.active');
  headerFit[pendingHeaderView] = activeFitBtn?.dataset.fit || 'cover';
  S.set('headerImages', headerImages);
  S.set('headerPositions', headerPositions);
  S.set('headerFit', headerFit);
  applyHeaderImage(pendingHeaderView);
  closeModal('m-header-image');
}

function setHeaderFit(fit) {
  document.querySelectorAll('.hi-fit-btn').forEach(b => b.classList.toggle('active', b.dataset.fit === fit));
  // Live preview
  if (pendingHeaderView && headerImages[pendingHeaderView]) {
    const el = document.getElementById('hero-' + pendingHeaderView);
    if (el) {
      el.style.backgroundSize = fit;
      el.style.backgroundPosition = fit === 'contain' ? 'center' : `center ${document.getElementById('hi-pos-y').value}%`;
    }
  }
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
  delete headerPositions[pendingHeaderView];
  S.set('headerImages', headerImages);
  S.set('headerPositions', headerPositions);
  applyHeaderImage(pendingHeaderView);
  closeModal('m-header-image');
}

function applyHeaderImage(view) {
  const el = document.getElementById('hero-' + view);
  if (!el) return;
  const url = headerImages[view];
  if (url) {
    const posY = headerPositions[view] ?? 50;
    const fit = headerFit[view] || 'cover';
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = fit;
    el.style.backgroundPosition = fit === 'contain' ? 'center' : `center ${posY}%`;
    el.style.backgroundRepeat = 'no-repeat';
  } else {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundPosition = '';
    el.style.backgroundRepeat = '';
  }
}

function previewHeaderPos(val) {
  if (!pendingHeaderView) return;
  const el = document.getElementById('hero-' + pendingHeaderView);
  if (el && headerImages[pendingHeaderView]) el.style.backgroundPosition = `center ${val}%`;
}

function applyAllHeaderImages() {
  ['home','journal','habits','budget','study','notes','planner','scrapbook'].forEach(applyHeaderImage);
}

// ===== SCRAPBOOK =====
function scrapDateLabel(dateStr) {
  if (!dateStr) return 'No date';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
}

function renderScrapbook() {
  const el = document.getElementById('scrapbook-grid');
  if (!el) return;

  // Migrate: ensure all photos have a size field
  scrapbookPhotos.forEach(p => { if (!p.size) p.size = 'md'; });

  el.style.position = '';
  el.style.minHeight = '';

  if (!scrapbookPhotos.length) {
    el.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--tl)"><div style="font-size:48px;margin-bottom:12px">🖼</div><div style="font-size:16px">No photos yet. Click "+ Add Photo" to start your scrapbook.</div></div>';
    renderPinterestBoard();
    return;
  }

  // Group by date, newest first
  const groups = {};
  scrapbookPhotos.forEach(p => {
    const d = p.date || 'No date';
    if (!groups[d]) groups[d] = [];
    groups[d].push(p);
  });
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  el.innerHTML = sortedDates.map(date => `
    <div class="sc-day-group">
      <div class="sc-day-label">
        <span class="sc-day-date-link" onclick="openJournalForDate('${date}')" title="Open journal for this day">${scrapDateLabel(date)}</span>
        <span class="sc-day-journal-hint">📔</span>
      </div>
      <div class="sc-day-photos">
        ${groups[date].map(p => `
          <div class="sc-photo-card sc-sz-${p.size || 'md'}" data-id="${p.id}">
            <div class="sc-photo-wrap">
              <img src="${escHtml(p.url)}" alt="${escHtml(p.caption || '')}" onerror="this.style.opacity='.3'">
              <div class="sc-photo-controls">
                <div class="sc-size-btns">
                  <button class="sc-sz-btn${p.size==='sm'?' active':''}" onclick="setScrapSize(${p.id},'sm')">S</button>
                  <button class="sc-sz-btn${p.size==='md'?' active':''}" onclick="setScrapSize(${p.id},'md')">M</button>
                  <button class="sc-sz-btn${p.size==='lg'?' active':''}" onclick="setScrapSize(${p.id},'lg')">L</button>
                  <button class="sc-sz-btn${p.size==='xl'?' active':''}" onclick="setScrapSize(${p.id},'xl')">XL</button>
                </div>
                <div style="display:flex;gap:3px">
                  <button class="sc-sz-btn" onclick="pinScrapPhotoAsHeader(${p.id})" title="Pin as page header">📌</button>
                  <button class="sc-delete-btn" onclick="removeScrapPhoto(${p.id})">✕</button>
                </div>
              </div>
            </div>
            ${p.caption ? `<div class="sc-caption">${escHtml(p.caption)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>`).join('');

  renderPinterestBoard();
}

function setScrapSize(id, size) {
  const p = scrapbookPhotos.find(ph => ph.id === id);
  if (!p) return;
  p.size = size;
  S.set('scrapbookPhotos', scrapbookPhotos);
  renderScrapbook();
}

function openAddScrapPhoto() {
  document.getElementById('sp-url').value = '';
  document.getElementById('sp-caption').value = '';
  // date input requires YYYY-MM-DD
  const now = new Date();
  document.getElementById('sp-date').value = now.toISOString().slice(0, 10);
  openModal('m-scrap-photo');
}

function openPinterestInNewTab() {
  const url = pinterestBoardUrl || 'https://www.pinterest.com';
  window.open(url, '_blank');
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
  const rawDate = document.getElementById('sp-date')?.value;
  // Normalize to sv-SE (YYYY-MM-DD) — the date input already gives that format
  const date = rawDate || new Date().toLocaleDateString('sv-SE');
  if (!url) return;
  scrapbookPhotos.unshift({ id: Date.now(), url, caption, date, size: 'md' });
  S.set('scrapbookPhotos', scrapbookPhotos);
  closeModal('m-scrap-photo');
  renderScrapbook();
}

const HEADER_VIEWS = [
  { id: 'home', label: 'Home' }, { id: 'journal', label: 'Journal' },
  { id: 'habits', label: 'Habits' }, { id: 'budget', label: 'Budget' },
  { id: 'study', label: 'Study Hub' }, { id: 'notes', label: 'Notes' },
  { id: 'planner', label: 'Planner' }, { id: 'scrapbook', label: 'Scrapbook' }
];

function pinScrapPhotoAsHeader(id) {
  const photo = scrapbookPhotos.find(p => p.id === id);
  if (!photo) return;
  const existing = document.getElementById('sc-pin-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'sc-pin-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:var(--cream);border-radius:12px;padding:24px;width:320px;box-shadow:0 8px 40px rgba(0,0,0,.3)">
      <div style="font-size:16px;font-weight:700;color:var(--td);margin-bottom:4px">📌 Pin as Page Header</div>
      <div style="font-size:13px;color:var(--tl);margin-bottom:16px">Choose which page to set this photo as the header:</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
        ${HEADER_VIEWS.map(v => `<button onclick="doPinHeader('${v.id}',${id})" style="background:var(--cream);border:1px solid var(--border);border-radius:8px;padding:8px;cursor:pointer;font-size:13px;text-align:left;color:var(--td)" onmouseover="this.style.background='var(--teal)';this.style.color='white'" onmouseout="this.style.background='var(--cream)';this.style.color='var(--td)'">${v.label}</button>`).join('')}
      </div>
      <button onclick="document.getElementById('sc-pin-overlay').remove()" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px;width:100%;text-align:center">Cancel</button>
    </div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function doPinHeader(view, photoId) {
  const photo = scrapbookPhotos.find(p => p.id === photoId);
  if (!photo) return;
  headerImages[view] = photo.url;
  headerPositions[view] = 50;
  headerFit[view] = 'cover';
  S.set('headerImages', headerImages);
  S.set('headerPositions', headerPositions);
  S.set('headerFit', headerFit);
  applyHeaderImage(view);
  document.getElementById('sc-pin-overlay')?.remove();
  // Brief confirmation
  const msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--teal);color:white;padding:10px 20px;border-radius:8px;font-size:14px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.2)';
  msg.textContent = `✓ Pinned as ${HEADER_VIEWS.find(v=>v.id===view)?.label || view} header`;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2500);
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

// ===== PROFILE NAME / SUBTITLE =====
function renderProfileInfo() {
  const nameEl = document.getElementById('sb-profile-name');
  const subEl  = document.getElementById('sb-profile-sub');
  if (nameEl) {
    nameEl.textContent = profileName;
    nameEl.onblur = () => { profileName = nameEl.textContent.trim() || 'Sofia Merdovic'; S.set('profileName', profileName); };
  }
  if (subEl) {
    subEl.textContent = profileSub;
    subEl.onblur = () => { profileSub = subEl.textContent.trim() || 'Life Planner'; S.set('profileSub', profileSub); };
  }
  // Hero title on home page
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) heroTitle.textContent = profileName + "'s Life Planner";
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

// ===== MOOD TREND STRIP =====
function renderMoodTrend() {
  const el = document.getElementById('mood-trend-strip');
  if (!el) return;

  // Collect one mood per day from the last 30 days
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dStr = d.toLocaleDateString('sv-SE');
    const entries = diary.filter(e => e.date === dStr && e.mood);
    // prefer night > morning > thought
    const entry = entries.find(e => e.type === 'night') || entries.find(e => e.type === 'morning') || entries[0];
    days.push({ dStr, mood: entry?.mood || null, d });
  }

  const moodBg = { '😊':'#d1fae5','😌':'#e0f2fe','😩':'#fef3c7','😴':'#ede9fe',
                   '🥰':'#fce7f3','😤':'#fee2e2','😭':'#dbeafe','🤩':'#fef9c3' };

  el.innerHTML = days.map(({ dStr, mood, d }) => {
    const label = d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    const bg = mood ? (moodBg[mood] || '#f3f4f6') : 'var(--border)';
    const isToday = dStr === new Date().toLocaleDateString('sv-SE');
    return `<div class="mood-trend-day${isToday ? ' mood-trend-today' : ''}"
      onclick="openJournalForDate('${dStr}')"
      title="${label}${mood ? ' · ' + mood : ' · no entry'}"
      style="background:${bg}">
      <span class="mood-trend-emoji">${mood || ''}</span>
    </div>`;
  }).join('');
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
        <button onclick="editTask(${t.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px" title="Edit">✏️</button>
        <button onclick="deleteTask(${t.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:12px">✕</button>
      </div>
    </div>
  `).join('');
}

function editTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editingTaskId = id;
  if (document.getElementById('mt-title')) document.getElementById('mt-title').value = t.title;
  if (document.getElementById('mt-priority')) document.getElementById('mt-priority').value = t.priority || 'none';
  if (document.getElementById('mt-due')) document.getElementById('mt-due').value = t.dueDate || '';
  if (document.getElementById('mt-subtasks')) document.getElementById('mt-subtasks').value = (t.subtasks||[]).map(s=>s.title).join('\n');
  populateClassDropdowns();
  if (document.getElementById('mt-class') && t.classId) document.getElementById('mt-class').value = t.classId;
  const tl = document.querySelector('#m-add-task .modal-title');
  if (tl) tl.textContent = 'Edit Task';
  openModal('m-add-task');
}

function addTask() {
  const title = document.getElementById('mt-title')?.value.trim();
  if (!title) return;
  const priority = document.getElementById('mt-priority')?.value || 'none';
  const dueDate = document.getElementById('mt-due')?.value || '';
  const classId = parseInt(document.getElementById('mt-class')?.value || '') || null;
  const subtasksRaw = document.getElementById('mt-subtasks')?.value.trim() || '';
  const subtasks = subtasksRaw ? subtasksRaw.split('\n').filter(Boolean).map(s => ({ title: s.trim(), done: false })) : [];
  if (editingTaskId) {
    const t = tasks.find(x => x.id === editingTaskId);
    if (t) Object.assign(t, { title, priority, dueDate, classId, subtasks });
    editingTaskId = null;
    const tl = document.querySelector('#m-add-task .modal-title');
    if (tl) tl.textContent = 'Add Task';
  } else {
    tasks.unshift({ id: Date.now(), title, priority, dueDate, classId, subtasks, done: false });
  }
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
  renderProfileInfo();
  renderSbUpcoming();

  document.querySelectorAll('.sb-item[data-view]').forEach(item => {
    item.addEventListener('click', () => nav(item.dataset.view));
  });

  // Auto-reconnect Google Calendar silently on load (no user interaction required)
  if (gcalClientId) {
    updateGCalBtnUI(true);
    tryGCalSilentAuth();
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

  // One-time migration: move old moodboardImages into scrapbookPhotos
  if (moodboardImages.length && !S.get('mbMigrated')) {
    moodboardImages.forEach((img, i) => {
      if (!scrapbookPhotos.find(p => p.id === img.id)) {
        scrapbookPhotos.push({ id: img.id, url: img.url, caption: '', date: '', x: img.x || (i % 4) * 26, y: img.y || Math.floor(i / 4) * 220 + 10, w: img.w || 22 });
      }
    });
    moodboardImages = [];
    S.set('scrapbookPhotos', scrapbookPhotos);
    S.set('moodboardImages', []);
    S.set('mbMigrated', true);
  }

  // Auto-restart Pomodoro if it was running when the page was closed/navigated away
  if (_savedPom.running && _savedPom.rem > 0) {
    pom.running = true;
    pom.int = setInterval(() => {
      pom.rem--;
      S.set('pomState', { running: pom.running, mode: pom.mode, total: pom.total, rem: pom.rem, ses: pom.ses, mins: pom.mins });
      if (pom.rem <= 0) {
        clearInterval(pom.int);
        pom.running = false;
        pomBeep();
        if (pom.mode === 'work') {
          pom.ses++;
          pom.mins += Math.floor(pom.total / 60);
          const today = new Date().toLocaleDateString('sv-SE');
          if (!pomLog[today]) pomLog[today] = { sessions: 0, mins: 0 };
          pomLog[today].sessions++;
          pomLog[today].mins += Math.floor(pom.total / 60);
          S.set('pomLog', pomLog);
        }
        pom.rem = 0;
        S.set('pomState', { running: pom.running, mode: pom.mode, total: pom.total, rem: pom.rem, ses: pom.ses, mins: pom.mins });
        pomRender();
      } else {
        pomRender();
      }
    }, 1000);
  }

  // Restore last visited view instead of always going home
  nav(S.get('lastView') || 'home');
});

// ===== LECTURE RECORDER =====
let _recTranscript = '';
let _recClassId = null;
let _recMediaRecorder = null;
let _recChunks = [];
let _recTimerInterval = null;

function buildClassRecord(cls) {
  const recs = classTranscriptions
    .filter(r => r.classId === cls.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const recList = recs.length ? recs.map(r => `
    <div class="rec-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px">
        <div style="font-weight:600;font-size:14px;color:var(--td)">${escHtml(r.date)}</div>
        <button onclick="deleteTranscription(${r.id})" style="background:none;border:none;color:var(--tl);cursor:pointer;font-size:13px;flex-shrink:0" title="Delete">✕</button>
      </div>
      ${r.summary ? `<div class="rec-label">Summary</div><div class="rec-text">${escHtml(r.summary)}</div>` : ''}
      ${r.keyPoints ? `<div class="rec-label" style="margin-top:10px">Key Points</div><div class="rec-text" style="white-space:pre-line">${escHtml(r.keyPoints)}</div>` : ''}
      <details style="margin-top:10px">
        <summary style="font-size:12px;color:var(--tl);cursor:pointer;user-select:none">Show full transcript</summary>
        <div style="font-size:13px;color:var(--td);margin-top:8px;line-height:1.6;white-space:pre-wrap">${escHtml(r.transcript)}</div>
      </details>
    </div>`).join('')
    : '<div style="color:var(--tl);font-style:italic;font-size:14px;padding:8px 0">No transcriptions saved yet.</div>';

  const savedAai = S.get('sp_aai_key') || '';

  return `
    <div class="rec-wrap">
      <div class="card" style="margin-bottom:20px">
        <details style="margin-bottom:16px">
          <summary style="font-size:13px;font-weight:600;color:var(--tl);cursor:pointer;user-select:none">🔑 AssemblyAI Key ${savedAai ? '(saved ✓)' : '(required)'}</summary>
          <div style="margin-top:10px">
            <input type="password" id="rec-aai-key" value="${escHtml(savedAai)}" placeholder="Paste your AssemblyAI key..."
              style="width:100%;border:1px solid var(--border);border-radius:6px;padding:6px 10px;font-size:13px;background:var(--cream);color:var(--td);box-sizing:border-box"
              onchange="S.set('sp_aai_key', this.value.trim())">
          </div>
        </details>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;flex-wrap:wrap">
          <label style="font-size:13px;color:var(--tl);white-space:nowrap">Language:</label>
          <select id="rec-lang-sel" style="border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:13px;background:var(--cream);color:var(--td);cursor:pointer">
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px">
          <label class="rec-upload-btn">
            📎 Upload Audio File
            <input type="file" accept="audio/*" style="display:none" onchange="recHandleFile(event, ${cls.id})">
          </label>
          <button id="rec-live-btn" class="rec-upload-btn" style="border-color:var(--rose);color:var(--rose)" onclick="recStartLive(${cls.id})">
            🔊 Record Live Audio
          </button>
        </div>
        <div style="font-size:12px;color:var(--tl);margin-bottom:4px">Live recording captures Zoom, YouTube, any audio playing on your computer.</div>
        <div id="rec-status" style="font-size:13px;color:var(--tl);margin-top:10px;min-height:20px"></div>
        <div id="rec-timer" style="display:none;font-size:22px;font-weight:700;color:var(--rose);margin:10px 0;letter-spacing:.05em">00:00</div>
        <button id="rec-stop-btn" style="display:none;width:100%;margin-top:8px" class="btn-primary" onclick="recStopLive(${cls.id})">⬛ Stop & Transcribe</button>
        <div id="rec-analysis-box" style="display:none;margin-top:14px;border-top:1px solid var(--border);padding-top:14px">
          <div id="rec-analysis-content"></div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
            <button onclick="recSave(${cls.id})" class="btn-primary">Save Transcript</button>
            <button onclick="recCopyAndAnalyze()" class="btn-secondary" style="background:var(--teal);color:#fff;border-color:var(--teal)">📋 Copy & Open Claude.ai</button>
            <button onclick="recDiscard(${cls.id})" class="btn-secondary">Discard</button>
          </div>
          <div style="font-size:12px;color:var(--tl);margin-top:8px">Tip: Click "Copy & Open Claude.ai", then paste (Ctrl+V) to get summary and key points.</div>
        </div>
      </div>
      <div class="section-header" style="margin-bottom:12px">Saved Transcriptions</div>
      ${recList}
    </div>`;
}

async function recHandleFile(event, classId) {
  const file = event.target.files[0];
  if (!file) return;
  _recClassId = classId;
  _recTranscript = '';

  const status = document.getElementById('rec-status');
  const analysisBox = document.getElementById('rec-analysis-box');
  const analysisContent = document.getElementById('rec-analysis-content');

  status.textContent = `Uploading "${file.name}"...`;
  analysisBox.style.display = 'none';

  try {
    // Step 1: get AssemblyAI key
    const aaiInput = document.getElementById('rec-aai-key');
    let aaiKey = (aaiInput ? aaiInput.value.trim() : '') || S.get('sp_aai_key') || '';
    if (!aaiKey) { status.textContent = 'AssemblyAI key missing — open the 🔑 API Keys section above.'; return; }
    S.set('sp_aai_key', aaiKey);

    // Step 2: upload file to AssemblyAI
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: aaiKey, 'content-type': 'application/octet-stream' },
      body: file
    });
    if (!uploadRes.ok) throw new Error('Upload failed: ' + uploadRes.status);
    const { upload_url } = await uploadRes.json();

    // Step 3: request transcription
    const langSel = document.getElementById('rec-lang-sel');
    const lang = langSel ? langSel.value : 'sv';
    const txRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: aaiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ audio_url: upload_url, language_code: lang, speech_models: ['universal-2'] })
    });
    if (!txRes.ok) throw new Error('Transcription request failed: ' + txRes.status);
    const { id } = await txRes.json();

    // Step 4: poll until done
    status.textContent = 'Transcribing... this may take a minute for long files.';
    let transcript = '';
    while (true) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: { authorization: aaiKey }
      });
      const pollData = await pollRes.json();
      if (pollData.status === 'completed') { transcript = pollData.text; break; }
      if (pollData.status === 'error') throw new Error('Transcription error: ' + pollData.error);
    }

    _recTranscript = transcript;
    status.textContent = 'Done — save or copy to Claude.ai for analysis.';
    analysisBox.style.display = 'block';
    analysisContent.innerHTML = `<div class="rec-text" style="white-space:pre-wrap;max-height:180px;overflow-y:auto">${escHtml(transcript)}</div>`;

  } catch (err) {
    status.textContent = 'Error: ' + err.message;
  }
}

async function recStartLive(classId) {
  _recClassId = classId;
  _recChunks = [];

  const status = document.getElementById('rec-status');
  const timer = document.getElementById('rec-timer');
  const stopBtn = document.getElementById('rec-stop-btn');
  const liveBtn = document.getElementById('rec-live-btn');
  const analysisBox = document.getElementById('rec-analysis-box');

  // Show instructions overlay before Chrome dialog opens
  const confirmed = await new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `
      <div style="background:var(--cream);border-radius:16px;padding:28px 32px;max-width:400px;width:90%;box-shadow:0 8px 40px rgba(0,0,0,.25)">
        <div style="font-size:18px;font-weight:700;color:var(--teal-d);margin-bottom:14px">Before the dialog opens</div>
        <p style="font-size:14px;line-height:1.6;color:#555;margin:0 0 10px">In Chrome's share dialog:</p>
        <ol style="font-size:14px;line-height:1.9;color:#444;margin:0 0 18px;padding-left:20px">
          <li>Click the <strong>Entire Screen</strong> tab (not Window or Tab)</li>
          <li>Check ✅ <strong>"Share system audio"</strong> at the bottom</li>
          <li>Click <strong>Share</strong></li>
        </ol>
        <p style="font-size:12px;color:#888;margin:0 0 20px">Without "Share system audio", Zoom audio won't be captured.</p>
        <div style="display:flex;gap:10px">
          <button onclick="this.closest('div[style]').parentNode.__resolve(true)" style="flex:1;padding:10px;background:var(--teal);color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600">Got it — Open Dialog</button>
          <button onclick="this.closest('div[style]').parentNode.__resolve(false)" style="flex:1;padding:10px;background:none;border:1px solid var(--border);border-radius:8px;font-size:14px;cursor:pointer;color:#666">Cancel</button>
        </div>
      </div>`;
    overlay.__resolve = resolve;
    document.body.appendChild(overlay);
    overlay.querySelector('button:last-child').onclick = () => { document.body.removeChild(overlay); resolve(false); };
    overlay.querySelector('button:first-child').onclick = () => { document.body.removeChild(overlay); resolve(true); };
  });

  if (!confirmed) return;

  try {
    // video:true is required by Chrome; we keep video tracks alive so audio keeps flowing
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { width: 1, height: 1 },
      audio: { echoCancellation: false, noiseSuppression: false }
    });

    if (!stream.getAudioTracks().length) {
      stream.getTracks().forEach(t => t.stop());
      status.innerHTML = '⚠️ No audio captured. Did you select <strong>Entire Screen</strong> and check <strong>Share system audio</strong>?';
      return;
    }

    // Record audio only, but keep the full stream (with video) alive so Chrome doesn't cut audio
    const audioStream = new MediaStream(stream.getAudioTracks());
    _recMediaRecorder = new MediaRecorder(audioStream);
    _recMediaRecorder._fullStream = stream; // keep reference for cleanup
    _recMediaRecorder.ondataavailable = e => { if (e.data.size > 0) _recChunks.push(e.data); };
    _recMediaRecorder.onstop = () => recProcessLive(classId);
    _recMediaRecorder.start(1000);

    // Timer
    let secs = 0;
    if (_recTimerInterval) clearInterval(_recTimerInterval);
    _recTimerInterval = setInterval(() => {
      secs++;
      const m = String(Math.floor(secs / 60)).padStart(2, '0');
      const s = String(secs % 60).padStart(2, '0');
      if (timer) timer.textContent = `${m}:${s}`;
    }, 1000);

    status.textContent = 'Recording — play your video/lecture now.';
    if (timer) timer.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'block';
    if (liveBtn) liveBtn.style.display = 'none';
    if (analysisBox) analysisBox.style.display = 'none';

    // Auto-stop if user closes the share dialog
    stream.getAudioTracks()[0].onended = () => recStopLive(classId);

  } catch (e) {
    status.textContent = e.name === 'NotAllowedError' ? 'Permission denied — click Allow in the dialog.' : 'Error: ' + e.message;
  }
}

function recStopLive(classId) {
  if (_recTimerInterval) { clearInterval(_recTimerInterval); _recTimerInterval = null; }
  const timer = document.getElementById('rec-timer');
  const stopBtn = document.getElementById('rec-stop-btn');
  const liveBtn = document.getElementById('rec-live-btn');
  if (timer) timer.style.display = 'none';
  if (stopBtn) stopBtn.style.display = 'none';
  if (liveBtn) liveBtn.style.display = 'inline-flex';
  if (_recMediaRecorder && _recMediaRecorder.state !== 'inactive') {
    _recMediaRecorder.stop();
    // Stop the full display stream (including video tracks) so the screen share ends
    if (_recMediaRecorder._fullStream) _recMediaRecorder._fullStream.getTracks().forEach(t => t.stop());
    _recMediaRecorder.stream.getTracks().forEach(t => t.stop());
  }
}

async function recProcessLive(classId) {
  const status = document.getElementById('rec-status');
  const analysisBox = document.getElementById('rec-analysis-box');
  const analysisContent = document.getElementById('rec-analysis-content');

  if (!_recChunks.length) { status.textContent = 'No audio recorded.'; return; }

  try {
    const aaiInput = document.getElementById('rec-aai-key');
    let aaiKey = (aaiInput ? aaiInput.value.trim() : '') || S.get('sp_aai_key') || '';
    if (!aaiKey) { status.textContent = 'AssemblyAI key missing — open the 🔑 API Keys section above.'; return; }
    S.set('sp_aai_key', aaiKey);

    status.textContent = 'Uploading recording...';
    const blob = new Blob(_recChunks, { type: 'audio/webm' });
    const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: { authorization: aaiKey },
      body: blob
    });
    if (!uploadRes.ok) throw new Error('Upload failed: ' + uploadRes.status);
    const { upload_url } = await uploadRes.json();

    const langSel = document.getElementById('rec-lang-sel');
    const lang = langSel ? langSel.value : 'sv';
    status.textContent = 'Transcribing...';
    const txRes = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { authorization: aaiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ audio_url: upload_url, language_code: lang, speech_models: ['universal-2'] })
    });
    if (!txRes.ok) throw new Error('Request failed: ' + txRes.status);
    const { id } = await txRes.json();

    while (true) {
      await new Promise(r => setTimeout(r, 3000));
      const poll = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, { headers: { authorization: aaiKey } });
      const data = await poll.json();
      if (data.status === 'completed') { _recTranscript = data.text || ''; break; }
      if (data.status === 'error') throw new Error(data.error);
    }

    if (!_recTranscript) { status.textContent = 'No speech detected.'; return; }

    status.textContent = 'Done — save or copy to Claude.ai for analysis.';
    analysisBox.style.display = 'block';
    analysisContent.innerHTML = `<div class="rec-text" style="white-space:pre-wrap;max-height:180px;overflow-y:auto">${escHtml(_recTranscript)}</div>`;

  } catch (err) {
    if (status) status.textContent = 'Error: ' + err.message;
  }
}

function recCopyAndAnalyze() {
  if (!_recTranscript) return;
  const langSel = document.getElementById('rec-lang-sel');
  const lang = langSel ? langSel.value : 'sv';
  const langName = lang === 'sv' ? 'svenska' : 'English';
  const fullPrompt = `You are helping a university student study. Analyze this lecture transcript and provide:\n\n1. **Sammanfattning** — An academic summary in Swedish (4-6 sentences), written clearly and precisely as if for study notes.\n2. **Nyckelbegrepp** — Key concepts and terms as a bullet list in Swedish, with a brief explanation for each.\n3. **Key Points** — The most important takeaways in English as a bullet list, focused on what to remember for exams.\n\nTranscript:\n"""\n${_recTranscript}\n"""`;
  navigator.clipboard.writeText(fullPrompt).then(() => {
    window.open('https://claude.ai', '_blank');
    const status = document.getElementById('rec-status');
    if (status) status.textContent = 'Copied! Just paste (Ctrl+V) in Claude.ai and press Enter.';
  }).catch(() => {
    const status = document.getElementById('rec-status');
    if (status) status.textContent = 'Could not copy — select the text above and copy manually.';
  });
}

function recSave(classId) {
  classTranscriptions.push({
    id: Date.now(),
    classId,
    date: new Date().toLocaleDateString('sv-SE'),
    transcript: _recTranscript,
    summary: '',
    keyPoints: ''
  });
  S.set('classTranscriptions', classTranscriptions);
  _recTranscript = '';
  const cls = classes.find(c => c.id === classId);
  if (cls) renderClassSectionBody(cls);
}

function recDiscard(classId) {
  _recTranscript = '';
  const cls = classes.find(c => c.id === (classId || activeClassId));
  if (cls) renderClassSectionBody(cls);
}

function deleteTranscription(id) {
  if (!confirm('Delete this recording?')) return;
  classTranscriptions = classTranscriptions.filter(r => r.id !== id);
  S.set('classTranscriptions', classTranscriptions);
  const cls = classes.find(c => c.id === activeClassId);
  if (cls) renderClassSectionBody(cls);
}

// ===== AI STUDY PLANNER =====
const AI_SYSTEM = `You are a warm, practical AI study planner for Sofia, a chemistry student at YH Akademin in Sweden. She studies organic chemistry (LA25 Organisk kemi) and inorganic chemistry, and does home lab practice.

Help her plan studies, break down topics, suggest schedules, and prepare for exams. Be encouraging and concise. Use bullet points and headers for plans. Respond in the same language the user writes in (Swedish or English).

When creating study plans:
- Ask about which topics are covered if not stated
- Suggest Pomodoro sessions (25 min work / 5 min break)
- Prioritize harder topics earlier in the plan
- Include a review session the day before the exam
- Keep plans realistic given the available days`;

let aiHistory = [];
let aiOpen = false;

function toggleAI() {
  aiOpen = !aiOpen;
  document.getElementById('ai-panel').classList.toggle('open', aiOpen);
  if (aiOpen && aiHistory.length === 0) {
    aiAddBot('Hej Sofia! 👋 Jag är din studieplanerare. Berätta när du har tentamen och vilka ämnen som ingår, så skapar vi en plan!');
  }
}

function clearAIChat() {
  aiHistory = [];
  document.getElementById('ai-msgs').innerHTML = '';
  aiAddBot('Hej Sofia! 👋 Jag är din studieplanerare. Berätta när du har tentamen och vilka ämnen som ingår, så skapar vi en plan!');
  document.getElementById('ai-chips').style.display = '';
}

function aiAddUser(text) {
  const el = document.createElement('div');
  el.className = 'ai-msg-user';
  el.textContent = text;
  document.getElementById('ai-msgs').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth' });
}

function aiAddBot(text) {
  const el = document.createElement('div');
  el.className = 'ai-msg-bot';
  el.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br>');
  document.getElementById('ai-msgs').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth' });
}

function aiTyping(show) {
  const existing = document.getElementById('ai-typing-indicator');
  if (show && !existing) {
    const el = document.createElement('div');
    el.className = 'ai-typing';
    el.id = 'ai-typing-indicator';
    el.textContent = '✨ Skriver…';
    document.getElementById('ai-msgs').appendChild(el);
    el.scrollIntoView({ behavior: 'smooth' });
  } else if (!show && existing) {
    existing.remove();
  }
}

function aiChip(text) {
  document.getElementById('ai-chips').style.display = 'none';
  aiSendMessage(text);
}

function aiKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    aiSend();
  }
}

function aiSend() {
  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  aiSendMessage(text);
}

async function aiSendMessage(text) {
  document.getElementById('ai-chips').style.display = 'none';
  aiAddUser(text);
  aiHistory.push({ role: 'user', content: text });
  aiTyping(true);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: AI_SYSTEM,
        messages: aiHistory,
        model: 'claude-haiku-4-5-20251001'
      })
    });
    const data = await res.json();
    aiTyping(false);
    const reply = data?.content?.[0]?.text || 'Något gick fel. Försök igen.';
    aiHistory.push({ role: 'assistant', content: reply });
    aiAddBot(reply);
  } catch {
    aiTyping(false);
    aiAddBot('⚠️ Kunde inte nå AI. Kontrollera att ANTHROPIC_API_KEY är inställd i Cloudflare Pages → Settings → Environment Variables.');
  }
}
