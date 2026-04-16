// State Management
let state = {
    xp: parseInt(localStorage.getItem('study_xp')) || 0,
    tasksCompleted: parseInt(localStorage.getItem('study_tasks_done')) || 0,
    studyTime: parseInt(localStorage.getItem('study_time_min')) || 0,
    tasks: JSON.parse(localStorage.getItem('study_tasks')) || [],
    flashcards: JSON.parse(localStorage.getItem('study_cards')) || [],
    badges: JSON.parse(localStorage.getItem('study_badges')) || [],
    streak: parseInt(localStorage.getItem('study_streak')) || 0,
    lastDate: localStorage.getItem('study_last_date') || "",
    theme: localStorage.getItem('study_theme') || 'default',
    weeklyData: JSON.parse(localStorage.getItem('study_weekly')) || [0, 0, 0, 0, 0, 0, 0],
    level: 1
};

// Global Audio Objects for Seamless Loop
const audioPlayers = {
    rain: new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'), // Placeholder lo-fi/rain
    forest: new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'),
    lofi: new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')
};
Object.values(audioPlayers).forEach(p => { p.loop = true; p.volume = 0.4; });

let currentAudio = null;

// Timer Variables
let timerInterval;
let timeLeft = 25 * 60;
let isTimerRunning = false;
let currentMode = 'study';

window.onload = () => {
    checkStreak();
    setTheme(state.theme);
    updateUI();
    renderTasks();
    renderFlashcards();
    renderChart();
    checkBadges();
    showSection('dashboard');
};

// --- Streak Logic ---
function checkStreak() {
    const today = new Date().toLocaleDateString();
    if (state.lastDate === "") {
        state.streak = 0;
    } else {
        const last = new Date(state.lastDate);
        const diffTime = Math.abs(new Date() - last);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            state.streak++;
        } else if (diffDays > 1) {
            state.streak = 0;
        }
    }
    state.lastDate = today;
    localStorage.setItem('study_last_date', state.lastDate);
    localStorage.setItem('study_streak', state.streak);

    const badge = document.getElementById('streak-badge');
    if (state.streak > 0) {
        badge.classList.remove('streak-hidden');
        document.getElementById('streak-count').innerText = state.streak;
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
}

// --- UI & Stats ---
function updateUI() {
    document.getElementById('stats-xp').innerText = state.xp;
    document.getElementById('stats-tasks').innerText = state.tasksCompleted;
    document.getElementById('stats-time').innerText = `${state.studyTime} dk`;
    updateLevel();
    renderBadges();
    renderChart();
}

function updateLevel() {
    state.level = Math.floor(state.xp / 100) + 1;
    document.getElementById('user-level').innerText = `Seviye ${state.level}`;
}

function addXP(amount) {
    state.xp += amount;
    localStorage.setItem('study_xp', state.xp);
    
    // Update weekly data (today's index)
    const dayIndex = new Date().getDay(); // 0 is Sunday
    state.weeklyData[dayIndex] += amount;
    localStorage.setItem('study_weekly', JSON.stringify(state.weeklyData));

    checkBadges();
    updateUI();
}

// --- Themes ---
function setTheme(t) {
    state.theme = t;
    localStorage.setItem('study_theme', t);
    document.body.className = t === 'default' ? '' : `theme-${t}`;
    
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.remove('active');
        if (dot.classList.contains(`theme-${t}`)) dot.classList.add('active');
    });
}

// --- Sound Controls ---
function toggleSound(type) {
    const btn = document.getElementById(`sound-${type}`);
    
    if (currentAudio && currentAudio === audioPlayers[type]) {
        currentAudio.pause();
        currentAudio = null;
        btn.classList.remove('active');
    } else {
        if (currentAudio) {
            currentAudio.pause();
            document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
        }
        currentAudio = audioPlayers[type];
        currentAudio.play();
        btn.classList.add('active');
    }
}

// --- Chart Rendering (Simple SVG) ---
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

