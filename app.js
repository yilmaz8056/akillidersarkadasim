// State Management (Phase 3 Expanded)
let state = {
    xp: parseInt(localStorage.getItem('study_xp')) || 0,
    coins: parseInt(localStorage.getItem('study_coins')) || 0,
    tasksCompleted: parseInt(localStorage.getItem('study_tasks_done')) || 0,
    studyTime: parseInt(localStorage.getItem('study_time_min')) || 0,
    tasks: JSON.parse(localStorage.getItem('study_tasks')) || [],
    flashcards: JSON.parse(localStorage.getItem('study_cards')) || [],
    badges: JSON.parse(localStorage.getItem('study_badges')) || [],
    streak: parseInt(localStorage.getItem('study_streak')) || 0,
    lastDate: localStorage.getItem('study_last_date') || "",
    theme: localStorage.getItem('study_theme') || 'default',
    weeklyData: JSON.parse(localStorage.getItem('study_weekly')) || [0, 0, 0, 0, 0, 0, 0],
    
    weeklyFocus: JSON.parse(localStorage.getItem('study_weekly_focus')) || [0, 0, 0, 0, 0, 0, 0],
    
    // Core State Recovery
    inventory: JSON.parse(localStorage.getItem('study_inventory')) || ['👤'],
    exams: JSON.parse(localStorage.getItem('study_exams')) || [],
    activeAvatar: localStorage.getItem('study_avatar') || '👤',
    quests: JSON.parse(localStorage.getItem('study_quests')) || { date: "", active: [] },
    subjectXP: JSON.parse(localStorage.getItem('study_sub_xp')) || {
        'Matematik': 0, 'Fen Bilimleri': 0, 'Türkçe': 0, 'Sosyal Bilgiler': 0, 'İngilizce': 0, 'Din Kültürü': 0
    },
    level: parseInt(localStorage.getItem('study_level')) || 1,
    dailyXP: JSON.parse(localStorage.getItem('study_daily_xp')) || { date: new Date().toDateString(), amount: 0 },
    
    library: JSON.parse(localStorage.getItem('study_library')) || [],
    dailyQuestions: parseInt(localStorage.getItem('study_daily_questions')) || 0,
    
    // V16: Timetable
    timetable: JSON.parse(localStorage.getItem('study_timetable')) || {
        'Pazartesi': [], 'Salı': [], 'Çarşamba': [], 'Perşembe': [], 'Cuma': []
    }
};

function todayDate() { return new Date().toDateString(); }

const RIDDLES = [
    { q: "Sıra sıra odalar, birbirini kovalar.", a: "tren" },
    { q: "Şehirleri var ama evleri yok. Dağları var ama ağaçları yok.", a: "harita" },
    { q: "Geceleri fener, gündüzleri söner.", a: "yıldız" },
    { q: "Ben giderim o gider, arkamdam tık tık eder.", a: "baston" }
];

const DAILY_TIPS = [
    "Su içmeyi unutma! Beynin su içtikçe daha iyi odaklanır. 💧",
    "Günde 20 dakika kitap okumak dünyanı geliştirir. 📚",
    "Küçük molalar ver, ama geri dönmeyi unutma! 🧘‍♂️",
    "Matematik bir bulmacadır, sadece kuralları öğren. 🔢",
    "Uykunu iyi alırsan okulda şampiyon olursun! 😴"
];

// Study Buddy Global Voice
function updateStudyBuddy() {
    const buddyIcon = document.querySelector('.buddy-icon');
    const buddyBubble = document.querySelector('.buddy-bubble');
    if (!buddyIcon || !buddyBubble) return;
    
    const xp = state.dailyXP.amount || 0;
    if (xp >= 150) { buddyIcon.innerText = '🔥'; buddyBubble.innerText = 'Efsanevi Bir Gün! 🏆'; }
    else if (xp >= 80) { buddyIcon.innerText = '📚'; buddyBubble.innerText = 'Derin Odaklanma Modu!'; }
    else if (xp >= 30) { buddyIcon.innerText = '⚡'; buddyBubble.innerText = 'Güzel İlerliyorsun!'; }
    else { buddyIcon.innerText = '😴'; buddyBubble.innerText = 'Hadi Başlayalım!'; }
}

// --- Initialization ---
window.onload = () => {
    const today = new Date().toDateString();

    // Daily Goal & Quest Sync
    if (!state.dailyXP || state.dailyXP.date !== today) {
        state.dailyXP = { date: today, amount: 0 };
        localStorage.setItem('study_daily_xp', JSON.stringify(state.dailyXP));
        setTimeout(() => {
            const rewardModal = document.getElementById('daily-reward-modal');
            if (rewardModal) rewardModal.classList.add('show');
        }, 1500);
    }
    
    checkStreak();
    checkDailyQuests();
    setTheme(state.theme);
    updateUI();
    renderTasks();
    renderFlashcards();
    renderSubjectCards();
    renderExams();
    renderMarket();
    renderLeaderboard();
    renderAssignments();
    renderRiddle();
    renderLibrary();
    renderHeatmap();
    updateDailyGoalDisplay();
    showSection('dashboard');

    // Global Audio Listener Unlock (V11)
    document.addEventListener('click', () => {
        if (typeof AudioEngine !== 'undefined') {
            const resumeCtx = () => {
                if (AudioEngine.audioCtx && AudioEngine.audioCtx.state === 'suspended') {
                    AudioEngine.audioCtx.resume();
                }
            };
            resumeCtx();
        }
    }, { once: true });
};

function saveAssignments() { localStorage.setItem('study_assignments', JSON.stringify(state.assignments)); }

function renderHeatmap() {
    const container = document.getElementById('focus-heatmap');
    if (!container) return;
    
    // Scale focus minutes into 0-1 range for color steps
    // weeklyFocus [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    const days = ['Pt', 'Sa', 'Çr', 'Pr', 'Cu', 'Ct', 'Pz'];
    container.innerHTML = state.weeklyFocus.map((val, i) => {
        const opacity = Math.max(0.1, Math.min(val / 60, 1)); // Max: 60 mins focus
        return `<div class="heatmap-day" style="background: rgba(0, 210, 255, ${opacity});" data-val="${days[i]}: ${val} dk"></div>`;
    }).join('');
}

function toggleDarkMode() {
    state.theme = state.theme === 'dark' ? 'default' : 'dark';
    localStorage.setItem('study_theme', state.theme);
    setTheme(state.theme);
    showToast(state.theme === 'dark' ? "Gece Modu Aktif 🌙" : "Gündüz Modu Aktif ☀️");
}

function renderLibrary() {
    const list = document.getElementById('library-list');
    if (!list) return;
    const postItColors = ['#ff7eb3', '#ffdf00', '#00d2ff', '#00ff87'];
    list.innerHTML = state.library.map((note, i) => {
        const color = postItColors[i % postItColors.length];
        const rot = (Math.random() * 6 - 3).toFixed(1); // Random rotation between -3 and 3 degrees
        return `
        <div class="post-it-note" style="background:${color}; transform:rotate(${rot}deg); color:#111; padding:15px; border-radius:4px; box-shadow: 2px 4px 10px rgba(0,0,0,0.3); position:relative; min-height:120px;">
            <div style="width: 30px; height: 10px; background: rgba(0,0,0,0.1); position: absolute; top: 5px; left: 50%; transform: translateX(-50%); border-radius: 5px;"></div>
            <h4 style="margin:10px 0 5px 0; border-bottom:1px solid rgba(0,0,0,0.1); text-transform:uppercase; font-size:0.8rem;">📌 ${note.subject}</h4>
            <p style="margin:5px 0 20px 0; font-family:'Comic Sans MS', cursive, sans-serif; font-size:0.95rem;">${note.text}</p>
            <button class="btn btn-outline" style="font-size:0.7rem; padding:4px 8px; border-color:#111; color:#111; position:absolute; bottom:10px; right:10px;" onclick="deleteLibraryNote(${i})">Çöpe At</button>
        </div>
        `;
    }).join('') || '<p style="opacity:0.5; font-size:0.85rem; grid-column: 1/-1; text-align:center;">Panoda hiç not yok! 📝</p>';
}

