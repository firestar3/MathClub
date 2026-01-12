import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getDatabase, ref, push, get, child, set, remove } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

// --- Content ---
const QUESTIONS = [
    { text: "The sum of two numbers is 48, and their difference is 16. What is the larger number?", answer: ["32"] },
    { text: "A rectangle has length 10 and width 6. What is the area of a circle that has the same perimeter as this rectangle? (Accept approx 81.48 or exact 256/pi)", answer: ["256/pi", "81.48", "81.5", "81"] },
    { text: "A number is increased by 20% and then decreased by 20%. What is the final result as a percent of the original number?", answer: ["96%", "96", "0.96"] },
    { text: "How many positive integers less than 100 are divisible by both 4 and 6?", answer: ["8"] },
    { text: "A box contains 3 red, 5 blue, and 2 green balls. One ball is chosen at random. What is the probability that the ball is not blue?", answer: ["0.5", "1/2", "5/10", "50%"] },
    { text: "The average of 8 numbers is 15. If one of the numbers is removed, the average of the remaining 7 numbers is 16. What was the number that was removed?", answer: ["8"] },
    { text: "A triangle has side lengths 6, 8, and 10. What is the area of the triangle?", answer: ["24"] },
    { text: "How many different three-digit numbers can be formed using the digits 1, 2, 3, 4, and 5 if no digit is repeated?", answer: ["60"] },
    { text: "A clock shows 3:20. What is the smaller angle between the hour hand and the minute hand? (in degrees)", answer: ["20", "20 degrees", "20°"] },
    { text: "A sequence starts with 2 and each term after that is 3 more than the previous term. What is the 50th term?", answer: ["149"] },
    { text: "A square has area 144. What is the length of the diagonal of the square?", answer: ["12sqrt(2)", "12√2", "16.97", "17"] },
    { text: "How many positive factors does 360 have?", answer: ["24"] },
    { text: "A bag contains 4 white marbles and 6 black marbles. Two marbles are drawn without replacement. What is the probability that both marbles are white?", answer: ["2/15", "0.133", "0.13"] },
    { text: "The sum of the digits of a two-digit number is 11. If the digits are reversed, the new number is 27 greater than the original. What is the original number?", answer: ["47"] },
    { text: "How many rectangles, including squares, are there in a 2 by 5 grid?", answer: ["45"] }
];

let currentUser = null;
let timeLeft = 45 * 60; // 45 minutes in seconds

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUser = user;
        initExam();
    }
});

async function initExam() {
    // Check if already taken to prevent direct URL access
    const dbRef = ref(db);
    try {
        const scoreSnapshot = await get(child(dbRef, `users/${currentUser.uid}/scores`));
        if (scoreSnapshot.exists()) {
            const scores = scoreSnapshot.val();
            // Check if any score event matches "2026 Open"
            const hasTaken = Object.values(scores).some(s => s.event === "2026 Open");
            if (hasTaken) {
                alert("You have already completed this competition.");
                window.location.href = 'dashboard.html';
                return;
            }
        }

        // --- Persistent Timer Logic ---
        const startTimeRef = ref(db, `users/${currentUser.uid}/activeExams/2026 Open/startTime`);
        const startTimeSnapshot = await get(startTimeRef);

        let startTime;
        if (startTimeSnapshot.exists()) {
            startTime = startTimeSnapshot.val();
        } else {
            startTime = Date.now();
            await set(startTimeRef, startTime);
        }

        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        timeLeft = (45 * 60) - elapsedSeconds;

        renderQuestions();

        if (timeLeft <= 0) {
            alert("Time for this competition has expired.");
            submitExam();
            return;
        }
    } catch (e) {
        console.error("Error during initExam:", e);
    }

    startTimer();
    document.getElementById('submit-exam-btn').addEventListener('click', () => submitExam());
}

function renderQuestions() {
    const container = document.getElementById('questions-list');
    QUESTIONS.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'question-card glass-panel';
        div.innerHTML = `
            <span class="question-num">Question ${index + 1}</span>
            <div class="question-text">${q.text}</div>
            <input type="text" class="answer-input" id="q-${index}" placeholder="Enter your answer...">
        `;
        container.appendChild(div);
    });
}

function startTimer() {
    const timerEl = document.getElementById('timer');
    const interval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        timerEl.textContent = `${m}:${s < 10 ? '0' + s : s}`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            alert("Time's up! Submitting answers...");
            submitExam();
        }

        // Critical Warning
        if (timeLeft === 300) timerEl.style.background = '#ff4d4d';
    }, 1000);
}

async function submitExam() {
    if (!currentUser) return;
    const btn = document.getElementById('submit-exam-btn');
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    let score = 0;

    QUESTIONS.forEach((q, index) => {
        const input = document.getElementById(`q-${index}`).value.trim().toLowerCase();
        const isCorrect = q.answer.some(a => input === a.toLowerCase());
        if (isCorrect) score++;
    });

    const finalScoreStr = `${score} / ${QUESTIONS.length}`;

    const scoresRef = ref(db, 'users/' + currentUser.uid + '/scores');
    const newEntry = {
        event: "2026 Open",
        date: new Date().toLocaleDateString(),
        score: finalScoreStr,
        rank: calculateRank(score),
        status: "Completed"
    };

    try {
        await push(scoresRef, newEntry);
        // Clear active exam timer
        await remove(ref(db, `users/${currentUser.uid}/activeExams/2026 Open`));

        alert(`Exam Submitted!\nYour Score: ${score}/${QUESTIONS.length}`);
        window.location.href = 'dashboard.html';
    } catch (e) {
        console.error(e);
        alert('Submission failed due to network error. Please try again.');
        btn.disabled = false;
    }
}

function calculateRank(score) {
    if (score === 15) return "Perfect";
    if (score >= 13) return "Gold";
    if (score >= 10) return "Silver";
    if (score >= 7) return "Bronze";
    return "Participant";
}

initParticles();
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
