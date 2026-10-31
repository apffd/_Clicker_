// ===== Состояние игры =====
let score = 0;
let isSpinning = false;
let clickCount = 0;
const BASE_SPARKS = 8;

// Улучшения
let clickMultiplier = 1;
let passiveIncome = 0;
let goldenLevel = 0;
let critLevel = 0;

// ===== Загрузка прогресса =====
let savedScore = parseInt(localStorage.getItem('clickerScore'));
if (!isNaN(savedScore)) score = savedScore;

let savedClickMult = parseInt(localStorage.getItem('clickerMultiplier'));
if (!isNaN(savedClickMult)) clickMultiplier = savedClickMult;

let savedPassive = parseInt(localStorage.getItem('clickerPassive'));
if (!isNaN(savedPassive)) passiveIncome = savedPassive;

let savedGolden = parseInt(localStorage.getItem('clickerGolden'));
if (!isNaN(savedGolden)) goldenLevel = savedGolden;

let savedCrit = parseInt(localStorage.getItem('clickerCrit'));
if (!isNaN(savedCrit)) critLevel = savedCrit;

let savedClicks = parseInt(localStorage.getItem('clickerClickCount'));
if (!isNaN(savedClicks)) clickCount = savedClicks;

// Аватарки
const avatars = [
    { id: 'valera2', name: 'Обычный Валера', price: 0, img: 'valera2.jpg' },
    { id: 'valera3', name: 'Цветочный Валера', price: 50, img: 'valera3.jpg' },
    { id: 'valera4', name: 'Армейский Валера', price: 150, img: 'valera4.jpg' },
    { id: 'valera5', name: 'Сосущий Валера', price: 300, img: 'valera5.jpg' },
    { id: 'valera6', name: 'Маленький Валера', price: 500, img: 'valera6.jpg' },
    { id: 'valera', name: 'Пиздатый Валера', price: 1000, img: 'valera.jpg' }
];

let ownedAvatars = JSON.parse(localStorage.getItem('clickerOwned')) || ['valera2'];
let currentAvatarId = localStorage.getItem('clickerCurrent') || 'valera2';

// ===== Звания =====
const ranks = [
    { threshold: 0,      name: '🥚 Новичок',       color: '#9ca3af' },
    { threshold: 100,    name: '👆 Кликер',        color: '#ffffff' },
    { threshold: 500,    name: '💪 Профи',         color: '#4ade80' },
    { threshold: 1000,   name: '🔥 Мастер клика',  color: '#fb923c' },
    { threshold: 2000,   name: '⚡ Гуру',          color: '#38bdf8' },
    { threshold: 3500,  name: '👑 Легенда',       color: '#ffd700' },
    { threshold: 5000,  name: '🏆 Бог кликера',   color: '#a855f7' }
];

let currentRankIndex = -1;

function getRankForClicks(clicks) {
    let idx = 0;
    for (let i = 0; i < ranks.length; i++) {
        if (clicks >= ranks[i].threshold) idx = i;
    }
    return idx;
}

function updateRank(animate = false) {
    const newIndex = getRankForClicks(clickCount);
    const rankEl = document.getElementById('rank');
    const fillEl = document.getElementById('rankProgressFill');
    const textEl = document.getElementById('rankProgressText');

    if (newIndex !== currentRankIndex) {
        currentRankIndex = newIndex;
        const rank = ranks[newIndex];
        rankEl.textContent = rank.name;
        rankEl.style.color = rank.color;
        rankEl.style.borderColor = rank.color;
        rankEl.style.textShadow = `0 0 15px ${rank.color}`;
        fillEl.style.background = `linear-gradient(90deg, ${rank.color}, #ffd700)`;

        if (animate) {
            rankEl.classList.remove('upgraded');
            void rankEl.offsetWidth;
            rankEl.classList.add('upgraded');
        }
    }

    // Прогресс до следующего звания
    const currentRank = ranks[currentRankIndex];
    const nextRank = ranks[currentRankIndex + 1];

    if (!nextRank) {
        fillEl.style.width = '100%';
        textEl.textContent = 'Максимум достигнут 🏆';
        return;
    }

    const currentThreshold = currentRank.threshold;
    const nextThreshold = nextRank.threshold;
    const span = nextThreshold - currentThreshold;
    const done = clickCount - currentThreshold;
    const percent = Math.min(100, (done / span) * 100);

    fillEl.style.width = percent + '%';
    textEl.textContent = `${clickCount} / ${nextThreshold} кликов`;
}