function saveLibraryNote() {
    const text = document.getElementById('library-note').value;
    const subject = document.getElementById('library-subject').value;
    if (!text) return showToast("Bir şeyler yazmalısın! 📚");
    state.library.push({ text, subject });
    localStorage.setItem('study_library', JSON.stringify(state.library));
    document.getElementById('library-note').value = '';
    renderLibrary();
    showToast("Not kitaplığa eklendi! 💾");
}

function deleteLibraryNote(i) {
    state.library.splice(i, 1);
    localStorage.setItem('study_library', JSON.stringify(state.library));
    renderLibrary();
}

function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('study_theme', theme);
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
    
    // Update theme selectors UI
    document.querySelectorAll('.theme-dot').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(`.theme-${theme}`).forEach(el => el.classList.add('active'));
    
    // Update top bar stats if visible
    const coinTop = document.getElementById('coin-count-top');
    if (coinTop) coinTop.innerText = state.coins;
}

function toggleFocusShield() {
    const shield = document.getElementById('focus-shield');
    if (!shield) return;
    shield.classList.toggle('active');
}

// --- Core UI & Stats ---
function updateUI() {
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    safeSetText('stats-xp', state.xp);
    safeSetText('stats-tasks', state.tasksCompleted);
    safeSetText('stats-time', `${state.studyTime} dk`);
    safeSetText('stats-coins', state.coins);
    safeSetText('coin-count', state.coins);
    safeSetText('market-coin-display', state.coins); // V17
    safeSetText('sidebar-avatar', state.activeAvatar);
    safeSetText('profile-avatar', state.activeAvatar);

    updateLevel();
    renderBadges();
    renderChart();
    renderFocusChart();
    renderQuests();
    renderLeaderboard();
    updateDailyGoalDisplay();
    updateQuestionRing();
    renderTimetable();
}

function updateDailyGoalDisplay() {
    const goal = 100; // Goal: 100 XP per day
    const current = state.dailyXP.amount || 0;
    const percent = Math.min(Math.round((current / goal) * 100), 100);
    
    // Circular Progress
    const path = document.getElementById('daily-progress-path');
    const text = document.getElementById('daily-goal-text');
    if (path) path.setAttribute('stroke-dasharray', `${percent}, 100`);
    if (text) text.innerText = `${percent}%`;
    
    // Battle Pass Progress Gamification Visual
    const battlePassBar = document.getElementById('battle-pass-fill');
    const chest = document.querySelector('.battle-pass-container span[style*="font-size: 2rem"]');
    
    if (battlePassBar) battlePassBar.style.width = `${percent}%`;
    if (chest) {
        if (percent >= 100) {
            chest.classList.add('chest-ready');
            chest.onclick = claimBattlePassReward;
        } else {
            chest.classList.remove('chest-ready');
            chest.onclick = () => showToast("Ödül için %100 hedefe ulaşmalısın! 🎁");
        }
    }

    checkBadges();
}

function claimBattlePassReward() {
    addXP(100);
    state.coins += 50;
    saveState();
    showToast("Efsanevi Ödül Alındı! +100 XP ve +50 DP Kazandın! 🎁🏆");
    createSparkles(window.innerWidth/2, window.innerHeight/2);
    // Reset daily effort for reward? No, just one claim per day logic in real app, here it stays till reset
}

function updateQuestionRing() {
    const countEl = document.getElementById('question-count');
    const ringEl = document.getElementById('question-ring');
    if (!countEl || !ringEl) return;
    
    const goal = 100;
    const current = state.dailyQuestions;
    countEl.innerText = current;
    
    // Max visual display constraint at 100%
    const percentage = Math.min(current / goal, 1);
    
    // SVG circle has stroke-dasharray="283"
    const offset = 283 - (percentage * 283);
    ringEl.style.strokeDashoffset = offset;
    
    if (current >= goal && !state.badges.includes('🎯')) {
        state.badges.push('🎯');
        showToast('🎯 Hedef Avcısı Rozeti Açıldı!');
        localStorage.setItem('study_badges', JSON.stringify(state.badges));
        renderBadges();
    }
}

function addQuestions() {
    const input = document.getElementById('question-input');
    if (!input) return;
    
    const val = parseInt(input.value);
    if (!val || val <= 0) {
        showToast("Lütfen geçerli bir soru sayısı girin! 📚");
        return;
    }
    
    state.dailyQuestions += val;
    localStorage.setItem('study_daily_questions', state.dailyQuestions);
    input.value = '';
    
    showToast(`Harika! +${val} soru eklendi. Geleceğine yatırım yaptın! 🚀`);
    updateQuestionRing();
    addXP(Math.floor(val * 1.5)); // 1.5 XP per question solved
}

// Gamified Badge Unlocker (Unified)
function checkBadges() {
    // 1. Check Mini-Emoji Badges
    const xp = state.xp;
    const newBadges = [];
    if (xp >= 50 && !state.badges.includes('🌱')) newBadges.push('🌱');
    if (xp >= 200 && !state.badges.includes('⚡')) newBadges.push('⚡');
    if (xp >= 500 && !state.badges.includes('🏆')) newBadges.push('🏆');
    if (xp >= 1000 && !state.badges.includes('👑')) newBadges.push('👑');
    if (state.tasksCompleted >= 5 && !state.badges.includes('✅')) newBadges.push('✅');
    
    if (newBadges.length > 0) {
        state.badges.push(...newBadges);
        localStorage.setItem('study_badges', JSON.stringify(state.badges));
        showToast(`Yeni Rozet Kazandın: ${newBadges.join(' ')}`);
    }

    // 2. Check Legendary Showcase Badges
    const unlock = (id) => {
        const b = document.getElementById(id);
        if (b) b.classList.add('unlocked');
    };
    
    // Validate the criteria dynamically
    if (state.xp >= 1500) unlock('badge-mathgenius'); // Re-purposed criteria for test genius
    if (state.weeklyFocus.reduce((a,b)=>a+b, 0) >= 120) unlock('badge-focusmaster'); // 120 mins focus total this week
    
    const hour = new Date().getHours();
    if (state.weeklyFocus.reduce((a,b)=>a+b, 0) > 0) {
        if (hour >= 21 || hour < 4) unlock('badge-nightowl');
        if (hour >= 5 && hour <= 8) unlock('badge-earlybird');
    }
}

function updateLevel() {
    const newLevel = Math.floor(state.xp / 100) + 1;
    if (newLevel > state.level) {
        state.level = newLevel;
        showLevelUpModal(newLevel);
    }
    const el = document.getElementById('user-level');
    if (el) el.innerText = `Seviye ${state.level}`;
}

function showLevelUpModal(lv) {
    const modal = document.getElementById('level-up-modal');
    if (modal) {
        document.getElementById('new-level-text').innerText = `SEVİYE ${lv}`;
        modal.classList.add('show');
        localStorage.setItem('study_level', lv);
    }
}

