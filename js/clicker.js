// ===== Состояние игры =====
let score = 0;
const SPARKS_PER_CLICK = 8;

// ===== DOM-элементы =====
const scoreEl = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');

// ===== Обработчик клика =====
clickBtn.addEventListener('click', (event) => {
    incrementScore();
    showPlusOne(event.clientX, event.clientY);
    createSparks(event.clientX, event.clientY);
});

// ===== Увеличение счёта =====
function incrementScore() {
    score++;
    scoreEl.textContent = score;

    // Перезапуск анимации "pop"
    scoreEl.classList.remove('pop');
    void scoreEl.offsetWidth; // перезапуск reflow
    scoreEl.classList.add('pop');
}

// ===== Всплывающая "+1" =====
function showPlusOne(x, y) {
    const plus = document.createElement('div');
    plus.className = 'plus-one';
    plus.textContent = '+1';
    plus.style.left = x + 'px';
    plus.style.top = y + 'px';
    document.body.appendChild(plus);

    setTimeout(() => plus.remove(), 800);
}

// ===== Частицы-искры =====
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