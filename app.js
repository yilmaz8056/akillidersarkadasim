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
    
    // Phase 3 Fields
    inventory: JSON.parse(localStorage.getItem('study_inventory')) || ['👤'],
    exams: JSON.parse(localStorage.getItem('study_exams')) || [],
    activeAvatar: localStorage.getItem('study_avatar') || '👤',
    quests: JSON.parse(localStorage.getItem('study_quests')) || { date: "", active: [] },
    subjectXP: JSON.parse(localStorage.getItem('study_sub_xp')) || {
        'Matematik': 0, 'Fen Bilimleri': 0, 'Türkçe': 0, 'Sosyal Bilgiler': 0, 'İngilizce': 0, 'Din Kültürü': 0
    },
    level: 1
};

// --- Initialization ---
window.onload = () => {
    checkStreak();
    checkDailyQuests();
    setTheme(state.theme);
    updateUI();
    renderTasks();
    renderFlashcards();
    renderSubjectCards();
    renderExams();
    renderMarket();
    showSection('dashboard');
};

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
    safeSetText('sidebar-avatar', state.activeAvatar);
    safeSetText('profile-avatar', state.activeAvatar);

    updateLevel();
    renderBadges();
    renderChart();
    renderQuests();
}

function updateLevel() {
    state.level = Math.floor(state.xp / 100) + 1;
    const el = document.getElementById('user-level');
    if (el) el.innerText = `Seviye ${state.level}`;
}

function addXP(amount, subject = null) {
    state.xp += amount;
    state.coins += Math.floor(amount / 2); // Earn 1 coin for every 2 XP
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

function checkBadges() {
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
    }
}

// --- Navigation ---
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll('nav ul li').forEach(li => li.classList.remove('active'));
    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) navItem.classList.add('active');

    if (sectionId === 'lessons') renderSubjectCards();
}

// --- Subject Levels & Rendering ---
const SUBJECTS = ['Matematik', 'Fen Bilimleri', 'Türkçe', 'Sosyal Bilgiler', 'İngilizce', 'Din Kültürü'];
const SUBJECT_ICONS = {'Matematik':'🔢', 'Fen Bilimleri':'🧪', 'Türkçe':'📚', 'Sosyal Bilgiler':'🌍', 'İngilizce':'🇬🇧', 'Din Kültürü':'🌙'};

function renderSubjectCards() {
    const grid = document.getElementById('subject-grid');
    if (!grid) return;
    grid.innerHTML = SUBJECTS.map(sub => {
        const xp = state.subjectXP[sub] || 0;
        const lv = Math.floor(xp / 50) + 1;
        const progress = (xp % 50) * 2;
        return `
            <div class="subject-card">
                <div onclick="startSubject('${sub}')" style="cursor:pointer;">
                    <span class="subject-icon">${SUBJECT_ICONS[sub]}</span>
                    <h3>${sub}</h3>
                    <p style="opacity:0.7; font-size:0.85rem;">Seviye ${lv}</p>
                    <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; margin: 12px 0;">
                        <div style="width:${progress}%; height:100%; background:var(--accent-blue); border-radius:3px; transition: 0.3s;"></div>
                    </div>
                </div>
                <button class="btn btn-primary" style="width:100%; padding:12px; font-size:0.9rem; margin-top:5px;" onclick="openQuiz('${sub}')">
                    <i class="fas fa-play-circle"></i>&nbsp; Hemen Test Çöz
                </button>
            </div>
        `;
    }).join('');
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
        // Generate 3 random quests
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
        alert('Avatar güncellendi! 👤');
    } else if (state.coins >= price) {
        state.coins -= price;
        state.inventory.push(icon);
        state.activeAvatar = icon;
        localStorage.setItem('study_coins', state.coins);
        localStorage.setItem('study_inventory', JSON.stringify(state.inventory));
        localStorage.setItem('study_avatar', icon);
        alert('Yeni bir eşya aldın! 🎁');
    } else {
        alert('Yeterli Ders Puanın (DP) yok! 😅');
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
        list.innerHTML = state.exams.map((ex, i) => `
            <div class="exam-item">
                <span><b>${ex.name}</b> - ${ex.date}</span>
                <i class="fas fa-trash-alt" style="cursor:pointer" onclick="deleteExam(${i})"></i>
            </div>
        `).join('');
    }
    
    if (widget && state.exams.length > 0) {
        const next = state.exams.sort((a,b) => new Date(a.date) - new Date(b.date))[0];
        const diff = Math.ceil((new Date(next.date) - new Date()) / (1000 * 60 * 60 * 24));
        widget.innerHTML = `<div class="stat-card" style="margin-top:20px; border-left:4px solid #f44336">
            <b>${next.name} Sınavına ${diff} gün kaldı! ✍️</b>
        </div>`;
    } else if (widget) {
        widget.innerHTML = '';
    }
}