function createSparkles(x, y) {
    for (let i = 0; i < 6; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${x + (Math.random() - 0.5) * 40}px`;
        sparkle.style.top = `${y + (Math.random() - 0.5) * 40}px`;
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1500);
    }
}

function addXP(amount, subject = null) {
    state.xp += amount;
    state.coins += Math.floor(amount / 2); 
    
    // Auto-Trigger Gamification UI
    createSparkles(window.innerWidth / 2, window.innerHeight / 2);
    
    // Track Daily XP
    state.dailyXP.amount = (state.dailyXP.amount || 0) + amount;
    localStorage.setItem('study_daily_xp', JSON.stringify(state.dailyXP));

    localStorage.setItem('study_xp', state.xp);
    localStorage.setItem('study_coins', state.coins);
    
    if (subject && state.subjectXP[subject] !== undefined) {
        state.subjectXP[subject] += amount;
        localStorage.setItem('study_sub_xp', JSON.stringify(state.subjectXP));
        renderSubjectCards();
    }

    const dayIndex = new Date().getDay();
    state.weeklyData[dayIndex] += amount;
    localStorage.setItem('study_weekly', JSON.stringify(state.weeklyData));

    checkBadges();
    updateUI();
}

// Unified checkBadges logic removed from here as it's merged above.

// --- Navigation ---
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
        // Smoother, cleaner navigation to top
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('aside nav ul li, nav ul li').forEach(li => li.classList.remove('active'));
    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) navItem.classList.add('active');

    if (sectionId === 'lessons') renderSubjectCards();
    updateStudyBuddy();
}

// --- Subject Levels & Rendering ---
const SUBJECTS = ['Matematik', 'Fen Bilimleri', 'Türkçe', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'];
const SUBJECT_ICONS = {'Matematik':'🔢', 'Fen Bilimleri':'🧪', 'Türkçe':'📚', 'Sosyal Bilgiler':'🌍', 'İngilizce':'🇬🇧', 'Din Kültürü':'🌙'};

function setupLessonEvents() {
    const grid = document.getElementById('subject-grid');
    if (!grid || grid._eventsSetup) return;
    grid._eventsSetup = true;

    grid.addEventListener('click', function(e) {
        const quizBtn = e.target.closest('[data-quiz-subject]');
        if (quizBtn) {
            e.preventDefault(); e.stopPropagation();
            openQuiz(quizBtn.getAttribute('data-quiz-subject'));
            return;
        }
        const card = e.target.closest('[data-timer-subject]');
        if (card) {
            startSubject(card.getAttribute('data-timer-subject'));
        }
    });
}

function renderSubjectCards() {
    const grid = document.getElementById('subject-grid');
    if (!grid) return;
    grid.innerHTML = SUBJECTS.map(sub => {
        const xp = state.subjectXP[sub] || 0;
        const lv = Math.floor(xp / 50) + 1;
        const progress = Math.min((xp % 50) * 2, 100);
        const nearMastery = progress >= 80 ? 'mastery-pulse' : '';
        const isMaster = lv >= 10 ? '<div class="master-badge">👑 USTA</div>' : lv >= 5 ? '<div class="master-badge pro">💎 PRO</div>' : '';
        
        return `
            <div class="subject-card ${nearMastery}">
                ${isMaster}
                <div data-timer-subject="${sub}" style="cursor:pointer; width:100%;">
                    <span class="subject-icon">${SUBJECT_ICONS[sub]}</span>
                    <h3>${sub}</h3>
                    <p style="opacity:0.7; font-size:0.85rem; margin-top:4px;">Seviye ${lv}</p>
                    <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; margin: 12px 0;">
                        <div style="width:${progress}%; height:100%; background:var(--accent-blue); border-radius:3px;"></div>
                    </div>
                </div>
                <button class="btn btn-primary" data-quiz-subject="${sub}" style="width:100%; padding:12px; font-size:0.9rem; margin-top:8px;">
                    ▶ Test Çöz
                </button>
            </div>
        `;
    }).join('');
    setupLessonEvents();
}

// --- Daily Quests ---
const QUEST_POOL = [
    { id: 'q1', text: '25 dakika odaklan', goal: 25, type: 'time' },
    { id: 'q2', text: '3 görev tamamla', goal: 3, type: 'tasks' },
    { id: 'q3', text: 'Yeni bilgi kartı ekle', goal: 1, type: 'card' },
    { id: 'q4', text: '50 XP topla', goal: 50, type: 'xp' }
];

function checkDailyQuests() {
    const today = new Date().toLocaleDateString();
    if (state.quests.date !== today) {
        const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
        state.quests = {
            date: today,
            active: shuffled.slice(0, 3).map(q => ({ ...q, current: 0, completed: false }))
        };
        localStorage.setItem('study_quests', JSON.stringify(state.quests));
    }
}

function renderQuests() {
    const container = document.getElementById('daily-quests-list');
    if (!container) return;
    container.innerHTML = state.quests.active.map(q => `
        <div class="quest-item ${q.completed ? 'completed' : ''}">
            <i class="fas ${q.completed ? 'fa-check-circle' : 'fa-circle-notch'}"></i>
            <span>${q.text}</span>
            <span style="margin-left:auto; font-weight:800; font-size:0.7rem;">${q.completed ? 'BİTTİ' : ''}</span>
        </div>
    `).join('');
}

// --- Market System ---
const MARKET_ITEMS = [
    { id: 'crown', name: 'Altın Taç', icon: '👑', price: 100 },
    { id: 'wizzard', name: 'Büyücü Şapkası', icon: '🧙', price: 150 },
    { id: 'ninja', name: 'Ninja Maskesi', icon: '🥷', price: 200 },
    { id: 'robot', name: 'Robot Başlığı', icon: '🤖', price: 250 },
    { id: 'alien', name: 'Uzaylı Dostu', icon: '👽', price: 300 }
];

function renderMarket() {
    const grid = document.getElementById('market-grid');
    if (!grid) return;
    grid.innerHTML = MARKET_ITEMS.map(item => {
        const isOwned = state.inventory.includes(item.icon);
        return `
            <div class="market-item ${isOwned ? 'owned' : ''}" onclick="buyOrEquip('${item.icon}', ${item.price})">
                <div style="font-size:2.5rem; margin-bottom:10px;">${item.icon}</div>
                <div style="font-size:0.8rem; font-weight:600;">${item.name}</div>
                <div class="item-price">${isOwned ? 'SAHİPSİN' : `${item.price} DP`}</div>
            </div>
        `;
    }).join('');
}

function buyOrEquip(icon, price) {
    if (state.inventory.includes(icon)) {
        state.activeAvatar = icon;
        localStorage.setItem('study_avatar', icon);
        showToast('Avatar güncellendi! 👤');
    } else if (state.coins >= price) {
        state.coins -= price;
        state.inventory.push(icon);
        state.activeAvatar = icon;
        localStorage.setItem('study_coins', state.coins);
        localStorage.setItem('study_inventory', JSON.stringify(state.inventory));
        localStorage.setItem('study_avatar', icon);
        showToast('Yeni bir eşya aldın! 🎁');
    } else {
        showToast('Yeterli Ders Puanın (DP) yok! 😅');
    }
    updateUI();
    renderMarket();
}

// --- Exam Countdown ---
function addExam() {
    const name = document.getElementById('exam-name');
    const date = document.getElementById('exam-date');
    if (name.value && date.value) {
        state.exams.push({ name: name.value, date: date.value });
        localStorage.setItem('study_exams', JSON.stringify(state.exams));
        name.value = ''; date.value = '';
        renderExams();
    }
}

function renderExams() {
    const list = document.getElementById('exam-list');
    const widget = document.getElementById('exam-widget');
    
    if (list) {
        list.innerHTML = state.exams.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem;">Henüz sınav eklenmedi.</p>'
            : state.exams.map((ex, i) => `
                <div class="exam-item">
                    <span><b>${ex.name}</b> — ${ex.date}</span>
                    <i class="fas fa-trash-alt" style="cursor:pointer; color:#f44336;" onclick="deleteExam(${i})"></i>
                </div>
            `).join('');
    }
    
    if (widget) {
        if (state.exams.length > 0) {
            const sorted = [...state.exams].sort((a,b) => new Date(a.date) - new Date(b.date));
            const next = sorted[0];
            const diff = Math.ceil((new Date(next.date) - new Date()) / (1000 * 60 * 60 * 24));
            const urgentColor = diff <= 7 ? '#ff4444' : diff <= 14 ? '#ff8800' : '#00d2ff';
            widget.innerHTML = `
                <div style="background: linear-gradient(135deg, ${urgentColor}22, ${urgentColor}11); border: 2px solid ${urgentColor}; border-radius: 20px; padding: 1.2rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.5rem; animation: pulse 1.5s ease infinite;">⏳</div>
                    <div>
                        <div style="font-size: 0.75rem; text-transform: uppercase; opacity: 0.7; font-weight: 700;">Yaklaşan Sınav</div>
                        <div style="font-size: 1.1rem; font-weight: 800; margin: 4px 0;">${next.name}</div>
                        <div style="font-size: 1.8rem; font-weight: 900; color: ${urgentColor};">${diff} GÜN KALDI</div>
                    </div>
                </div>
            `;
        } else { widget.innerHTML = ''; }
    }
}

function deleteExam(index) {
    state.exams.splice(index, 1);
    localStorage.setItem('study_exams', JSON.stringify(state.exams));
    renderExams();
}

// --- V9 Assignment & Riddle Logic ---
function openAssignmentModal() { document.getElementById('assignment-modal').classList.add('show'); }
function closeAssignmentModal() { document.getElementById('assignment-modal').classList.remove('show'); }

function addAssignment() {
    const name = document.getElementById('assign-name').value;
    const subject = document.getElementById('assign-subject').value;
    const level = parseInt(document.getElementById('assign-level').value);
    
    if (!name) return showToast("Ödev adını girermisin? 🤖");
    
    const xpMap = { 1: 10, 2: 25, 3: 50 };
    const xpReward = xpMap[level];
    
    state.assignments.push({ id: Date.now(), name, subject, level, xp: xpReward });
    saveAssignments();
    renderAssignments();
    closeAssignmentModal();
    showToast("Ödev Robota eklendi! 🚀");
}

function deleteAssignment(id, earnedXP = 0) {
    state.assignments = state.assignments.filter(a => a.id !== id);
    if (earnedXP > 0) {
        addXP(earnedXP);
        showToast(`Ödev Tamamlandı! +${earnedXP} XP Kazandın! 🏆`);
    }
    saveAssignments();
    renderAssignments();
}

function saveAssignments() { localStorage.setItem('study_assignments', JSON.stringify(state.assignments)); }

function renderAssignments() {
    const list = document.getElementById('assignment-list');
    if (!list) return;
    
    if (state.assignments.length === 0) {
        list.innerHTML = '<p style="opacity:0.5; font-size:0.85rem; text-align:center;">Henüz ödev eklemedin. 🤖</p>';
        return;
    }
    
    list.innerHTML = state.assignments.map(a => `
        <div class="assignment-item">
            <div>
                <div style="font-weight:700;">${a.name}</div>
                <div style="font-size:0.7rem; opacity:0.7;">${a.subject}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="assign-tag" style="background:${a.level === 3 ? '#ff4444' : a.level === 2 ? '#ff8c00' : '#4caf50'};">${a.xp} XP</span>
                <i class="fas fa-check-circle" style="color:var(--accent-blue); font-size:1.5rem; cursor:pointer;" onclick="deleteAssignment(${a.id}, ${a.xp})"></i>
            </div>
        </div>
    `).join('');
}

function renderRiddle() {
    const today = new Date().toDateString();
    const riddleEl = document.getElementById('riddle-question');
    const inputGroup = document.getElementById('riddle-input-group');
    
    if (state.lastRiddleDate === today) {
        riddleEl.innerText = "Harika! Bugünün bilmecesini çözdün. Yarın yeni bir tanesi gelecek! 🌟";
        inputGroup.style.display = 'none';
        return;
    }
    
    // Use day of month to pick stable riddle
    const day = new Date().getDate();
    const riddle = RIDDLES[day % RIDDLES.length];
    riddleEl.innerText = riddle.q;
    riddleEl.dataset.answer = riddle.a;
}

function checkRiddle() {
    const userInput = document.getElementById('riddle-answer').value.toLowerCase().trim();
    const riddleEl = document.getElementById('riddle-question');
    const correctAnswer = riddleEl.dataset.answer;
    
    if (userInput === correctAnswer) {
        addXP(10);
        state.lastRiddleDate = new Date().toDateString();
        localStorage.setItem('study_riddle_date', state.lastRiddleDate);
        renderRiddle();
        showToast("Doğru! +10 XP Kazandın! 🎉");
    } else {
        showToast("Üzgünüm, robot bu cevabı beğenmedi. Tekrar dene! 🤖");
    }
}

// --- V14 Ultimate Audio Engine (YouTube IFrame API) ---
let ytPlayer;

// Initialize when YouTube API is ready
window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('yt-player-container', {
        height: '0',
        width: '0',
        videoId: '5qap5aO4i9A', // Default to Lofi Girl stream
        playerVars: { 
            'autoplay': 0, 
            'controls': 0, 
            'disablekb': 1,
            'rel': 0,
            'modestbranding': 1
        },
        events: {
            'onReady': () => console.log('YT Audio Engine Hazır! 📻')
        }
    });
};

const AudioEngine = {
    // Curated high-quality audio streams
    // Lofi: Lofi Girl Live, Rain: Rain sounds, Forest: Forest birds
    streams: {
        'lofi': 'jfKfPfyJRdk', 
        'rain': 'mPZkdNFkNps',
        'forest': 'xNN7iTA57jM'
    },
    
    play(type) {
        if (!ytPlayer || !ytPlayer.loadVideoById) {
            showToast("⚠️ Ses motoru birazdan hazır olacak. Lütfen internetini kontrol et.");
            return;
        }
        
        const videoId = this.streams[type] || this.streams['lofi'];
        
        // Load and play the selected stream
        ytPlayer.loadVideoById(videoId);
        ytPlayer.playVideo();
        ytPlayer.setVolume(50); // Balanced default volume
        
        showToast(`${type.toUpperCase()} Yayını Başladı! 📻`);
    },
    
    stop() {
        if (ytPlayer && ytPlayer.stopVideo) {
            ytPlayer.pauseVideo();
        }
    }
};

// V14 note: We no longer need the global click listener because YouTube iframe
// executes playVideo() securely during the user's click event on toggleSound.

function renderExams() {
    const list = document.getElementById('exam-list');
    const widget = document.getElementById('exam-timer-widget');
    
    if (list) {
        list.innerHTML = state.exams.length === 0
            ? '<p style="opacity:0.5; font-size:0.85rem;">Henüz sınav eklenmedi.</p>'
            : state.exams.map((ex, i) => `
                <div class="exam-item">
                    <span><b>${ex.name}</b> — ${ex.date}</span>
                    <i class="fas fa-trash-alt" style="cursor:pointer; color:#f44336;" onclick="deleteExam(${i})"></i>
                </div>
            `).join('');
    }
    
    if (widget) {
        if (state.exams.length > 0) {
            const sorted = [...state.exams].sort((a,b) => new Date(a.date) - new Date(b.date));
            const next = sorted[0];
            const diff = Math.ceil((new Date(next.date) - new Date()) / (1000 * 60 * 60 * 24));
            const urgentColor = diff <= 7 ? '#ff4444' : diff <= 14 ? '#ff8800' : '#00d2ff';
            widget.innerHTML = `
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.2rem; animation: pulse 1.5s ease infinite;">📅</div>
                    <div>
                        <div style="font-size: 0.7rem; text-transform: uppercase; opacity: 0.7; font-weight: 700;">En Yakın Sınav</div>
                        <div style="font-size: 1rem; font-weight: 800; margin: 2px 0;">${next.name}</div>
                        <div style="font-size: 1.5rem; font-weight: 900; color: ${urgentColor};">${diff > 0 ? diff + " GÜN KALDI" : "BUGÜN!"}</div>
                    </div>
                </div>
            `;
        } else {
            widget.innerHTML = '<p style="margin:0; opacity:0.5; font-size:0.8rem;">Sınav ekleyerek geri sayımı başlat! 📅</p>';
        }
    }
}

function saveState() {
    localStorage.setItem('study_xp', state.xp);
    localStorage.setItem('study_coins', state.coins);
    updateUI();
}

function toggleSound(type) {
    const btn = document.getElementById(`sound-${type}`);
    const isActive = btn.classList.contains('active');
    
    ['rain', 'forest', 'lofi'].forEach(t => {
        const b = document.getElementById(`sound-${t}`);
        if (b) b.classList.remove('active');
    });

    if (!isActive) {
        btn.classList.add('active');
        AudioEngine.play(type);
        showToast(`${type.toUpperCase()} sentezi başladı. 🎵`);
    } else {
        AudioEngine.stop();
        showToast('Ses kapatıldı.');
    }
}

// --- PDF Print (Başarı Karnesi) ---
function exportPDFReport() {
    const userDisplay = document.getElementById('username-input') && document.getElementById('username-input').value ? document.getElementById('username-input').value : 'Kahraman';
    document.getElementById('karne-user').innerText = userDisplay;
    document.getElementById('karne-date').innerText = new Date().toLocaleDateString();
    
    document.getElementById('karne-level').innerText = `Seviye ${state.level}`;
    document.getElementById('karne-xp').innerText = `${state.xp} XP / ${state.coins} DP`;
    document.getElementById('karne-tasks').innerText = `${state.tasksCompleted} Adet`;
    
    const focusTotal = state.weeklyFocus.reduce((a,b) => a+b, 0);
    document.getElementById('karne-focus').innerText = `${focusTotal} Dakika`;
    
    window.print();
}

// --- Enhanced Quiz Bank (Level-Based) ---
const QUIZ_BANK = {
    'Matematik': {
        1: [
            { q: '6 + 8 x 2 işleminin sonucu nedir?', a: ['22', '28', '20', '16'], c: 0 },
            { q: 'Hangi sayı asaldır?', a: ['9', '15', '21', '13'], c: 3 },
            { q: 'Dikdörtgenin alanı nasıl bulunur?', a: ['2 x (a+b)', 'a x b', 'a + b', 'a / b'], c: 1 },
            { q: 'En küçük sayma sayısı kaçtır?', a: ['0', '1', '10', '100'], c: 1 },
            { q: '42 / 7 işleminin sonucu nedir?', a: ['5', '6', '7', '8'], c: 1 },
            { q: 'Hangi sayı 5 ile kalansız bölünür?', a: ['42', '53', '65', '71'], c: 2 },
            { q: '12 x 3 + 4 işleminin sonucu nedir?', a: ['40', '50', '36', '44'], c: 0 },
            { q: 'Karenin kaç kenarı vardır?', a: ['3', '4', '5', '6'], c: 1 },
            { q: '100 - 45 işleminin sonucu nedir?', a: ['55', '65', '45', '75'], c: 0 },
            { q: '2 basamaklı en büyük sayı kaçtır?', a: ['10', '90', '99', '100'], c: 2 }
        ],
        2: [
            { q: '12 x 12 işleminin sonucu nedir?', a: ['124', '144', '154', '164'], c: 1 },
            { q: 'Hangi sayı 3 ile kalansız bölünür?', a: ['10', '11', '12', '13'], c: 2 }
        ]
    },
    'Fen Bilimleri': {
        1: [
            { q: 'Güneş sistemindeki en büyük gezegen hangisidir?', a: ['Mars', 'Jüpiter', 'Satürn', 'Venüs'], c: 1 },
            { q: 'Vücudumuzun temel yapı taşı nedir?', a: ['Doku', 'Organ', 'Hücre', 'Sistem'], c: 2 },
            { q: 'Hangi kuvvet her zaman zıt yöndedir?', a: ['Yerçekimi', 'Kaldırma', 'Sürtünme', 'Manyetik'], c: 2 },
            { q: 'Fotosentez yapan canlı hangisidir?', a: ['Kedi', 'Papatya', 'Aslan', 'Mantarlar'], c: 1 },
            { q: 'Işık hangi hızla yayılır?', a: ['300.000 km/s', '100.000 km/s', '500.000 km/s', '1.000.000 km/s'], c: 0 },
            { q: 'Hangisi bir karışımdır?', a: ['Saf su', 'Demir çivi', 'Şekerli su', 'Bakır tel'], c: 2 },
            { q: 'Hangi organımız kanı pompalar?', a: ['Akciğer', 'Böbrek', 'Mide', 'Kalp'], c: 3 },
            { q: 'Su kaç derecede kaynar?', a: ['50', '80', '100', '120'], c: 2 },
            { q: 'Güneş hangi ışını yayar?', a: ['X-Ray', 'Morötesi', 'Gamma', 'Beta'], c: 1 },
            { q: 'Isıyı en iyi ileten madde hangisidir?', a: ['Plastik', 'Tahta', 'Metal', 'Cam'], c: 2 }
        ]
    },
    'Türkçe': {
        1: [
            { q: 'Hangisi bir isim tamlamasıdır?', a: ['Mavi ev', 'Kapı kolu', 'Güzel çocuk', 'Hızlı araba'], c: 1 },
            { q: 'Hangisi zıt anlamlı kelime çiftidir?', a: ['Siyah-Kara', 'Ak-Beyaz', 'İyi-Kötü', 'Hızlı-Süratli'], c: 2 },
            { q: 'Cümlenin sonuna hangi işaret konur?', a: ['Virgül', 'Nokta', 'Ünlem', 'Soru İşareti'], c: 1 },
            { q: 'Hangisi bir yapım eki almıştır?', a: ['Kitaplar', 'Gözlük', 'Evden', 'Yolda'], c: 1 },
            { q: 'Zamir nedir?', a: ['İsim yerine kullanılan kelime', 'Hareketi bildiren kelime', 'Niteleyici kelime', 'Bağlayıcı kelime'], c: 0 },
            { q: 'Özne nedir?', a: ['İşi yapan kişi', 'İşten etkilenen', 'Zamanı bildiren', 'Yeri bildiren'], c: 0 },
            { q: 'Hangisi bir devrik cümledir?', a: ['Dün geldim eve.', 'Eve dün geldim.', 'Geldim dün eve.', 'Dün eve geldim.'], c: 0 },
            { q: 'Eş anlamlısı olan kelime hangisidir?', a: ['Hızlı', 'Elma', 'Kalem', 'Kitap'], c: 0 },
            { q: 'Noktalı virgül nerede kullanılır?', a: ['Sıralı cümlelerde', 'Cümle sonunda', 'Bağlaçlardan önce', 'Soru sorarken'], c: 0 },
            { q: 'Hangisi bir özel isimdir?', a: ['Şehir', 'Ankara', 'Dağ', 'Nehir'], c: 1 }
        ]
    },
    'Sosyal Bilgiler': { 1: [
        { q: 'Hangisi bir temel haktır?', a: ['Eğitim', 'Araba sürmek', 'Sinemaya gitmek', 'Oyun oynamak'], c: 0 },
        { q: 'İlk Türk devletlerinde hükümdara ne denir?', a: ['Padişah', 'Sultan', 'Kağan', 'Kral'], c: 2 },
        { q: 'Hangisi beşeri bir unsurdur?', a: ['Dağ', 'Göl', 'Köprü', 'Irmak'], c: 2 },
        { q: 'Türkiye kaç coğrafi bölgeden oluşur?', a: ['5', '6', '7', '8'], c: 2 },
        { q: 'Dünyanın en büyük okyanusu hangisidir?', a: ['Hint', 'Atlas', 'Pasifik', 'Arktik'], c: 2 },
        { q: 'Erosiyonu önlemek için ne yapılmalıdır?', a: ['Ağaç dikilmelidir', 'Su barajları kurulmalıdır', 'Evler yapılmalıdır', 'Yollar inşa edilmelidir'], c: 0 },
        { q: 'Atatürk ne zaman doğdu?', a: ['1881', '1923', '1938', '1919'], c: 0 },
        { q: 'Paranın mucidi hangi medeniyettir?', a: ['Sümerler', 'Lidyalılar', 'Hititler', 'Mısırlılar'], c: 1 },
        { q: 'Türkiye’nin başkenti neresidir?', a: ['İstanbul', 'İzmir', 'Ankara', 'Antalya'], c: 2 },
        { q: 'Hangisi bir yer şeklidir?', a: ['Ada', 'Ev', 'Araba', 'Okul'], c: 0 }
    ]},
    'İngilizce': { 1: [
        { q: 'What is the opposite of "Hot"?', a: ['Cold', 'Warm', 'Big', 'Fast'], c: 0 },
        { q: 'Which color is a mix of Blue and Red?', a: ['Green', 'Purple', 'Orange', 'Yellow'], c: 1 },
        { q: 'Monday is the ____ day of the week.', a: ['First', 'Second', 'Third', 'Fourth'], c: 0 },
        { q: 'What is "Elma" in English?', a: ['Banana', 'Apple', 'Orange', 'Peach'], c: 1 },
        { q: 'How many legs does a spider have?', a: ['4', '6', '8', '10'], c: 2 },
        { q: 'What is the plural of "Child"?', a: ['Childs', 'Children', 'Childrens', 'Childes'], c: 1 },
        { q: 'Which one is a fruit?', a: ['Cucumber', 'Potato', 'Apple', 'Onion'], c: 2 },
        { q: 'What do you say in the morning?', a: ['Good night', 'Good evening', 'Good morning', 'Good afternoon'], c: 2 },
        { q: 'What is "Kedi" in English?', a: ['Dog', 'Cat', 'Bird', 'Hamster'], c: 1 },
        { q: 'Which number is "On"?', a: ['10', '20', '30', '40'], c: 0 }
    ]},
    'Din Kültürü': { 1: [
        { q: 'İslamın şartı kaçtır?', a: ['3', '4', '5', '6'], c: 2 },
        { q: 'İmanın şartı kaçtır?', a: ['5', '6', '7', '8'], c: 1 },
        { q: 'Hangisi Peygamber Efendimizin ismidir?', a: ['Hz. Ali', 'Hz. Muhammed', 'Hz. Ömer', 'Hz. Osman'], c: 1 },
        { q: 'Kur’an-ı Kerim hangi dilde indirilmiştir?', a: ['Türkçe', 'İngilizce', 'Arapça', 'Farsça'], c: 2 },
        { q: 'Günde kaç vakit namaz kılınır?', a: ['1', '3', '5', '7'], c: 2 },
        { q: 'Oruç hangi ayda tutulur?', a: ['Ramazan', 'Şaban', 'Recep', 'Muharrem'], c: 0 },
        { q: 'Hicret nedir?', a: ['Yürüyüş', 'Göç', 'Savaş', 'Barış'], c: 1 },
        { q: 'Hangisi bir melektir?', a: ['Hz. Adem', 'Cebrail', 'Ebu Bekir', 'Hz. Yusuf'], c: 1 },
        { q: 'Kabe nerededir?', a: ['Medine', 'Mekke', 'Kudüs', 'Bağdat'], c: 1 },
        { q: 'Namazın farzları kaça ayrılır?', a: ['İçindekiler ve Dışındakiler', 'Erkekler ve Kadınlar', 'Büyükler ve Küçükler', 'Gündüz ve Gece'], c: 0 }
    ]}
};

let currentQuizQuestions = [];
let currentQuizIndex = 0;

function openQuiz(subject) {
    // Reset performance counters for every new test
    correctAnswersCount = 0;
    currentQuizIndex = 0;
    
    const subXP = state.subjectXP[subject] || 0;
    const currentLevel = Math.floor(subXP / 50) + 1;
    const levelData = (QUIZ_BANK[subject] && QUIZ_BANK[subject][currentLevel]) || (QUIZ_BANK[subject] && QUIZ_BANK[subject][1]);
    
    if (!levelData) { showToast('İçerik hazırlanıyor!'); return; }
    
    currentQuizQuestions = [...levelData].sort(() => 0.5 - Math.random()).slice(0, 10);
    renderQuizQuestion(subject, currentLevel);
    document.getElementById('quiz-modal').classList.add('show');
}

function renderQuizQuestion(subject, level) {
    const q = currentQuizQuestions[currentQuizIndex];
    const body = document.getElementById('quiz-body');
    body.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
            <span class="stat-label">${subject} - Seviye ${level}</span>
            <div style="font-size:0.7rem; font-weight:800; opacity:0.6; margin-top:4px;">SORU ${currentQuizIndex + 1} / ${currentQuizQuestions.length}</div>
        </div>
        <h3 style="margin-bottom:1.5rem; line-height:1.4;">${q.q}</h3>
        <div style="display:grid; gap:12px;">
            ${q.a.map((ans, i) => `
                <button class="btn btn-outline quiz-ans-btn" style="text-align:left; justify-content: flex-start;" onclick="checkQuizAnswer(${i}, ${q.c}, '${subject}')">
                    <span style="background:var(--accent-blue); width:24px; height:24px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-right:10px; font-size:0.7rem;">${String.fromCharCode(65+i)}</span>
                    ${ans}
                </button>
            `).join('')}
        </div>
    `;
}

let correctAnswersCount = 0;
function checkQuizAnswer(selected, correct, subject) {
    const buttons = document.querySelectorAll('.quiz-ans-btn');
    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correct) btn.style.borderColor = '#4caf50';
        if (i === selected && i !== correct) btn.style.borderColor = '#f44336';
    });
    
    if (selected === correct) {
        correctAnswersCount++;
        addXP(10, subject);
    }
    
    const body = document.getElementById('quiz-body');
    const isLast = currentQuizIndex === currentQuizQuestions.length - 1;
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary'; nextBtn.style.marginTop = '20px'; nextBtn.style.width = '100%';
    nextBtn.innerText = isLast ? 'Sonucu Gör' : 'Sıradaki Soru';
    nextBtn.onclick = () => {
        if (isLast) showQuizResults();
        else { 
            currentQuizIndex++; 
            const subXP = state.subjectXP[subject] || 0; 
            renderQuizQuestion(subject, Math.floor(subXP / 50) + 1); 
        }
    };
    body.appendChild(nextBtn);
}

