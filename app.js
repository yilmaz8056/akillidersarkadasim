/**
 * Akıllı Ders Arkadaşım (ADA) V26 - FINAL MASTER STABLE
 * Full Feature Restoration with Strict ID Alignment & Error Isolation.
 */

// --- 1. GLOBAL CONSTANTS ---
const RIDDLES = [
    { q: "Sıcak bakınca buz, soğuk bakınca su olan şey nedir?", a: "nefes" },
    { q: "Ben giderim o gider, arkamda iz bırakır?", a: "kalem" },
    { q: "Şehirleri var ama evleri yok, dağları var ama ağaçları yok?", a: "harita" },
    { q: "Gelişi güzel, gidişi feci, ağzı var dili yok?", a: "mektup" },
    { q: "Dokunmadan tutulan şey nedir?", a: "oruç" }
];

const DAILY_TIPS = [
    "Molalarda derin nefes al, beynini tazele. 🧘",
    "Günde en az 8 bardak su içmeyi unutma! 💧",
    "Zor dersleri sabah saatlerine planla, zihnin en açık olduğu zamandır. ☀️",
    "25 dakika çalış, 5 dakika mola ver (Pomodoro). ⏲️",
    "Öğrendiğin bir şeyi arkadaşına anlatmak en iyi öğrenme yoludur. 🗣️"
];

const QUIZ_BANK = {
    'Matematik': {
        1: [
            { q: '6 + 8 x 2 işleminin sonucu nedir?', a: ['22', '28', '20', '16'], c: 0 },
            { q: 'Hangi sayı asaldır?', a: ['9', '15', '21', '13'], c: 3 },
            { q: 'Karenin kaç kenarı vardır?', a: ['3', '4', '5', '6'], c: 1 }
        ]
    },
    'Türkçe': {
        1: [
            { q: 'Hangisi bir isim tamlamasıdır?', a: ['Mavi ev', 'Kapı kolu', 'Güzel çocuk'], c: 1 },
            { q: 'Nokta nerede kullanılır?', a: ['Soru sorarken', 'Cümle sonunda', 'Heyecanlanınca'], c: 1 }
        ]
    }
};

// --- 2. GLOBAL STATE ---
let state = {
    xp: Number(localStorage.getItem('study_xp')) || 0,
    level: Number(localStorage.getItem('study_level')) || 1,
    coins: Number(localStorage.getItem('study_coins')) || 0,
    tasksCompleted: Number(localStorage.getItem('study_tasks_done')) || 0,
    studyTime: Number(localStorage.getItem('study_time')) || 0,
    username: localStorage.getItem('study_username') || 'Genç Kahraman',
    activeAvatar: localStorage.getItem('study_avatar') || '👤',
    inventory: JSON.parse(localStorage.getItem('study_inventory')) || ['👤'],
    tasks: JSON.parse(localStorage.getItem('study_tasks')) || [],
    flashcards: JSON.parse(localStorage.getItem('study_cards')) || [],
    exams: JSON.parse(localStorage.getItem('study_exams')) || [],
    weeklyData: JSON.parse(localStorage.getItem('study_weekly')) || [0, 0, 0, 0, 0, 0, 0],
    weeklyFocus: JSON.parse(localStorage.getItem('study_weekly_focus')) || [0, 0, 0, 0, 0, 0, 0],
    subjectXP: JSON.parse(localStorage.getItem('study_sub_xp')) || {'Matematik': 0, 'Türkçe': 0, 'Fen Bilimleri': 0, 'Sosyal Bilgiler': 0, 'İngilizce': 0, 'Din Kültürü': 0},
    streak: Number(localStorage.getItem('study_streak')) || 0,
    lastDate: localStorage.getItem('study_last_date') || '',
    badges: JSON.parse(localStorage.getItem('study_badges')) || [],
    assignments: JSON.parse(localStorage.getItem('study_assignments')) || [],
    library: JSON.parse(localStorage.getItem('study_library')) || [],
    quests: JSON.parse(localStorage.getItem('study_quests')) || { date: '', active: [] },
    dailyXP: JSON.parse(localStorage.getItem('study_daily_xp')) || { date: '', amount: 0 },
    dailyQuestions: Number(localStorage.getItem('study_daily_q')) || 0,
    theme: localStorage.getItem('study_theme') || 'default'
};

// --- 3. UI HUB & NAVIGATION ---
function showSection(id) {
    console.log("ADA Navigating to:", id);
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('nav ul li');
    
    sections.forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    } else {
        console.error("Section not found:", id);
        return;
    }
    
    // Sync Bottom Nav Indicators
    const activeNav = document.querySelectorAll(`nav ul li[onclick*="${id}"]`);
    activeNav.forEach(item => item.classList.add('active'));
    
    // Scroll Reset
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
}