function deleteExam(index) {
    state.exams.splice(index, 1);
    localStorage.setItem('study_exams', JSON.stringify(state.exams));
    renderExams();
}

// --- Quiz System ---
const QUIZ_BANK = {
    'Matematik': [
        { q: '6 + 8 x 2 işleminin sonucu nedir?', a: ['22', '28', '20', '16'], c: 0 },
        { q: 'Hangi sayı asaldır?', a: ['9', '15', '21', '13'], c: 3 },
        { q: 'Dikdörtgenin alanı nasıl bulunur?', a: ['2 x (a+b)', 'a x b', 'a + b', 'a / b'], c: 1 }
    ],
    'Fen Bilimleri': [
        { q: 'Güneş sistemindeki en büyük gezegen hangisidir?', a: ['Mars', 'Jüpiter', 'Satürn', 'Venüs'], c: 1 },
        { q: 'Vücudumuzun temel yapı taşı nedir?', a: ['Doku', 'Organ', 'Hücre', 'Sistem'], c: 2 },
        { q: 'Hangi kuvvet her zaman zıt yöndedir?', a: ['Yerçekimi', 'Kaldırma', 'Sürtünme', 'Manyetik'], c: 2 }
    ],
    'Türkçe': [
        { q: 'Hangisi bir isim tamlamasıdır?', a: ['Mavi ev', 'Kapı kolu', 'Güzel çocuk', 'Hızlı araba'], c: 1 },
        { q: 'Hangisi zıt anlamlı kelime çiftidir?', a: ['Siyah-Kara', 'Ak-Beyaz', 'İyi-Kötü', 'Hızlı-Süratli'], c: 2 },
        { q: 'Cümlenin sonuna hangi işaret konur?', a: ['Virgül', 'Nokta', 'Ünlem', 'Soru İşareti'], c: 1 }
    ],
    'Sosyal Bilgiler': [
        { q: 'Hangisi bir temel haktır?', a: ['Eğitim', 'Araba sürmek', 'Sinemaya gitmek', 'Oyun oynamak'], c: 0 },
        { q: 'İlk Türk devletlerinde hükümdara ne denir?', a: ['Padişah', 'Sultan', 'Kağan', 'Kral'], c: 2 },
        { q: 'Hangisi beşeri bir unsurdur?', a: ['Dağ', 'Göl', 'Köprü', 'Irmak'], c: 2 }
    ],
    'İngilizce': [
        { q: 'What is the opposite of "Hot"?', a: ['Cold', 'Warm', 'Big', 'Fast'], c: 0 },
        { q: 'Which color is a mix of Blue and Red?', a: ['Green', 'Purple', 'Orange', 'Yellow'], c: 1 },
        { q: 'Monday is the ____ day of the week.', a: ['First', 'Second', 'Third', 'Fourth'], c: 0 }
    ],
    'Din Kültürü': [
        { q: 'İslamın şartı kaçtır?', a: ['3', '4', '5', '6'], c: 2 },
        { q: 'İmanın şartı kaçtır?', a: ['5', '6', '7', '8'], c: 1 },
        { q: 'Hangisi Peygamber Efendimizin ismidir?', a: ['Hz. Ali', 'Hz. Muhammed', 'Hz. Ömer', 'Hz. Osman'], c: 1 }
    ]
};

let currentQuizQuestions = [];
let currentQuizIndex = 0;

function openQuiz(subject) {
    const questions = QUIZ_BANK[subject] || [];
    if (questions.length === 0) { alert('Bu ders için henüz test eklenmedi!'); return; }
    
    currentQuizQuestions = [...questions].sort(() => 0.5 - Math.random()).slice(0, 3);
    currentQuizIndex = 0;
    renderQuizQuestion(subject);

    const modal = document.getElementById('quiz-modal');
    modal.style.display = 'flex';
}

function renderQuizQuestion(subject) {
    const q = currentQuizQuestions[currentQuizIndex];
    const body = document.getElementById('quiz-body');
    
    body.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
            <span class="stat-label">${subject} - Soru ${currentQuizIndex + 1}/3</span>
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

function checkQuizAnswer(selected, correct, subject) {
    const buttons = document.querySelectorAll('.quiz-ans-btn');
    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === correct) btn.style.borderColor = '#4caf50';
        if (i === selected && i !== correct) btn.style.borderColor = '#f44336';
    });

    if (selected === correct) {
        addXP(10, subject);
    }

    const body = document.getElementById('quiz-body');
    const isLast = currentQuizIndex === currentQuizQuestions.length - 1;
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'btn btn-primary';
    nextBtn.style.marginTop = '20px';
    nextBtn.style.width = '100%';
    nextBtn.innerText = isLast ? 'Testi Bitir' : 'Sıradaki Soru';
    nextBtn.onclick = () => {
        if (isLast) closeQuiz();
        else {
            currentQuizIndex++;
            renderQuizQuestion(subject);
        }
    };
    body.appendChild(nextBtn);
}