function showQuizResults() {
    const totalQ = currentQuizQuestions.length || 1;
    const ratio = correctAnswersCount / totalQ;
    const stars = ratio >= 0.9 ? '⭐⭐⭐' : ratio >= 0.6 ? '⭐⭐' : '⭐';
    const body = document.getElementById('quiz-body');
    body.innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <div style="font-size:3.5rem; margin-bottom:1rem; animation: pulse 1s infinite alternate;">🏆</div>
            <h2 style="color:var(--accent-gold);">Test Tamamlandı!</h2>
            <div class="star-rating">${stars}</div>
            <p>${totalQ} soruda <b>${correctAnswersCount}</b> doğru yaptın.</p>
            <p style="opacity:0.7; font-size:0.8rem; margin-top:10px;">+${correctAnswersCount * 10} XP ve DP kazandın!</p>
            <button class="btn btn-primary" style="width:100%; margin-top:25px; padding:15px;" onclick="closeQuiz()">Harika! Devam Et</button>
        </div>
    `;
}
function updateUsername() {
    const input = document.getElementById('username-input');
    if (input.value) {
        document.getElementById('username-display').innerText = input.value;
        localStorage.setItem('study_username', input.value);
        showToast('İsim güncellendi!');
    }
}

function exportData() {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ders-arkadasim-yedek.json`; a.click();
}

