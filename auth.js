import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyA26i_VumRnCZxe1bfDBWXb563ly_w5mn0",
    authDomain: "math-contest-63f0d.firebaseapp.com",
    projectId: "math-contest-63f0d",
    storageBucket: "math-contest-63f0d.firebasestorage.app",
    messagingSenderId: "387688141725",
    appId: "1:387688141725:web:d9742d49e6a49a6bbb5574"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Auth State Helper ---
// If user is already logged in, redirect to dashboard immediately
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'dashboard.html';
    }
});

// --- UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authError = document.getElementById('auth-error');

    initParticles();

    // Login Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Signing In...';
            btn.disabled = true;

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            authError.textContent = '';

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Sign in success:", userCredential.user);
                // Redirect happens in onAuthStateChanged
            } catch (error) {
                console.error("Sign in error:", error);
                authError.textContent = formatError(error.code);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }

    // Register Handler
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = 'Creating...';
            btn.disabled = true;

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPass = document.getElementById('confirm-password').value;

            if (password !== confirmPass) {
                authError.textContent = "Passwords do not match.";
                btn.textContent = originalText;
                btn.disabled = false;
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log("Register success:", userCredential.user);
                // Redirect happens in onAuthStateChanged
            } catch (error) {
                console.error("Register error:", error);
                authError.textContent = formatError(error.code);
                btn.textContent = originalText;
                btn.disabled = false;
            }
        });
    }
});

function formatError(code) {
    if (!code) return "An unknown error occurred.";
    switch (code) {
        case 'auth/invalid-credential': return "Invalid email or password.";
        case 'auth/user-not-found': return "No account found with this email.";
        case 'auth/wrong-password': return "Incorrect password.";
        case 'auth/email-already-in-use': return "Email already registered.";
        case 'auth/weak-password': return "Password should be at least 6 characters.";
        default: return code.replace('auth/', '').replace(/-/g, ' ');
    }
}

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