// ===== Звуки =====
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(ctx, freqStart, freqEnd, type, volume, duration, delay = 0) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.05);
}

function playClickSound(type = 'normal') {
    try {
        const ctx = getAudioCtx();
        if (type === 'golden') {
            playTone(ctx, 880, 1320, 'sine', 0.12, 0.35);
            playTone(ctx, 1320, 1760, 'sine', 0.08, 0.4, 0.06);
        } else if (type === 'crit') {
            playTone(ctx, 1000, 1500, 'triangle', 0.1, 0.18);
            playTone(ctx, 1500, 2000, 'sine', 0.06, 0.25, 0.03);
        } else {
            const baseFreq = 600 + Math.random() * 150;
            playTone(ctx, baseFreq, 500, 'sine', 0.07, 0.15);
        }
    } catch (e) { }
}

// ===== Улучшения =====
const upgrades = [
    {
        id: 'clickMult',
        name: 'Удвоитель клика',
        desc: 'Увеличивает очки за клик',
        icon: '👆',
        getCurrentLevel: () => clickMultiplier,
        getMaxLevel: () => 100,
        getPrice: (level) => {
            const incomePerSec = clickMultiplier;
            return Math.floor(50 * Math.pow(1.8, level - 1) + incomePerSec * 50);
        },
        effect: () => {
            clickMultiplier++;
            localStorage.setItem('clickerMultiplier', clickMultiplier);
        }
    },
    {
        id: 'passive',
        name: 'Пассивный доход',
        desc: 'Добавляет очки каждую секунду',
        icon: '⏱️',
        getCurrentLevel: () => passiveIncome,
        getMaxLevel: () => 100,
        getPrice: (level) => {
            const incomePerSec = passiveIncome + 1;
            return Math.floor(100 * Math.pow(1.8, level - 1) + incomePerSec * 100);
        },
        effect: () => {
            passiveIncome++;
            localStorage.setItem('clickerPassive', passiveIncome);
        }
    },
    {
        id: 'crit',
        name: 'Критический клик',
        desc: 'Шанс нанести критический удар',
        icon: '💥',
        getCurrentLevel: () => critLevel,
        getMaxLevel: () => 5,
        getPrice: (level) => Math.floor(500 * Math.pow(2.2, level)),
        effect: () => {
            critLevel++;
            localStorage.setItem('clickerCrit', critLevel);
        }
    },
    {
        id: 'golden',
        name: 'Золотой палец',
        desc: 'Усиливает каждый 20-й клик',
        icon: '🌟',
        getCurrentLevel: () => goldenLevel,
        getMaxLevel: () => 10,
        getPrice: (level) => Math.floor(300 * Math.pow(1.7, level)),
        effect: () => {
            goldenLevel++;
            localStorage.setItem('clickerGolden', goldenLevel);
        }
    }
];

// ===== DOM =====
const scoreEl = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');
const mainImage = document.getElementById('mainImage');
const shopGrid = document.getElementById('shopGrid');
const upgradesGrid = document.getElementById('upgradesGrid');

const wheel = document.getElementById('wheel');
const betAmountInput = document.getElementById('betAmount');
const allInBtn = document.getElementById('allInBtn');
const spinBtn = document.getElementById('spinBtn');
const rouletteMsg = document.getElementById('rouletteMsg');

// ===== Инициализация =====
scoreEl.textContent = score;
updateMainImage();
renderShop();
renderUpgrades();
updateRank(false);

// Пассивный доход
setInterval(() => {
    if (passiveIncome > 0 && !isSpinning) {
        score += passiveIncome;
        scoreEl.textContent = score;
        localStorage.setItem('clickerScore', score);
        scoreEl.classList.remove('pop');
        void scoreEl.offsetWidth;
        scoreEl.classList.add('pop');
    }
}, 1000);

