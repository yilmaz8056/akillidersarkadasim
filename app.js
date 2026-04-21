/**
 * Akıllı Ders Arkadaşım (ADA) V25 - EMERGENCY BOOT FIX
 * Replaces window.onload with DOMContentLoaded for immediate responsiveness.
 * Added strict type casting and null checks to prevent silent crashes.
 */

// --- Constants ---
const RIDDLES = [
    { q: "Sıcak bakınca buz, soğuk bakınca su olan şey nedir?", a: "nefes" },
    { q: "Ben giderim o gider, arkamda iz bırakır?", a: "kalem" },
    { q: "Şehirleri var ama evleri yok, dağları var ama ağaçları yok?", a: "harita" }
];

const DAILY_TIPS = [
    "Molalarda derin nefes al. 🧘",
    "Günde en az 8 bardak su iç! 💧",
    "Kitap okumak hayal gücünü besler. 📚"
];

// --- State ---
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
    weeklyData: JSON.parse(localStorage.getItem('study_weekly')) || [0,0,0,0,0,0,0],
    weeklyFocus: JSON.parse(localStorage.getItem('study_weekly_focus')) || [0,0,0,0,0,0,0],
    subjectXP: JSON.parse(localStorage.getItem('study_sub_xp')) || {'Matematik': 0, 'Türkçe': 0},
    badges: JSON.parse(localStorage.getItem('study_badges')) || [],
    theme: localStorage.getItem('study_theme') || 'default',
    assignments: JSON.parse(localStorage.getItem('study_assignments')) || [],
    library: JSON.parse(localStorage.getItem('study_library')) || [],
    quests: JSON.parse(localStorage.getItem('study_quests')) || { date: '', active: [] },
    dailyXP: JSON.parse(localStorage.getItem('study_daily_xp')) || { date: '', amount: 0 },
    dailyQuestions: Number(localStorage.getItem('study_daily_q')) || 0
};

// --- CORE UI ---
function showSection(id) {
    console.log("Section Değişiyor:", id);
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav ul li').forEach(l => l.classList.remove('active'));
    
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    
    // Bottom nav and Sidebar both match here
    const navItems = document.querySelectorAll(`nav ul li[onclick*="${id}"]`);
    navItems.forEach(item => item.classList.add('active'));
}

function showToast(msg) {
    const t = document.createElement('div');
    t.innerText = msg;
    t.style.cssText = "position:fixed; bottom:90px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:10px 20px; border-radius:20px; z-index:9999;";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

function updateUI() {
    console.log("UI Güncelleniyor...");
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('stats-xp', state.xp);
    set('stats-coins', state.coins);
    set('coin-count', state.coins);
    set('user-name-title', state.username);
    set('profile-avatar', state.activeAvatar);
    
    const run = (fn) => { try { if (typeof fn === 'function') fn(); } catch(e) { console.error("Modül hatası:", e); } };
    run(renderSubjectCards);
    run(renderQuests);
    run(renderRiddle);
    run(renderTasks);
    run(renderLibrary);
    run(renderMarket);
    run(renderChart);
    run(renderBadges);
    run(updateDailyGoalDisplay);
}

// --- Renders ---
function renderSubjectCards() {
    const grid = document.getElementById('subject-cards-grid');
    if (!grid) return;
    const subs = [
        { n: 'Matematik', i: '🔢', c: '#00d2ff' },
        { n: 'Türkçe', i: '📚', c: '#f44336' },
        { n: 'Fen Bilimleri', i: '🧪', c: '#4caf50' }
    ];
    grid.innerHTML = subs.map(s => `
        <div class="stat-card" onclick="openSubjectModal('${s.n}', '${s.i}')" style="border-bottom:3px solid ${s.c}; text-align:center;">
            <div style="font-size:2rem;">${s.i}</div>
            <div style="font-weight:800; font-size:0.9rem;">${s.n}</div>
        </div>
    `).join('');
}

function renderRiddle() {
    const q = document.getElementById('riddle-q');
    if (!q) return;
    const idx = Number(localStorage.getItem('study_riddle_id')) || 0;
    q.innerText = RIDDLES[idx % RIDDLES.length].q;
}

function renderQuests() {
    const list = document.getElementById('quest-list');
    if (list) list.innerHTML = (state.quests.active || []).map(q => `<li>${q.text}</li>`).join('');
}

function renderTasks() {
    const list = document.getElementById('task-list');
    if (list) list.innerHTML = state.tasks.map(t => `<div onclick="toggleTask(${t.id})">${t.completed ? '✓' : '○'} ${t.text}</div>`).join('');
}

function renderLibrary() {
    const list = document.getElementById('library-list');
    if (list) list.innerHTML = state.library.map(n => `<div>${n.title}</div>`).join('');
}

function renderMarket() {
    const inv = document.getElementById('market-inventory');
    if (inv) inv.innerHTML = `<div onclick="showToast('Market Hazırlanıyor!')">🎁 Daha Fazla Avatar Yakında!</div>`;
}

function renderChart() {
    const c = document.getElementById('weekly-chart');
    if (c) c.innerHTML = state.weeklyData.map(v => `<div style="height:${Math.min(v, 100)}%"></div>`).join('');
}

function renderBadges() {
    const b = document.getElementById('badges-display');
    if (b) b.innerHTML = state.badges.join('');
}

function updateDailyGoalDisplay() {
    const f = document.getElementById('battle-pass-fill');
    if (f) f.style.width = `${Math.min(state.dailyXP.amount, 100)}%`;
}

// --- Features ---
function toggleTask(id) {
    const t = state.tasks.find(x => x.id === id);
    if (t) { t.completed = !t.completed; localStorage.setItem('study_tasks', JSON.stringify(state.tasks)); updateUI(); }
}

function buyItem(avg, cost) { showToast("Satın alma başarılı!"); }

function openSubjectModal(n, i) {
    const m = document.getElementById('subject-modal');
    if (m) {
        document.getElementById('modal-subject-name').innerText = n;
        document.getElementById('modal-subject-icon').innerText = i;
        m.classList.add('show');
    }
}
function closeSubjectModal() { document.getElementById('subject-modal').classList.remove('show'); }

function openQuiz(s) { showToast(`${s} testi açılıyor!`); }
function toggleSound(t) { showToast(`${t} çalıyor...`); }
function resetTimer() { showToast("Zaman sıfırlandı."); }
function toggleTimer() { showToast("Zamanlayıcı başladı."); }

// --- BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("A.D.A. Yükleniyor (V25)...");
    try {
        const today = new Date().toDateString();
        if (state.quests.date !== today) {
            state.quests = { date: today, active: [{id:1, text:"Günün Hedefi", target:100, current:0}] };
            localStorage.setItem('study_quests', JSON.stringify(state.quests));
        }
        updateUI();
        showSection('dashboard');
        console.log("A.D.A. Başarıyla Başlatıldı! 🚀");
    } catch (e) {
        console.error("BOOT CRASH:", e);
    }
});
