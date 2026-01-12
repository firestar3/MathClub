import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA26i_VumRnCZxe1bfDBWXb563ly_w5mn0",
    authDomain: "math-contest-63f0d.firebaseapp.com",
    projectId: "math-contest-63f0d",
    storageBucket: "math-contest-63f0d.firebasestorage.app",
    messagingSenderId: "387688141725",
    appId: "1:387688141725:web:d9742d49e6a49a6bbb5574",
    databaseURL: "https://math-contest-63f0d-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- Data ---
const COMPETITIONS = [
    {
        id: "comp_2026_open",
        title: "2026 Open",
        date: "Start: Tentative",
        duration: "45 Mins",
        status: "upcoming",
        password: "7777",
        description: "Year opening competition. General mathematics aptitude test."
    }
];

// --- Protection Logic ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        document.getElementById('user-email-display').textContent = user.email;
        initDashboard(user);
    }
});

function initDashboard(user) {
    initParticles();
    // renderCompetitions called inside listener safely
    setupScoresListener(user);
    setupModal(user);

    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = 'index.html');
    });
}

function renderCompetitions(completedSet = new Set()) {
    const container = document.getElementById('competitions-list');
    container.innerHTML = '';

    COMPETITIONS.forEach(comp => {
        const isDone = completedSet.has(comp.title);
        const card = document.createElement('div');
        card.classList.add('comp-card', 'glass-panel');

        if (isDone) {
            card.style.opacity = '0.6';
            card.style.cursor = 'default';
            card.classList.add('locked');
        }

        const statusBadge = isDone
            ? `<div class="comp-status" style="border-color:var(--text-muted); color:white; background:rgba(255,255,255,0.1)">COMPLETED</div>`
            : `<div class="comp-status">${comp.status.toUpperCase()}</div>`;

        card.innerHTML = `
            ${statusBadge}
            <h3>${comp.title}</h3>
            <p>${isDone ? "You have already submitted this exam." : comp.description}</p>
            <div class="comp-meta">
                <span>📅 ${comp.date}</span>
                <span>⏱ ${comp.duration}</span>
            </div>
        `;

        if (!isDone) {
            card.addEventListener('click', () => openPasswordModal(comp));
        }

        container.appendChild(card);
    });
}

function setupScoresListener(user) {
    const scoresRef = ref(db, 'users/' + user.uid + '/scores');

    onValue(scoresRef, (snapshot) => {
        const scoresData = snapshot.val();
        renderScores(scoresData);

        // Check which comps are done
        const completed = new Set();
        if (scoresData) {
            Object.values(scoresData).forEach(s => completed.add(s.event));
        }
        renderCompetitions(completed);

    }, (error) => {
        console.error("Error reading scores:", error);
    });
}

function renderScores(data) {
    const tbody = document.getElementById('scores-body');
    const ratingEl = document.getElementById('user-rating');
    tbody.innerHTML = '';

    if (!data) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 2rem;">No competitions taken yet.</td></tr>';
        ratingEl.textContent = "0.00 / 8";
        return;
    }

    const scoresArray = Object.values(data).reverse();

    // Calculate Rating
    const points = scoresArray.map(s => {
        switch (s.rank) {
            case 'Perfect': return 8;
            case 'Gold': return 7;
            case 'Silver': return 5;
            case 'Bronze': return 3;
            case 'Participant': return 1;
            default: return 0;
        }
    });

    // Rating = Average of top 50%
    points.sort((a, b) => b - a); // Descending
    const topCount = Math.ceil(points.length * 0.5);
    const topPoints = points.slice(0, topCount);

    let avg = 0;
    if (topPoints.length > 0) {
        const sum = topPoints.reduce((a, b) => a + b, 0);
        avg = sum / topPoints.length;
    }

    ratingEl.textContent = `${avg.toFixed(2)} / 8`;

    scoresArray.forEach(score => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${score.event}</td>
            <td>${score.date}</td>
            <td><span style="color:var(--primary); font-weight:700">${score.score}</span></td>
            <td><span class="rank-badge">${score.rank}</span></td>
            <td>${score.status}</td>
        `;
        tbody.appendChild(row);
    });
}

let selectedCompId = null;

function setupModal(user) {
    const modal = document.getElementById('password-modal');
    const form = document.getElementById('comp-password-form');
    const closeBtn = document.querySelector('.close-modal');
    const errorMsg = document.getElementById('modal-error');

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputPass = document.getElementById('comp-password').value;
        const comp = COMPETITIONS.find(c => c.id === selectedCompId);

        if (comp && inputPass === comp.password) {
            errorMsg.style.color = '#00ff88';
            errorMsg.textContent = 'Access Granted!';
            setTimeout(() => {
                window.location.href = 'exam.html';
            }, 1000);
        } else {
            errorMsg.style.color = '#ff4d4d';
            errorMsg.textContent = 'Incorrect Password.';
        }
    });
}

function openPasswordModal(comp) {
    selectedCompId = comp.id;
    const modal = document.getElementById('password-modal');
    document.getElementById('modal-comp-title').innerText = `Unlock: ${comp.title}`;
    document.getElementById('comp-password').value = '';
    document.getElementById('modal-error').textContent = '';
    modal.classList.remove('hidden');
}

function initParticles() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    let particles = [];
    for (let i = 0; i < 50; i++) particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5
    });
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0, 242, 255, 0.3)';
        particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}