// --- Badges System ---
const BADGE_LIST = [
    { id: 'first_task', icon: '🎯', name: 'İlk Adım', desc: 'İlk görevini tamamladın!', check: () => state.tasksCompleted >= 1 },
    { id: 'study_1hr', icon: '⌛', name: 'Sabırlı', desc: '60 dakika çalıştın.', check: () => state.studyTime >= 60 },
    { id: 'xp_500', icon: '👑', name: 'XP Kralı', desc: '500 XP topladın.', check: () => state.xp >= 500 },
    { id: 'streak_3', icon: '🔥', name: 'Alevli', desc: '3 gün üst üste çalıştın.', check: () => state.streak >= 3 }
];

function checkBadges() {
    BADGE_LIST.forEach(b => {
        if (!state.badges.includes(b.id) && b.check()) {
            state.badges.push(b.id);
            localStorage.setItem('study_badges', JSON.stringify(state.badges));
            alert(`YENİ ROZET KAZANDIN: ${b.name}! 🏆`);
        }
    });
}

function renderBadges() {
    const container = document.getElementById('badges-display');
    if (!container) return;
    container.innerHTML = BADGE_LIST.map(b => `
        <div class="badge-icon ${state.badges.includes(b.id) ? '' : 'locked'}" title="${b.name}: ${b.desc}">
            ${b.icon}
        </div>
    `).join('');
}

// --- Flashcard Management ---
function addFlashcard() {
    const front = document.getElementById('card-front');
    const back = document.getElementById('card-back');
    if (front.value && back.value) {
        state.flashcards.push({ id: Date.now(), front: front.value, back: back.value });
        localStorage.setItem('study_cards', JSON.stringify(state.flashcards));
        front.value = ''; back.value = '';
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
            <i class="fas fa-times" style="position:absolute; top:5px; right:5px; z-index:10; font-size:0.7rem; opacity:0.3;" onclick="event.stopPropagation(); deleteCard(${card.id})"></i>
        </div>
    `).join('');
}

function deleteCard(id) {
    state.flashcards = state.flashcards.filter(c => c.id !== id);
    localStorage.setItem('study_cards', JSON.stringify(state.flashcards));
    renderFlashcards();
}

// --- Original Timer & Task Logic (Enhanced) ---
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (isTimerRunning) { pauseTimer(); btn.innerText = 'Devam Et'; }
    else { startTimer(); btn.innerText = 'Durdur'; }
}

function startTimer() {
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) { clearInterval(timerInterval); isTimerRunning = false; handleTimerComplete(); }
    }, 1000);
}

function pauseTimer() { clearInterval(timerInterval); isTimerRunning = false; }
function resetTimer() { 
    pauseTimer(); 
    timeLeft = currentMode === 'study' ? 25 * 60 : 5 * 60; 
    updateTimerDisplay(); 
    document.getElementById('timer-btn').innerText = 'Başlat'; 
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('time-display').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handleTimerComplete() {
    if (currentMode === 'study') {
        alert('Tebrikler! +20 XP kazandın!');
        addXP(20);
        state.studyTime += 25;
        localStorage.setItem('study_time_min', state.studyTime);
        currentMode = 'break'; timeLeft = 5 * 60;
        document.getElementById('timer-label').innerText = 'Mola Zamanı ☕';
    } else {
        currentMode = 'study'; timeLeft = 25 * 60;
        document.getElementById('timer-label').innerText = 'Çalışma Zamanı';
    }
    updateUI(); updateTimerDisplay();
}

function addTask() {
    const input = document.getElementById('task-input');
    if (input.value.trim()) {
        state.tasks.push({ id: Date.now(), text: input.value.trim(), completed: false });
        localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
        input.value = ''; renderTasks();
    }
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) { state.tasksCompleted++; addXP(10); } 
        else { state.tasksCompleted--; addXP(-10); }
        localStorage.setItem('study_tasks_done', state.tasksCompleted);
        localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
        renderTasks(); updateUI();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = state.tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="checkbox-custom" onclick="toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check" style="font-size:0.6rem; color:white;"></i>' : ''}
                </div>
                <span>${task.text}</span>
            </div>
            <i class="fas fa-trash-alt" style="cursor:pointer; color:rgba(255,255,255,0.3);" onclick="deleteTask(${task.id})"></i>
        </div>
    `).join('');
}

function startSubject(subjectName) {
    showSection('timer');
    document.getElementById('timer-label').innerText = `${subjectName} Çalışması`;
    alert(`${subjectName} dersine başlanıyor!`);
}
