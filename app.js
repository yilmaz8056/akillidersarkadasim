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
    level: parseInt(localStorage.getItem('study_level')) || 1,
    dailyXP: JSON.parse(localStorage.getItem('study_daily_xp')) || { date: "", amount: 0 }
};

// --- Initialization ---
window.onload = () => {
    // Sync Daily XP
    const today = new Date().toLocaleDateString();
    if (!state.dailyXP || state.dailyXP.date !== today) {
        state.dailyXP = { date: today, amount: 0 };
        localStorage.setItem('study_daily_xp', JSON.stringify(state.dailyXP));
    }
    
    // Safeguard Market Inventory
    if (!Array.isArray(state.inventory)) {
        state.inventory = ['👤'];
        localStorage.setItem('study_inventory', JSON.stringify(state.inventory));
    }
    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(() => console.log('PWA hazır! 📱'))
            .catch(err => console.log('PWA hatası:', err));
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
    updateDailyGoalDisplay();
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
    renderLeaderboard();
    updateDailyGoalDisplay();
}

function updateDailyGoalDisplay() {
    const goal = 100; // Goal: 100 XP per day
    const current = state.dailyXP.amount || 0;
    const percent = Math.min(Math.round((current / goal) * 100), 100);
    
    const path = document.getElementById('daily-progress-path');
    const text = document.getElementById('daily-goal-text');
    
    if (path) path.setAttribute('stroke-dasharray', `${percent}, 100`);
    if (text) text.innerText = `${percent}%`;
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

function addXP(amount, subject = null) {
    state.xp += amount;
    state.coins += Math.floor(amount / 2); 
    
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
        showToast(`Yeni Rozet Kazandın: ${newBadges.join(' ')}`);
    }
}

// --- Navigation ---
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    document.querySelectorAll('aside nav ul li, nav ul li').forEach(li => li.classList.remove('active'));
    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) navItem.classList.add('active');

    if (sectionId === 'lessons') renderSubjectCards();
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
        return `
            <div class="subject-card ${nearMastery}">
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

// --- Audio & Sound Engine ---
const AudioEngine = {
    initialized: false,
    sources: {
        rain: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Rain_on_tin_roof.mp3',
        forest: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Bird_Singing_in_the_Forest_%28Spring%2C_Poland%29.mp3',
        lofi: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Gymnop%C3%A9die_No._1.mp3'
    },
    init() {
        if (this.initialized) return;
        ['rain', 'forest', 'lofi'].forEach(t => {
            const audio = document.getElementById(`audio-${t}`);
            if (audio) { 
                audio.src = this.sources[t];
                audio.load();
                audio.volume = 0.5;
            }
        });
        this.initialized = true;
    }
};

function toggleSound(type) {
    AudioEngine.init(); 
    const btn = document.getElementById(`sound-${type}`);
    const audio = document.getElementById(`audio-${type}`);
    
    if (!audio) return;

    ['rain', 'forest', 'lofi'].forEach(t => {
        if (t !== type) {
            const b = document.getElementById(`sound-${t}`);
            const a = document.getElementById(`audio-${t}`);
            if (b) b.classList.remove('active');
            if (a) a.pause();
        }
    });

    if (btn.classList.toggle('active')) {
        audio.currentTime = 0;
        audio.play().catch(e => {
            console.error('Audio play error:', e);
            showToast('Ses yüklenemedi. Lütfen internet bağlantınızı kontrol edin.');
            btn.classList.remove('active');
        });
        showToast(`${type.toUpperCase()} sesi açıldı. 🎵`);
    } else {
        audio.pause();
        showToast('Ses kapatıldı.');
    }
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
    AudioEngine.init(); // Init audio engine on user interaction
    const subXP = state.subjectXP[subject] || 0;
    const currentLevel = Math.floor(subXP / 50) + 1;
    
    // Fallback to Level 1 if higher levels are missing
    const levelData = QUIZ_BANK[subject][currentLevel] || QUIZ_BANK[subject][1];
    
    if (!levelData) { showToast('İçerik hazırlanıyor!'); return; }
    
    currentQuizQuestions = [...levelData].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQuizIndex = 0;
    renderQuizQuestion(subject, currentLevel);
    document.getElementById('quiz-modal').classList.add('show');
}

function renderQuizQuestion(subject, level) {
    const q = currentQuizQuestions[currentQuizIndex];
    const body = document.getElementById('quiz-body');
    body.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
            <span class="stat-label">${subject} - Seviye ${level}</span>
            <div style="font-size:0.7rem; font-weight:800; opacity:0.6; margin-top:4px;">SORU ${currentQuizIndex + 1} / 10</div>
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
    const stars = correctAnswersCount >= 9 ? '⭐⭐⭐' : correctAnswersCount >= 6 ? '⭐⭐' : '⭐';
    const body = document.getElementById('quiz-body');
    body.innerHTML = `
        <div style="text-align:center; padding: 20px 0;">
            <div style="font-size:3.5rem; margin-bottom:1rem; animation: pulse 1s infinite alternate;">🏆</div>
            <h2 style="color:var(--accent-gold);">Test Tamamlandı!</h2>
            <div class="star-rating">${stars}</div>
            <p>10 soruda <b>${correctAnswersCount}</b> doğru yaptın.</p>
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