// ===== Вкладки =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// ===== Кликер =====
clickBtn.addEventListener('click', (event) => {
    if (isSpinning) return;
    clickCount++;
    localStorage.setItem('clickerClickCount', clickCount);

    const prevRank = currentRankIndex;
    updateRank(false);
    const rankJustUpgraded = currentRankIndex > prevRank;

    const isGolden = clickCount % 20 === 0;
    const critChance = critLevel * 0.05;
    const isCrit = critLevel > 0 && Math.random() < critChance;

    incrementScore(isGolden, isCrit);
    showPlusOne(event.clientX, event.clientY, isGolden, isCrit);
    createSparks(event.clientX, event.clientY, isGolden, isCrit);

    if (rankJustUpgraded) {
        updateRank(true);
        playClickSound('golden');
    } else if (isCrit) playClickSound('crit');
    else if (isGolden) playClickSound('golden');
    else playClickSound('normal');
});

function getGoldenMultiplier() {
    return goldenLevel === 0 ? 1 : goldenLevel * 2;
}

function incrementScore(isGolden = false, isCrit = false) {
    let gain = clickMultiplier;
    if (isGolden) gain *= getGoldenMultiplier();
    if (isCrit) gain *= (3 * critLevel);
    score += gain;
    scoreEl.textContent = score;
    localStorage.setItem('clickerScore', score);
    scoreEl.classList.remove('pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('pop');
    return gain;
}

function showPlusOne(x, y, isGolden = false, isCrit = false) {
    let gain = clickMultiplier;
    if (isGolden) gain *= getGoldenMultiplier();
    if (isCrit) gain *= (3 * critLevel);

    const plus = document.createElement('div');
    plus.className = 'plus-one';
    plus.textContent = `+${gain}${isCrit ? ' 💥' : isGolden ? ' 🌟' : ''}`;

    if (isCrit) {
        plus.style.color = '#ff3b3b';
        plus.style.fontSize = '2.8rem';
        plus.style.textShadow = '0 0 20px rgba(255, 59, 59, 0.9)';
    } else if (isGolden) {
        plus.style.color = '#ffaa00';
        plus.style.fontSize = '2.5rem';
    }

    plus.style.left = x + 'px';
    plus.style.top = y + 'px';
    document.body.appendChild(plus);
    setTimeout(() => plus.remove(), 800);
}

function createSparks(x, y, isGolden = false, isCrit = false) {
    const count = BASE_SPARKS + goldenLevel * 2 + (isCrit ? 10 : 0);
    const color = isCrit ? '#ff3b3b' : isGolden ? '#ffaa00' : '#ffd700';

    for (let i = 0; i < count; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.background = color;
        spark.style.boxShadow = `0 0 10px ${color}`;
        if (isCrit || isGolden) {
            spark.style.width = '12px';
            spark.style.height = '12px';
        }
        document.body.appendChild(spark);

        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 50 + Math.random() * (isCrit ? 120 : isGolden ? 100 : 50);
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        spark.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
        ], {
            duration: isCrit ? 900 : isGolden ? 800 : 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => spark.remove();
    }
}

// ===== Магазин =====
function updateMainImage() {
    const currentAvatar = avatars.find(a => a.id === currentAvatarId);
    if (currentAvatar) mainImage.src = currentAvatar.img;
}

function renderShop() {
    shopGrid.innerHTML = '';
    avatars.forEach(avatar => {
        const isOwned = ownedAvatars.includes(avatar.id);
        const isActive = currentAvatarId === avatar.id;
        const item = document.createElement('div');
        item.className = `shop-item ${isOwned ? '' : 'locked'}`;
        if (isActive) item.classList.add('active');

        item.innerHTML = `
            <img src="${avatar.img}" alt="${avatar.name}">
            <p>${avatar.name}</p>
            ${isOwned
                ? (isActive ? `<div class="status">Выбрано</div>` : `<div class="status" style="color:#fff">Куплено</div>`)
                : `<div class="price">${avatar.price} 🪙</div>`
            }
        `;

        item.addEventListener('click', () => {
            if (isActive) return;
            if (isOwned) {
                selectAvatar(avatar.id);
            } else if (score >= avatar.price) {
                score -= avatar.price;
                scoreEl.textContent = score;
                localStorage.setItem('clickerScore', score);
                ownedAvatars.push(avatar.id);
                localStorage.setItem('clickerOwned', JSON.stringify(ownedAvatars));
                selectAvatar(avatar.id);
            } else {
                item.style.animation = 'none';
                item.offsetHeight;
                item.style.animation = 'softPop 0.2s ease';
                setTimeout(() => item.style.animation = '', 200);
            }
        });
        shopGrid.appendChild(item);
    });
}

function selectAvatar(id) {
    currentAvatarId = id;
    localStorage.setItem('clickerCurrent', currentAvatarId);
    updateMainImage();
    renderShop();
}

// ===== Улучшения =====
function renderUpgrades() {
    upgradesGrid.innerHTML = '';
    upgrades.forEach(upgrade => {
        const currentLevel = upgrade.getCurrentLevel();
        const price = upgrade.getPrice(currentLevel);
        const maxed = currentLevel >= upgrade.getMaxLevel();

        const item = document.createElement('div');
        item.className = `shop-item ${maxed ? 'locked' : ''}`;

        let extraInfo = '';
        if (upgrade.id === 'crit') {
            extraInfo = `<div class="status" style="color:#f87171;">Шанс ${critLevel * 5}% · ×${3 * Math.max(critLevel, 1)}</div>`;
        }
        if (upgrade.id === 'golden') {
            extraInfo = `<div class="status" style="color:#ffaa00;">Множитель ×${getGoldenMultiplier()}</div>`;
        }

        item.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <p>${upgrade.name}</p>
            <p class="upgrade-desc">${upgrade.desc}</p>
            ${extraInfo}
            <div class="price">${maxed ? 'MAX' : price + ' 🪙'}</div>
            <div class="upgrade-level">Ур. ${currentLevel}</div>
        `;

        item.addEventListener('click', () => {
            if (maxed) return;
            const cost = upgrade.getPrice(currentLevel);
            if (score >= cost) {
                score -= cost;
                scoreEl.textContent = score;
                localStorage.setItem('clickerScore', score);
                upgrade.effect();
                renderUpgrades();
            } else {
                item.style.animation = 'none';
                item.offsetHeight;
                item.style.animation = 'softPop 0.2s ease';
                setTimeout(() => item.style.animation = '', 200);
            }
        });
        upgradesGrid.appendChild(item);
    });
}

// ===== Рулетка =====
allInBtn.addEventListener('click', () => {
    betAmountInput.value = score;
});

spinBtn.addEventListener('click', () => {
    if (isSpinning) return;

    const bet = parseInt(betAmountInput.value);

    if (isNaN(bet) || bet <= 0) {
        rouletteMsg.textContent = 'Введите корректную ставку!';
        rouletteMsg.className = 'roulette-msg lose';
        return;
    }
    if (bet > score) {
        rouletteMsg.textContent = 'Недостаточно очков!';
        rouletteMsg.className = 'roulette-msg lose';
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    betAmountInput.disabled = true;
    allInBtn.disabled = true;
    rouletteMsg.textContent = 'Крутится...';
    rouletteMsg.className = 'roulette-msg';

    score -= bet;
    scoreEl.textContent = score;
    localStorage.setItem('clickerScore', score);

    const isWin = Math.random() < 0.5;
    let targetAngle = 0;

    const winSectors = [22.5, 112.5, 202.5, 292.5];
    const loseSectors = [67.5, 157.5, 247.5, 337.5];

    if (isWin) {
        const sector = winSectors[Math.floor(Math.random() * winSectors.length)];
        targetAngle = 360 * 5 + (360 - sector);
    } else {
        const sector = loseSectors[Math.floor(Math.random() * loseSectors.length)];
        targetAngle = 360 * 5 + (360 - sector);
    }

    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    void wheel.offsetWidth;
    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 1)';
    wheel.style.transform = `rotate(${targetAngle}deg)`;

    setTimeout(() => {
        if (isWin) {
            const winAmount = bet * 2;
            score += winAmount;
            rouletteMsg.textContent = `ПОБЕДА! Вы выиграли ${winAmount} 🪙`;
            rouletteMsg.className = 'roulette-msg win';
        } else {
            rouletteMsg.textContent = `УВЫ! Вы потеряли ${bet} 🪙`;
            rouletteMsg.className = 'roulette-msg lose';
        }

        scoreEl.textContent = score;
        localStorage.setItem('clickerScore', score);

        isSpinning = false;
        spinBtn.disabled = false;
        betAmountInput.disabled = false;
        allInBtn.disabled = false;

        if (score < parseInt(betAmountInput.value)) {
            betAmountInput.value = score > 0 ? score : 0;
        }
    }, 4000);
});