function importData(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = JSON.parse(e.target.result);
            Object.assign(state, data);
            localStorage.clear();
            for (let key in data) {
                if (typeof data[key] === 'object') localStorage.setItem(`study_${key}`, JSON.stringify(data[key]));
                else localStorage.setItem(`study_${key}`, data[key]);
            }
            location.reload();
        };
        reader.readAsText(file);
    }
}

// --- Timer & Sound (V17 Native Audio) ---
function startSubject(subjectName) {
    showSection('timer');
    document.getElementById('timer-label').innerText = `${subjectName} Çalışması`;
    showToast(`${subjectName} dersine başlanıyor!`);
}

function toggleSound(type) {
    const btn = document.getElementById(`sound-${type}`);
    const audio = document.getElementById(`audio-${type}`);
    
    // Stop others
    ['rain', 'forest', 'lofi'].forEach(t => {
        if (t !== type) {
            const b = document.getElementById(`sound-${t}`);
            const a = document.getElementById(`audio-${t}`);
            if (b) b.classList.remove('active', 'btn-primary');
            if (b) b.classList.add('btn-outline');
            if (a) a.pause();
        }
    });

    // Toggle current
    if (audio.paused) {
        audio.play().catch(() => showToast('Ses bağlantısı bekleniyor.'));
        showToast(`${type.toUpperCase()} çalıyor 🎵`);
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-outline');
    } else { 
        audio.pause(); 
        showToast('Ses durduruldu.'); 
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline');
    }
}

