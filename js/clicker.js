// ===== Состояние игры =====
let score = 0;
let isSpinning = false; 
const SPARKS_PER_CLICK = 8;

// Загружаем сохраненный прогресс
let savedScore = localStorage.getItem('clickerScore');
if (savedScore) score = parseInt(savedScore);

// Список аватарок (не забудьте про фото!)
const avatars = [
    { id: 'valera2', name: 'Обычный Валера', price: 0, img: 'valera2.jpg' },       // Изначальная
    { id: 'valera3', name: 'Цветочный Валера', price: 50, img: 'valera3.jpg' },      // Фото 3
    { id: 'valera4', name: 'Армейский Валера', price: 150, img: 'valera4.jpg' },  // Фото 4
    { id: 'valera5', name: 'Сосущий Валера', price: 300, img: 'valera5.jpg' },      // Фото 5
    { id: 'valera6', name: 'Маленький Валера', price: 500, img: 'valera6.jpg' },      // Фото 6
    { id: 'valera', name: 'Пиздатый Валера', price: 1000, img: 'valera.jpg' }  
];

let ownedAvatars = JSON.parse(localStorage.getItem('clickerOwned')) || ['valera2'];
let currentAvatarId = localStorage.getItem('clickerCurrent') || 'valera2';

// ===== DOM-элементы =====
const scoreEl = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');
const mainImage = document.getElementById('mainImage');
const shopGrid = document.getElementById('shopGrid');

// DOM Рулетки
const wheel = document.getElementById('wheel');
const betAmountInput = document.getElementById('betAmount');
const allInBtn = document.getElementById('allInBtn');
const spinBtn = document.getElementById('spinBtn');
const rouletteMsg = document.getElementById('rouletteMsg');

// Инициализация
scoreEl.textContent = score;
updateMainImage();
renderShop();

// ===== Логика вкладок =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Убираем активный класс у всех
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Добавляем активный класс текущей
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// ===== Кликер =====
clickBtn.addEventListener('click', (event) => {
    if (isSpinning) return; 
    incrementScore();
    showPlusOne(event.clientX, event.clientY);
    createSparks(event.clientX, event.clientY);
});

function incrementScore() {
    score++;
    scoreEl.textContent = score;
    localStorage.setItem('clickerScore', score);
    scoreEl.classList.remove('pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('pop');
}

function showPlusOne(x, y) {
    const plus = document.createElement('div');
    plus.className = 'plus-one';
    plus.textContent = '+1';
    plus.style.left = x + 'px';
    plus.style.top = y + 'px';
    document.body.appendChild(plus);
    setTimeout(() => plus.remove(), 800);
}

function createSparks(x, y) {
    for (let i = 0; i < SPARKS_PER_CLICK; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        document.body.appendChild(spark);

        const angle = (Math.PI * 2 * i) / SPARKS_PER_CLICK + Math.random() * 0.5;
        const distance = 50 + Math.random() * 50;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        spark.animate([
            { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
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
            } else {
                if (score >= avatar.price) {
                    score -= avatar.price;
                    scoreEl.textContent = score;
                    localStorage.setItem('clickerScore', score);
                    ownedAvatars.push(avatar.id);
                    localStorage.setItem('clickerOwned', JSON.stringify(ownedAvatars));
                    selectAvatar(avatar.id);
                } else {
                    // Анимация "нет денег"
                    item.style.animation = 'none';
                    item.offsetHeight;
                    item.style.animation = 'pop 0.3s ease';
                    setTimeout(() => item.style.animation = '', 300);
                }
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

    // Списываем ставку
    score -= bet;
    scoreEl.textContent = score;
    localStorage.setItem('clickerScore', score);

    const isWin = Math.random() < 0.5;
    let targetAngle = 0;
    
    // Сектора: выигрышные (0, 2, 4, 6) и проигрышные (1, 3, 5, 7)
    const winSectors = [22.5, 112.5, 202.5, 292.5];
    const loseSectors = [67.5, 157.5, 247.5, 337.5];
    
    if (isWin) {
        const sector = winSectors[Math.floor(Math.random() * winSectors.length)];
        targetAngle = 360 * 5 + (360 - sector);
    } else {
        const sector = loseSectors[Math.floor(Math.random() * loseSectors.length)];
        targetAngle = 360 * 5 + (360 - sector);
    }

    // Сбрасываем и запускаем анимацию
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