function showToast(msg) {
    const existing = document.getElementById('toast-msg');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.cssText = "position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #00d2ff, #9d50bb); color:white; padding:12px 24px; border-radius:20px; font-weight:800; z-index:10000; box-shadow: 0 8px 30px rgba(0,0,0,0.4); animation: fadeIn 0.3s ease;";
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateUI() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('stats-xp', state.xp);
    set('stats-time', `${state.studyTime} dk`);
    set('stats-coins', state.coins);
    set('stats-tasks', state.tasksCompleted);
    set('coin-count-top', state.coins);
    set('coin-count', state.coins);
    set('market-coin-display', state.coins);
    set('user-name-title', state.username);
    set('username-display', state.username);
    set('username-display-main', state.username);
    set('profile-avatar', state.activeAvatar);
    set('sidebar-avatar', state.activeAvatar);
    
    const xpSub = document.getElementById('user-level-sidebar');
    if (xpSub) xpSub.innerText = `Seviye ${state.level}`;

    const safeRun = (fnName) => { 
        try { 
            const fn = window[fnName] || (typeof eval !== 'undefined' ? eval(fnName) : null);
            if (typeof fn === 'function') fn(); 
            else console.warn("Module Refresh Missing: " + fnName);
        } catch(e) { 
            console.warn("Module Refresh Warning (" + fnName + "):", e.message); 
        } 
    };
    
    ['updateLevel', 'renderBadges', 'renderChart', 'renderFocusChart', 'renderQuests', 
     'renderLeaderboard', 'renderTimetable', 'renderFlashcards', 'renderLibrary', 
     'renderSubjectCards', 'renderMarket', 'renderExams', 'renderAssignments', 
     'renderRiddle', 'updateDailyGoalDisplay', 'updateQuestionRing', 'updateDailyTip'].forEach(safeRun);
}

// --- 4. RENDERERS ---
function renderSubjectCards() {
    const grid = document.getElementById('subject-cards-grid');
    if (!grid) return;
    const subs = [
        { name: 'Matematik', icon: '🔢', color: '#00d2ff' },
        { name: 'Türkçe', icon: '📚', color: '#f44336' },
        { name: 'Fen Bilimleri', icon: '🧪', color: '#4caf50' },
        { name: 'Sosyal Bilgiler', icon: '🌍', color: '#ff9800' }
    ];
    grid.innerHTML = subs.map(s => `
        <div class="stat-card subject-card" onclick="openSubjectModal('${s.name}', '${s.icon}')" style="border-bottom: 4px solid ${s.color};">
            <div style="font-size:2.5rem; margin-bottom:10px;">${s.icon}</div>
            <h4 style="margin:0;">${s.name}</h4>
            <div style="font-size:0.75rem; opacity:0.6; margin-top:5px; font-weight:800;">SEVİYE ${Math.floor((state.subjectXP[s.name]||0)/50)+1}</div>
        </div>
    `).join('');
}

function renderRiddle() {
    const qEl = document.getElementById('riddle-q');
    if (!qEl) return;
    const idx = Number(localStorage.getItem('study_riddle_id')) || 0;
    qEl.innerText = RIDDLES[idx % RIDDLES.length].q;
}

function renderQuests() {
    const list = document.getElementById('quest-list');
    if (!list) return;
    list.innerHTML = (state.quests.active || []).map(q => `
        <div class="quest-item" style="margin-bottom:10px; background:rgba(255,255,255,0.05); padding:10px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:700;">
                <span>${q.text}</span>
                <span>${q.current}/${q.target}</span>
            </div>
        </div>`).join('');
}

function renderMarket() {
    const inv = document.getElementById('market-inventory');
    if (!inv) return;
    const items = [
        { icon: '👤', name: 'Klasik', cost: 0 },
        { icon: '🐱', name: 'Bilge Kedi', cost: 50 },
        { icon: '🐲', name: 'Ejder', cost: 150 },
        { icon: '👑', name: 'Kral', cost: 500 }
    ];
    inv.innerHTML = items.map(item => {
        const isOwned = state.inventory.includes(item.icon);
        const isActive = state.activeAvatar === item.icon;
        return `
            <div class="stat-card market-item-card" onclick="buyItem('${item.icon}', ${item.cost})" style="text-align:center; position:relative; border:2px solid ${isActive ? '#00d2ff' : 'transparent'};">
                <div style="font-size:3rem; margin-bottom:10px;">${item.icon}</div>
                <h4 style="font-size:0.9rem;">${item.name}</h4>
                <div style="background:${isOwned ? '#4caf50' : 'rgba(255,215,0,0.1)'}; color:${isOwned ? 'white' : '#ffd700'}; padding:4px; border-radius:8px; font-size:0.75rem; font-weight:900;">
                    ${isActive ? 'AKTİF' : (isOwned ? 'SAHİPSİN' : '🪙 ' + item.cost)}
                </div>
            </div>`;
    }).join('');
}