// --- Theme Settings Removed in V17 ---
function setTheme(t) {
    // Kept for backward compatibility parsing in state if any old user data exists, but UI relies heavily on V17 standard
    state.theme = t; localStorage.setItem('study_theme', t);
}

// --- V17 Market System ---
function buyItem(avatar, cost, el) {
    if (state.inventory.includes(avatar)) {
        state.activeAvatar = avatar;
        localStorage.setItem('study_avatar', avatar);
        showToast(`Avatar seçildi: ${avatar}`);
        updateUI();
        return;
    }
    
    if (state.coins >= cost) {
        state.coins -= cost;
        state.inventory.push(avatar);
        state.activeAvatar = avatar;
        localStorage.setItem('study_coins', state.coins);
        localStorage.setItem('study_inventory', JSON.stringify(state.inventory));
        localStorage.setItem('study_avatar', avatar);
        
        showToast(`Tebrikler! Yeni avatar aldın: ${avatar} 🎉`);
        createSparkles(window.innerWidth/2, window.innerHeight/2);
        updateUI();
    } else {
        showToast(`Yetersiz DP! ${cost - state.coins} DP daha lazım. Soru çözerek kazanabilirsin! 📚`);
    }
}

// --- Streak & Chart & Tasks & Cards ---
function checkStreak() {
    const today = new Date().toLocaleDateString();
    const lastDate = state.lastDate;
    if (lastDate && lastDate !== today) {
        const last = new Date(lastDate);
        const diff = (new Date(today) - last) / (1000 * 60 * 60 * 24);
        if (diff === 1) state.streak++; else state.streak = 1;
    } else if (!lastDate) state.streak = 1;
    state.lastDate = today;
    localStorage.setItem('study_last_date', today);
    localStorage.setItem('study_streak', state.streak);
    const badge = document.getElementById('streak-badge');
    const count = document.getElementById('streak-count');
    const profileCount = document.getElementById('profile-streak-display');
    
    if (badge && count) {
        count.innerText = state.streak;
        badge.className = state.streak > 0 ? 'streak-visible' : 'streak-hidden';
    }
    if (profileCount) {
        profileCount.innerText = `${state.streak} Gün`;
    }
}