// --- Timer & Sound ---
function startSubject(subjectName) {
    showSection('timer');
    document.getElementById('timer-label').innerText = `${subjectName} Çalışması`;
    showToast(`${subjectName} dersine başlanıyor!`);
}

function toggleSound(type) {
    const btn = document.getElementById(`sound-${type}`);
    const audio = document.getElementById(`audio-${type}`);
    ['rain', 'forest', 'lofi'].forEach(t => {
        if (t !== type) {
            const b = document.getElementById(`sound-${t}`);
            const a = document.getElementById(`audio-${t}`);
            if (b) b.classList.remove('active');
            if (a) a.pause();
        }
    });
    if (btn.classList.toggle('active')) {
        audio.play().catch(() => showToast('Ses başlatılamadı.'));
        showToast(`${type.toUpperCase()} sesi açıldı. 🎵`);
    } else { audio.pause(); showToast('Ses kapatıldı.'); }
}

function setTheme(t) {
    state.theme = t; localStorage.setItem('study_theme', t);
    document.body.className = t === 'default' ? '' : `theme-${t}`;
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.remove('active');
        if (dot.classList.contains(`theme-${t}`)) dot.classList.add('active');
    });
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
    if (badge && count) {
        count.innerText = state.streak;
        badge.className = state.streak > 0 ? 'streak-visible' : 'streak-hidden';
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
    const mock = [{name:'Kuzey Yıldızı', xp:1250}, {name:'Siz', xp:state.xp, player:true}, {name:'Bilgin Ada', xp:850}].sort((a,b)=>b.xp-a.xp);
    container.innerHTML = mock.map((u,i)=>`
        <div class="leaderboard-item" style="${u.player?'border-color:var(--accent-blue); background:rgba(0,210,255,0.05)':''}">
            <div class="leaderboard-rank">#${i+1}</div>
            <div class="leaderboard-name">${u.name}</div>
            <div class="leaderboard-xp">${u.xp} XP</div>
        </div>`).join('');
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
                <div class="flashcard-front">${card.front}</div>
                <div class="flashcard-back">${card.back}</div>
            </div>
        </div>`).join('');
}

let timerInterval; let timeLeft = 25 * 60; let isTimerRunning = false;
function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (isTimerRunning) { 
        clearInterval(timerInterval); 
        isTimerRunning = false; 
        btn.innerText = 'Başlat'; 
        document.body.classList.remove('zen-mode'); // Exit Zen Mode
        showSessionRecap(Math.floor((25 * 60 - timeLeft) / 60)); // Partial recap
    }
    else {
        AudioEngine.init();
        isTimerRunning = true; 
        btn.innerText = 'Durdur';
        document.body.classList.add('zen-mode'); // Enter Zen Mode
        timerInterval = setInterval(() => {
            timeLeft--; updateTimerDisplay();
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
    
    // Using a toast for now to keep it premium and non-intrusive
    showToast(`Odaklanma Tamam! 🧘 ${minutes} dk çalıştın. +${xp} XP ve +${coins} DP kazandın!`);
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
function resetTimer() { clearInterval(timerInterval); timeLeft = 25 * 60; updateTimerDisplay(); isTimerRunning = false; document.getElementById('timer-btn').innerText = 'Başlat'; }