function closeQuiz() { 
    document.getElementById('quiz-modal').style.display = 'none';
    showToast('Test tamamlandı! Harikasın! 🌟');
}

function showToast(message) {
    const existing = document.getElementById('toast-msg');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.style.cssText = `
        position: fixed; bottom: 110px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #00d2ff, #9d50bb);
        color: white; padding: 12px 24px; border-radius: 20px;
        font-weight: 800; font-size: 0.95rem; z-index: 9999;
        box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        animation: fadeIn 0.3s ease;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- Profile & Backup ---
function updateUsername() {
    const input = document.getElementById('username-input');
    if (input.value) {
        document.getElementById('username-display').innerText = input.value;
        localStorage.setItem('study_username', input.value);
        alert('İsim güncellendi!');
    }
}

function exportData() {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ders-arkadasim-yedek.json`;
    a.click();
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

// --- Missing original logic (Timer/Tasks) attached here for completeness ---
// [NOTE: Previous logic for showSection, toggleSound, renderTasks, etc. integrated above or kept same]

function startSubject(subjectName) {
    showSection('timer');
    document.getElementById('timer-label').innerText = `${subjectName} Çalışması`;
    alert(`${subjectName} dersine başlanıyor!`);
}

function setTheme(t) {
    state.theme = t;
    localStorage.setItem('study_theme', t);
    document.body.className = t === 'default' ? '' : `theme-${t}`;
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.remove('active');
        if (dot.classList.contains(`theme-${t}`)) dot.classList.add('active');
    });
}

function toggleSound(type) {
    // Logic from Phase 2
}

function checkStreak() {
    const today = new Date().toLocaleDateString();
    if (state.lastDate !== today) {
        // Simple streak logic
        state.lastDate = today;
        localStorage.setItem('study_last_date', today);
    }
}

function renderChart() {
    const container = document.getElementById('weekly-chart');
    if (!container) return;
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const maxVal = Math.max(...state.weeklyData, 100);
    container.innerHTML = state.weeklyData.map((val, i) => {
        const height = (val / maxVal) * 100;
        return `<div class="chart-bar" style="height: ${height}%" data-day="${days[i]}"></div>`;
    }).join('');
}

function renderBadges() {
    const container = document.getElementById('badges-display');
    if (!container) return;
    if (state.badges.length === 0) {
        container.innerHTML = '<span style="opacity:0.5; font-size:0.85rem;">Rozet kazanmak için XP topla! 🌟</span>';
    } else {
        container.innerHTML = state.badges.map(b => `<span style="font-size:2rem; margin-right:8px;">${b}</span>`).join('');
    }
}

function addTask() { 
    const input = document.getElementById('task-input');
    if (input.value) {
        state.tasks.push({ id: Date.now(), text: input.value, completed: false });
        localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
        input.value = '';
        renderTasks();
    }
}

function renderTasks() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = state.tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="checkbox-custom" onclick="toggleTask(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <span>${task.text}</span>
            </div>
            <i class="fas fa-trash-alt" style="cursor:pointer" onclick="deleteTask(${task.id})"></i>
        </div>
    `).join('');
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) { state.tasksCompleted++; addXP(10); }
        localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
        renderTasks();
        updateUI();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
    renderTasks();
}

function addFlashcard() {
    const f = document.getElementById('card-front');
    const b = document.getElementById('card-back');
    if (f.value && b.value) {
        state.flashcards.push({ id: Date.now(), front: f.value, back: b.value });
        localStorage.setItem('study_cards', JSON.stringify(state.flashcards));
        f.value = ''; b.value = '';
        renderFlashcards();
    }
}

function renderFlashcards() {
    const grid = document.getElementById('flashcards-grid');
    if (!grid) return;
    grid.innerHTML = state.flashcards.map(card => `
        <div class="flashcard-container" onclick="this.classList.toggle('flipped')">
            <div class="flashcard-inner">
                <div class="flashcard-front">${card.front}</div>
                <div class="flashcard-back">${card.back}</div>
            </div>
        </div>
    `).join('');
}

// Timer Logic
let timerInterval;
let timeLeft = 25 * 60;
let isTimerRunning = false;

function toggleTimer() {
    if (isTimerRunning) { clearInterval(timerInterval); isTimerRunning = false; document.getElementById('timer-btn').innerText = 'Başlat'; }
    else {
        isTimerRunning = true; document.getElementById('timer-btn').innerText = 'Durdur';
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft <= 0) { clearInterval(timerInterval); addXP(20); }
        }, 1000);
    }
}

function updateTimerDisplay() {
    const m = Math.floor(timeLeft/60);
    const s = timeLeft%60;
    document.getElementById('time-display').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

function resetTimer() { clearInterval(timerInterval); timeLeft = 25 * 60; updateTimerDisplay(); isTimerRunning = false; }