function renderChart() {
    const container = document.getElementById('weekly-chart');
    if (!container) return;
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const maxVal = Math.max(...state.weeklyData, 100);
    container.innerHTML = state.weeklyData.map((val, i) => {
        const height = (val / maxVal) * 100;
        return `<div class="chart-bar" style="height: ${height}%" data-day="${days[i]}" onclick="showToast('${days[i]}: ${val} XP topladın! ⚡')"></div>`;
    }).join('');
}

function renderFocusChart() {
    const container = document.getElementById('focus-chart-container');
    if (!container) return;
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const maxVal = Math.max(...state.weeklyFocus, 60);
    container.innerHTML = state.weeklyFocus.map((val, i) => {
        const height = Math.max((val / maxVal) * 100, 5); // Ensure minimum visible bar
        return `<div class="chart-bar" style="height: ${height}%; background: var(--accent-blue);" data-day="${days[i]}" onclick="showToast('${days[i]}: ${val} dakika odaklandın! 🧘')"></div>`;
    }).join('');
}

function renderBadges() {
    const container = document.getElementById('badges-display');
    if (!container) return;
    const badgeDetails = {'🌱': 'İlk Adım', '⚡': 'Hızlı', '🏆': 'Şampiyon', '👑': 'Efsane', '✅': 'Görev Adamı'};
    if (state.badges.length === 0) {
        container.innerHTML = '<span style="opacity:0.5; font-size:0.85rem;">XP toplayarak rozet kazan! 🌟</span>';
    } else {
        container.innerHTML = state.badges.map(b => `<div class="badge-item" title="${badgeDetails[b]}"><span style="font-size:2rem;">${b}</span><span style="font-size:0.6rem; font-weight:700;">${badgeDetails[b]}</span></div>`).join('');
    }
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-list');
    if (!container) return;
    
    // Generate dynamic opponents based on user's XP to keep it competitive
    const uXp = state.xp;
    const mock = [
        {name: 'Kuzey Yıldızı', xp: uXp > 2000 ? uXp + 450 : 2000, icon: '🌟'}, 
        {name: 'Siz', xp: uXp, player: true, icon: state.activeAvatar || '👤'}, 
        {name: 'Bilgin Ada', xp: uXp > 1000 ? uXp - 150 : 850, icon: '📚'},
        {name: 'Hızlı Roket', xp: 400, icon: '🚀'},
        {name: 'Uyuyan Kedi', xp: 120, icon: '🐱'}
    ].sort((a, b) => b.xp - a.xp).filter(u => u.xp > 0);

    container.innerHTML = mock.map((u, i) => {
        let rankIcon = `#${i+1}`;
        if (i === 0) rankIcon = '👑';
        if (i === 1) rankIcon = '🥈';
        if (i === 2) rankIcon = '🥉';
        
        return `
        <div class="leaderboard-item" style="display:flex; align-items:center; gap:15px; padding:10px; border-radius:12px; margin-bottom:8px; ${u.player ? 'border: 2px solid var(--accent-blue); background:rgba(0,210,255,0.1); transform:scale(1.02);' : 'background:rgba(255,255,255,0.05);'} transition:0.3s;">
            <div style="font-size:1.5rem; font-weight:800; min-width:35px; text-align:center; color:${i===0?'gold':i===1?'silver':i===2?'#cd7f32':'inherit'};">${rankIcon}</div>
            <div style="font-size:1.5rem;">${u.icon}</div>
            <div style="flex:1;">
                <div style="font-weight:700; font-size:1rem; color:${u.player ? 'var(--accent-blue)' : 'inherit'};">${u.name}</div>
            </div>
            <div style="font-weight:900; font-family:monospace; font-size:1.1rem;">${u.xp} XP</div>
        </div>`;
    }).join('');
}

function addTask() {
    const inp = document.getElementById('task-input');
    if (inp.value) {
        state.tasks.push({ id: Date.now(), text: inp.value, completed: false });
        localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
        inp.value = ''; renderTasks();
    }
}

function renderTasks() {
    const list = document.getElementById('task-list'); if (!list) return;
    list.innerHTML = state.tasks.map(t => `
        <div class="task-item ${t.completed ? 'completed' : ''}">
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="checkbox-custom" onclick="toggleTask(${t.id})">${t.completed ? '✓' : ''}</div>
                <span>${t.text}</span>
            </div>
            <i class="fas fa-trash-alt" style="cursor:pointer" onclick="deleteTask(${t.id})"></i>
        </div>`).join('');
}