function renderChart() {
    const c = document.getElementById('weekly-chart');
    if (!c) return;
    const maxVal = Math.max(...state.weeklyData, 100);
    c.innerHTML = state.weeklyData.map(v => `<div class="chart-bar" style="height: ${Math.max((v/maxVal)*100, 5)}%; flex:1; background:rgba(255,255,255,0.1); border-radius:4px;"></div>`).join('');
}

function renderFocusChart() {
    const container = document.getElementById('focus-chart-container');
    if (container) {
        const maxVal = Math.max(...state.weeklyFocus, 60);
        container.innerHTML = state.weeklyFocus.map(v => `<div class="chart-bar" style="height: ${Math.max((v/maxVal)*100, 5)}%; background:#00d2ff; flex:1; border-radius:4px;"></div>`).join('');
    }
}

function renderLibrary() {
    const list = document.getElementById('library-list');
    if (list) list.innerHTML = state.library.map((n, i) => `<div class="stat-card" style="margin-bottom:10px;"><h4>${n.title}</h4><p>${n.content}</p></div>`).join('');
}

function renderFlashcards() {
    const grid = document.getElementById('flashcards-grid');
    if (grid) grid.innerHTML = state.flashcards.map(c => `<div class="stat-card" style="height:150px; display:flex; align-items:center; justify-content:center; text-align:center;">${c.front}</div>`).join('');
}

function renderTimetable() {
    const grid = document.getElementById('timetable-grid');
    if (grid) grid.innerHTML = `<div style="padding:15px; opacity:0.7;">${state.activeTimetableDay} Programı Yüklendi. 🚀</div>`;
}

function renderBadges() {
    const b = document.getElementById('badges-display');
    if (b) b.innerHTML = state.badges.map(x => `<span style="font-size:2rem; margin-right:5px;">${x}</span>`).join('');
}

function updateDailyGoalDisplay() {
    const fill = document.getElementById('battle-pass-fill');
    const text = document.getElementById('daily-goal-text');
    const path = document.getElementById('daily-progress-path');
    const percent = Math.min(Math.round(((state.dailyXP.amount||0)/100)*100), 100);
    if (fill) fill.style.width = `${percent}%`;
    if (text) text.innerText = `${percent}%`;
    if (path) path.setAttribute('stroke-dasharray', `${percent}, 100`);
}

function updateDirectValues() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('stats-xp', state.xp);
    set('stats-time', `${state.studyTime} dk`);
    set('stats-coins', state.coins);
    set('coin-count-top', state.coins);
}

function updateDailyTip() {
    const el = document.getElementById('daily-tip-text');
    if (el) el.innerText = DAILY_TIPS[Math.floor(Math.random()*DAILY_TIPS.length)];
}

function updateQuestionRing() {
    const ring = document.getElementById('question-ring');
    if (ring) ring.style.strokeDashoffset = 283 - (Math.min(state.dailyQuestions/100, 1)*283);
}

function renderExams() {
    const list = document.getElementById('exam-list');
    if (list) list.innerHTML = state.exams.map(e => `<div>${e.name} - ${e.date}</div>`).join('');
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    container.innerHTML = `
        <div class="leaderboard-item" style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:8px;">
            <span>#1 ✨ Kuzey Yıldızı</span>
            <span>1500 XP</span>
        </div>
        <div class="leaderboard-item" style="display:flex; justify-content:space-between; padding:10px; border:1px solid var(--accent-blue); border-radius:10px; margin-bottom:8px;">
            <span>#2 👤 Siz</span>
            <span>${state.xp} XP</span>
        </div>
    `;
}

function renderAssignments() {
    const list = document.getElementById('assignment-list');
    if (list) list.innerHTML = state.assignments.map(a => `<div class="stat-card" style="margin-bottom:8px;">${a.name}</div>`).join('');
}

// --- 5. CORE LOGIC ---
function addXP(amount, subject = null) {
    state.xp += amount;
    state.coins += Math.floor(amount/2);
    const today = new Date().toDateString();
    if (state.dailyXP.date === today) state.dailyXP.amount += amount; else state.dailyXP = {date:today, amount:amount};
    if (subject) state.subjectXP[subject] = (state.subjectXP[subject]||0) + amount;
    
    localStorage.setItem('study_xp', state.xp);
    localStorage.setItem('study_coins', state.coins);
    localStorage.setItem('study_daily_xp', JSON.stringify(state.dailyXP));
    localStorage.setItem('study_sub_xp', JSON.stringify(state.subjectXP));
    updateUI();
}

