import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyA26i_VumRnCZxe1bfDBWXb563ly_w5mn0",
    authDomain: "math-contest-63f0d.firebaseapp.com",
    projectId: "math-contest-63f0d",
    storageBucket: "math-contest-63f0d.firebasestorage.app",
    messagingSenderId: "387688141725",
    appId: "1:387688141725:web:d9742d49e6a49a6bbb5574"
};

// --- App State & Data (MockedDB) ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Mock Competitions Data (In a real app, this comes from Firestore)
const COMPETITIONS = [
    {
        id: "comp_001",
        title: "Calculus Brawl 2026",
        date: "Jan 10, 2026",
        duration: "2 Hours",
        status: "active",
        password: "limit", // The "secret" password for proctoring
        description: "Limits, Derivatives, and Integrals. No calculators allowed."
    },
    {
        id: "comp_002",
        title: "Physics Engineering Challenge",
        date: "Jan 15, 2026",
        duration: "3 Hours",
        status: "upcoming",
        password: "force",
        description: "Applied mechanics and statics problems."
    },
    {
        id: "comp_003",
        title: "Weekly Algebra Mix",
        date: "Jan 05, 2026",
        duration: "1 Hour",
        status: "closed",
        password: "x",
        description: "Standard algebra workout."
    }
];

// Mock Scores Data
const USER_SCORES = [
    { event: "Weekly Algebra Mix", date: "Jan 05, 2026", score: "95/100", rank: "#3", status: "Graded" }
];

// --- UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authView = document.getElementById('auth-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const authError = document.getElementById('auth-error');
    const userEmailDisplay = document.getElementById('user-email-display');
    const logoutBtn = document.getElementById('logout-btn');
    const toggleAuthLink = document.getElementById('toggle-auth');

    const compListContainer = document.getElementById('competitions-list');
    const scoresBody = document.getElementById('scores-body');

    // Modal Elements
    const modal = document.getElementById('password-modal');
    const modalTitle = document.getElementById('modal-comp-title');
    const modalForm = document.getElementById('comp-password-form');
    const modalInput = document.getElementById('comp-password');
    const modalError = document.getElementById('modal-error');
    const closeModal = document.querySelector('.close-modal');

    // State
    let isRegistering = false;
    let selectedCompId = null;

    // --- Particle Background (Reused) ---
    initParticles();

    // --- Auth Listener ---
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            showDashboard(user);
        } else {
            // User is signed out
            showAuth();
        }
    });

    // --- Auth Actions ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        authError.textContent = 'Authenticating...';

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            authError.textContent = '';
        } catch (error) {
            authError.textContent = error.message.replace('Firebase: ', '');
        }
    });

    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });

    toggleAuthLink.addEventListener('click', (e) => {
        e.preventDefault();
        isRegistering = !isRegistering;
        toggleAuthLink.textContent = isRegistering ? "Back to Login" : "Register";
        document.querySelector('.auth-header p').textContent = isRegistering ? "Create a new account" : "Sign in to access competitions";
        loginForm.querySelector('button').textContent = isRegistering ? "Sign Up" : "Sign In";
        authError.textContent = '';
    });

    // --- Dashboard Logic ---
    function showDashboard(user) {
        authView.classList.add('hidden');
        authView.classList.remove('active');
        dashboardView.classList.remove('hidden');
        userEmailDisplay.textContent = user.email;

        renderCompetitions();
        renderScores();
    }

    function showAuth() {
        dashboardView.classList.add('hidden');
        authView.classList.remove('hidden');
        authView.classList.add('active');
        loginForm.reset();
    }

    function renderCompetitions() {
        compListContainer.innerHTML = '';
        COMPETITIONS.forEach(comp => {
            const card = document.createElement('div');
            card.classList.add('comp-card', 'glass-panel');
            if (comp.status === 'closed') card.classList.add('locked');

            const btnText = comp.status === 'closed' ? 'Closed' : 'Enter';

            card.innerHTML = `
                <div class="comp-status">${comp.status.toUpperCase()}</div>
                <h3>${comp.title}</h3>
                <p>${comp.description}</p>
                <div class="comp-meta">
                    <span>📅 ${comp.date}</span>
                    <span>⏱ ${comp.duration}</span>
                </div>
            `;

            if (comp.status !== 'closed') {
                card.addEventListener('click', () => openPasswordModal(comp));
            }

            compListContainer.appendChild(card);
        });
    }

    function renderScores() {
        scoresBody.innerHTML = '';
        USER_SCORES.forEach(score => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${score.event}</td>
                <td>${score.date}</td>
                <td><span style="color:var(--primary); font-weight:700">${score.score}</span></td>
                <td><span class="rank-badge">${score.rank}</span></td>
                <td>${score.status}</td>
            `;
            scoresBody.appendChild(row);
        });
    }

    // --- Modal Logic ---
    function openPasswordModal(comp) {
        selectedCompId = comp.id;
        modalTitle.innerText = `Unlock: ${comp.title}`;
        modal.classList.remove('hidden');
        modalInput.value = '';
        modalError.textContent = '';
        modalInput.focus();
    }

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const inputPass = modalInput.value;
        const comp = COMPETITIONS.find(c => c.id === selectedCompId);

        if (comp && inputPass === comp.password) {
            // SUCCESS - In a real app, this would redirect to the question page
            // For this portal demo, we'll show a success alert
            modalError.style.color = 'var(--success)';
            modalError.textContent = 'Access Granted! Loading exam...';
            setTimeout(() => {
                alert(`Redirecting to ${comp.title} environment...`);
                modal.classList.add('hidden');
                // Mock adding a score for "completed"
                USER_SCORES.unshift({
                    event: comp.title,
                    date: "Just Now",
                    score: "Pending",
                    rank: "-",
                    status: "In Progress"
                });
                renderScores();
            }, 1000);
        } else {
            modalError.style.color = 'var(--error)';
            modalError.textContent = 'Incorrect Password. Ask your proctor.';
        }
    });

    // --- Particles (Simplified from previous version) ---
    function initParticles() {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles = [];
        for (let i = 0; i < 50; i++) particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5
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
});