function toggleTask(id) {
    const t = state.tasks.find(x => x.id === id);
    if (t) {
        t.completed = !t.completed;
        if (t.completed) { state.tasksCompleted++; addXP(10); }
        localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
        renderTasks(); updateUI();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
    renderTasks();
}

function addFlashcard() {
    const f = document.getElementById('card-front'); const b = document.getElementById('card-back');
    if (f.value && b.value) {
        state.flashcards.push({ id: Date.now(), front: f.value, back: b.value });
        localStorage.setItem('study_cards', JSON.stringify(state.flashcards));
        f.value = ''; b.value = ''; renderFlashcards();
    }
}

function renderFlashcards() {
    const grid = document.getElementById('flashcards-grid'); if (!grid) return;
    grid.innerHTML = state.flashcards.map(card => `
        <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
            <div class="flashcard-inner">
                <div class="flashcard-front" style="padding:1rem;">${card.front}</div>
                <div class="flashcard-back" style="padding:1rem; display:flex; flex-direction:column; justify-content:center;">
                    <div style="flex:1; display:flex; align-items:center; justify-content:center;">${card.back}</div>
                    <div class="srs-controls" onclick="event.stopPropagation()">
                        <button class="srs-btn srs-zor" onclick="rateCard(event, ${card.id}, 1)">Zor</button>
                        <button class="srs-btn srs-orta" onclick="rateCard(event, ${card.id}, 2)">Orta</button>
                        <button class="srs-btn srs-kolay" onclick="rateCard(event, ${card.id}, 3)">Kolay</button>
                    </div>
                </div>
            </div>
        </div>`).join('');
}

function rateCard(event, id, score) {
    event.stopPropagation();
    const btnContainer = event.target.parentElement;
    if (btnContainer.dataset.locked === 'true') {
        showToast('Bu kartı zaten yanıtladın. Diğerlerine geç!');
        return;
    }
    btnContainer.dataset.locked = 'true';

    const xpReward = score * 5;
    addXP(xpReward);
    const msgs = ["Daha çok çalışacağız! 💪", "Güzel, gelişiyorsun! 👍", "Çok Kolaydı! 🔥"];
    showToast(msgs[score-1] + ` +${xpReward} XP`);
    
    setTimeout(() => {
        const cardCont = btnContainer.closest('.flashcard-container');
        if (cardCont) cardCont.classList.remove('flipped');
    }, 800);
}

let timerInterval; let timeLeft = 25 * 60; let isTimerRunning = false;
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (isTimerRunning) { 
        clearInterval(timerInterval); 
        isTimerRunning = false; 
        btn.innerText = 'Başlat'; 
        document.body.classList.remove('zen-mode'); // Exit Zen Mode
        document.getElementById('focus-shield').classList.remove('active'); // Final Shield Release
        showSessionRecap(Math.floor((25 * 60 - timeLeft) / 60)); // Partial recap
    }
    else {
        isTimerRunning = true; 
        btn.innerText = 'Durdur';
        document.body.classList.add('zen-mode'); // Enter Zen Mode
        document.getElementById('focus-shield').classList.add('active'); // Shield Wall Up
        timerInterval = setInterval(() => {
            timeLeft--; updateTimerDisplay();
            // Sync shield timer
            const shieldTimer = document.getElementById('shield-timer');
            if (shieldTimer) shieldTimer.innerText = document.getElementById('time-display').innerText;
            
            if (timeLeft <= 0) { 
                clearInterval(timerInterval); 
                addXP(25); 
                showSessionRecap(25);
                resetTimer(); 
            }
        }, 1000);
    }
}

function showSessionRecap(minutes) {
    const xp = Math.floor(minutes * 0.8) + (minutes >= 25 ? 10 : 0);
    const coins = Math.floor(xp / 2);
    
    // Add to Focus Analytics
    const dayIndex = new Date().getDay();
    state.weeklyFocus[dayIndex] += minutes;
    localStorage.setItem('study_weekly_focus', JSON.stringify(state.weeklyFocus));
    renderFocusChart();
    
    showToast(`Odaklanma Tamam! 🧘 ${minutes} dk çalıştın. +${xp} XP ve +${coins} DP kazandın!`);
}

// --- App Gamification Events (V7) ---
let isSpinning = false;
window.spinRoulette = function() {
    if (isSpinning) return;
    isSpinning = true;
    const wheel = document.getElementById('roulette-wheel');
    const span = wheel.querySelector('span');
    span.innerText = '⏳';
    
    // Spin randomly between 3 to 6 full rotations + random angle
    const degrees = Math.floor(Math.random() * 360) + 1440; 
    wheel.style.transform = `rotate(${degrees}deg)`;
    
    setTimeout(() => {
        const rewards = [{x: 50, n: '+50 XP'}, {x: 100, n: 'Efsane Cuma +100 XP'}, {x: 20, n: '+20 DP'}];
        const r = rewards[Math.floor(Math.random() * rewards.length)];
        span.innerText = '🎉';
        
        // Gamified reward
        if (r.n.includes('DP')) {
            state.coins += r.x;
        } else {
            addXP(r.x);
        }
        showToast(r.n + ' Kazandın!');
        createSparkles(window.innerWidth/2, window.innerHeight/2);
        
        setTimeout(() => {
            document.getElementById('daily-reward-modal').classList.remove('show');
            isSpinning = false;
        }, 2000);
    }, 4000);
}

function claimDailyReward() {
    // Fallback if not spinning
    state.coins += 50;
    localStorage.setItem('study_coins', state.coins);
    updateUI();
    document.getElementById('daily-reward-modal').classList.remove('show');
    showToast('50 Coin kazandın! Mükemmel başlangıç! 🎉');
}

function closeQuiz() { 
    document.getElementById('quiz-modal').classList.remove('show');
}

function showToast(message) {
    const existing = document.getElementById('toast-msg');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.cssText = `position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple)); color: white; padding: 12px 24px; border-radius: 20px; font-weight: 800; font-size: 0.9rem; z-index: 10000; box-shadow: 0 8px 30px rgba(0,0,0,0.5); animation: fadeIn 0.3s ease;`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft/60); const s = timeLeft%60;
    document.getElementById('time-display').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timeLeft = 25 * 60;
    updateTimerDisplay();
    document.getElementById('timer-btn').innerText = 'Başlat';
    document.body.classList.remove('zen-mode'); 
    const shield = document.getElementById('focus-shield');
    if (shield) shield.classList.remove('active');
}

// --- V16 Weekly Timetable System ---
function renderTimetable() {
    const grid = document.getElementById('timetable-grid');
    if (!grid) return;
    
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    const maxSlots = 8; // 8 periods per day is standard
    
    grid.innerHTML = days.map(day => {
        const slots = state.timetable[day] || [];
        let inputsHTML = '';
        for (let i = 0; i < maxSlots; i++) {
            const val = slots[i] || '';
            inputsHTML += `
                <div class="timetable-slot">
                    <span style="opacity:0.5; font-size:0.7rem; align-self:center; min-width:15px;">${i+1}.</span>
                    <input type="text" class="timetable-input" data-day="${day}" data-slot="${i}" value="${val}" placeholder="..." onchange="saveTimetable()">
                </div>
            `;
        }
        return `
            <div class="timetable-col">
                <div class="timetable-day-header">${day}</div>
                ${inputsHTML}
            </div>
        `;
    }).join('');
}

function saveTimetable() {
    const inputs = document.querySelectorAll('.timetable-input');
    const newTimetable = { 'Pazartesi': [], 'Salı': [], 'Çarşamba': [], 'Perşembe': [], 'Cuma': [] };
    
    inputs.forEach(input => {
        const day = input.getAttribute('data-day');
        const slot = input.getAttribute('data-slot');
        newTimetable[day][slot] = input.value;
    });
    
    state.timetable = newTimetable;
    localStorage.setItem('study_timetable', JSON.stringify(state.timetable));
}

// Initial Boot Load
window.onload = function() {
    updateUI();
    checkStreak();
    setTimeout(updateDailyTip, 1000);
    renderLibrary();
    // Assuming loadRiddle exists or safely ignoring
    if (typeof loadRiddle === 'function') loadRiddle();
};
