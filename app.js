// State Management
let state = {
    xp: parseInt(localStorage.getItem('study_xp')) || 0,
    tasksCompleted: parseInt(localStorage.getItem('study_tasks_done')) || 0,
    studyTime: parseInt(localStorage.getItem('study_time_min')) || 0,
    tasks: JSON.parse(localStorage.getItem('study_tasks')) || [],
    level: 1
};

// Timer Variables
let timerInterval;
let timeLeft = 25 * 60;
let isTimerRunning = false;
let currentMode = 'study'; // 'study' or 'break'

// Initial Load
window.onload = () => {
    updateUI();
    renderTasks();
    showSection('dashboard');
    updateLevel();
};

// --- Navigation ---
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    // Show target section
    document.getElementById(sectionId).classList.add('active');

    // Update nav links
    document.querySelectorAll('nav ul li').forEach(li => li.classList.remove('active'));
    document.getElementById(`nav-${sectionId}`).classList.add('active');
}

// --- Dashboard Logic ---
function updateUI() {
    document.getElementById('stats-xp').innerText = state.xp;
    document.getElementById('stats-tasks').innerText = state.tasksCompleted;
    document.getElementById('stats-time').innerText = `${state.studyTime} dk`;
    document.getElementById('user-level').innerText = `Seviye ${state.level}`;
}

function updateLevel() {
    // Basic leveling formula: XP / 100
    state.level = Math.floor(state.xp / 100) + 1;
    document.getElementById('user-level').innerText = `Seviye ${state.level}`;
}

function addXP(amount) {
    state.xp += amount;
    localStorage.setItem('study_xp', state.xp);
    updateUI();
    updateLevel();
}

// --- Timer Logic (Pomodoro) ---
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (isTimerRunning) {
        pauseTimer();
        btn.innerText = 'Devam Et';
    } else {
        startTimer();
        btn.innerText = 'Durdur';
    }
}

function startTimer() {
    isTimerRunning = true;
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            handleTimerComplete();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
}

function resetTimer() {
    pauseTimer();
    timeLeft = currentMode === 'study' ? 25 * 60 : 5 * 60;
    updateTimerDisplay();
    document.getElementById('timer-btn').innerText = 'Başlat';
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('time-display').innerText = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function handleTimerComplete() {
    if (currentMode === 'study') {
        alert('Tebrikler! Bir çalışma seansı bitti. +20 XP kazandın!');
        addXP(20);
        state.studyTime += 25;
        localStorage.setItem('study_time_min', state.studyTime);
        currentMode = 'break';
        timeLeft = 5 * 60;
        document.getElementById('timer-label').innerText = 'Mola Zamanı ☕';
    } else {
        alert('Mola bitti! Haydi tekrar derse.');
        currentMode = 'study';
        timeLeft = 25 * 60;
        document.getElementById('timer-label').innerText = 'Çalışma Zamanı';
    }
    updateUI();
    updateTimerDisplay();
}

// --- Task Management ---
function addTask() {
    const input = document.getElementById('task-input');
    const text = input.value.trim();

    if (text) {
        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };
        state.tasks.push(newTask);
        saveTasks();
        renderTasks();
        input.value = '';
    }
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            state.tasksCompleted++;
            addXP(10);
            localStorage.setItem('study_tasks_done', state.tasksCompleted);
        } else {
            state.tasksCompleted--;
            addXP(-10);
            localStorage.setItem('study_tasks_done', state.tasksCompleted);
        }
        saveTasks();
        renderTasks();
        updateUI();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('study_tasks', JSON.stringify(state.tasks));
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    state.tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px;">
                <div class="checkbox-custom" onclick="toggleTask(${task.id})">
                    ${task.completed ? '<i class="fas fa-check" style="font-size:0.6rem; color:white;"></i>' : ''}
                </div>
                <span>${task.text}</span>
            </div>
            <i class="fas fa-trash-alt" style="cursor:pointer; color:rgba(255,255,255,0.3);" onclick="deleteTask(${task.id})"></i>
        `;
        list.appendChild(div);
    });
}

// --- Lesson Quick Start ---
function startSubject(subjectName) {
    showSection('timer');
    document.getElementById('timer-label').innerText = `${subjectName} Çalışması`;
    alert(`${subjectName} dersine başlanıyor. Odaklanma moduna geçiyoruz!`);
}

// Event Listeners for Input (Enter key)
document.getElementById('task-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTask();
    }
});
