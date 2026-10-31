// Создание плавающих частиц на фоне
(function createParticles() {
    const PARTICLE_COUNT = 20;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 60 + 10;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';

        document.body.appendChild(particle);
    }
})();