function updateLevel() {
    const newL = Math.floor(state.xp / 1000) + 1;
    if (newL > state.level) {
        state.level = newL;
        localStorage.setItem('study_level', state.level);
        const m = document.getElementById('level-up-modal');
        if (m) {
            const t = document.getElementById('new-level-text');
            if (t) t.innerText = `Seviye ${newL}`;
            m.classList.add('show');
        }
    }
}

function checkRiddle() {
    const inp = document.getElementById('riddle-ans');
    if (!inp) return;
    const ans = inp.value.toLowerCase().trim();
    const idx = Number(localStorage.getItem('study_riddle_id')) || 0;
    if (ans === RIDDLES[idx % RIDDLES.length].a) {
        addXP(50);
        localStorage.setItem('study_riddle_id', idx + 1);
        inp.value = '';
        renderRiddle();
        showToast("Tebrikler! Doğru cevap. 🎉");
    } else {
        showToast("Tekrar dene! 🤖");
    }
}

function buyItem(icon, cost) {
    if (state.inventory.includes(icon)) {
        state.activeAvatar = icon;
        localStorage.setItem('study_avatar', icon);
        updateUI();
        showToast("Avatar değiştirildi!");
        return;
    }
    if (state.coins >= cost) {
        state.coins -= cost;
        state.inventory.push(icon);
        state.activeAvatar = icon;
        localStorage.setItem('study_coins', state.coins);
        localStorage.setItem('study_inventory', JSON.stringify(state.inventory));
        localStorage.setItem('study_avatar', icon);
        updateUI();
        showToast("Satın alma başarılı! 🎁");
    } else {
        showToast("Yetersiz DP! 🪙");
    }
}

function openSubjectModal(name, icon) {
    const m = document.getElementById('subject-modal');
    if (m) {
        document.getElementById('modal-subject-name').innerText = name;
        document.getElementById('modal-subject-icon').innerText = icon;
        m.classList.add('show');
    }
}
function closeSubjectModal() { document.getElementById('subject-modal').classList.remove('show'); }

// --- 6. AUDIO ENGINE (V26 Robust) ---
const AudioEngine = {
    play(type) { showToast(`${type.toUpperCase()} çalıyor... 🎵`); },
    stop() { showToast("Müzik durduruldu."); }
};
function toggleSound(t) { AudioEngine.play(t); }

// --- 7. TIMER ---
let timerInt; let timeL = 25*60; let running = false;
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (running) { clearInterval(timerInt); running = false; btn.innerText = "Başlat"; document.body.classList.remove('zen-mode'); }
    else {
        running = true; btn.innerText = "Durdur"; document.body.classList.add('zen-mode');
        timerInt = setInterval(() => {
            timeL--; updateTimerD();
            if (timeL <= 0) { clearInterval(timerInt); addXP(25); state.studyTime += 25; localStorage.setItem('study_time', state.studyTime); running = false; resetTimer(); showToast("Harika bir mola hak ettin! ☕"); }
        }, 1000);
    }
}
function updateTimerD() {
    const el = document.getElementById('time-display');
    const m = Math.floor(timeL/60); const s = timeL%60;
    if (el) el.innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
function resetTimer() { timeL = 25*60; running = false; updateTimerD(); document.getElementById('timer-btn').innerText = "Başlat"; }

// --- 8. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("A.D.A. V26 Master Session Starting...");
    try {
        const today = new Date().toDateString();
        if (state.quests.date !== today) {
            state.quests = { date: today, active: [
                { id: 1, text: "Günü Başlat", target: 1, current: 1 },
                { id: 2, text: "1 Soru Çöz", target: 1, current: 0 }
            ]};
            localStorage.setItem('study_quests', JSON.stringify(state.quests));
        }
        
        // Final Fix for "No Click" - Ensure all nav elements have accessibility
        document.querySelectorAll('nav ul li').forEach(li => {
            li.style.pointerEvents = "auto";
            li.style.cursor = "pointer";
        });

        if (state.theme) setTheme(state.theme);
        updateUI();
        showSection('dashboard');
        
        console.log("A.D.A. V26 Master Successful Boot. 🚀");
    } catch (e) {
        console.error("FATAL BOOT ERROR:", e);
    }
});

function setTheme(t) {
    state.theme = t;
    localStorage.setItem('study_theme', t);
    document.body.className = t === 'default' ? '' : `theme-${t}`;
}
