/* script.js — Minimal behavior for demo quiz interactions */

/* ===== sample data (replace with API calls) ===== */
const sampleQuiz = {
  id: 1,
  title: "Programming Basics",
  timeLimitSeconds: 15 * 60, // 15 minutes
  questions: [
    {
      id: 1,
      text: "Which keyword defines a variable in JavaScript?",
      choices: ["var", "define", "letit", "mk"],
      correct: 0
    },
    {
      id: 2,
      text: "Which HTML tag is used for JavaScript?",
      choices: ["<script>", "<js>", "<javascript>", "<code>"],
      correct: 0
    },
    {
      id: 3,
      text: "Which method adds an element to the end of an array?",
      choices: ["push()", "add()", "append()", "insert()"],
      correct: 0
    }
  ]
};

/* ===== DOM refs ===== */
const quizForm = document.getElementById("quizForm");
const questionContainer = document.getElementById("questionContainer");
const quizTitle = document.getElementById("quizTitle");
const timerEl = document.getElementById("timer");
const totalQuestions = document.getElementById("totalQuestions");
const progressLabel = document.getElementById("progressLabel");

let currentIndex = 0;
let answers = new Array(sampleQuiz.questions.length).fill(null);
let remainingSeconds = sampleQuiz.timeLimitSeconds;
let timerInterval = null;

/* initialize */
function init() {
  quizTitle.textContent = sampleQuiz.title;
  totalQuestions.textContent = sampleQuiz.questions.length;
  renderQuestion(currentIndex);
  updateProgress();
  startTimer();

  // demo populate analysis table
  populateAnalysisTable();
}

/* render a single question */
function renderQuestion(i) {
  const q = sampleQuiz.questions[i];
  questionContainer.innerHTML = `
    <h3 id="q${q.id}">Question ${i+1} / ${sampleQuiz.questions.length}</h3>
    <p class="muted">${q.text}</p>
    <div class="choices" role="list">
      ${q.choices.map((c, idx) =>
        `<label class="choice ${answers[i] === idx ? "selected":""}" role="listitem" data-idx="${idx}">
           <input type="radio" name="q${q.id}" value="${idx}" ${answers[i]===idx?"checked":""} />
           <span>${c}</span>
         </label>`).join("")}
    </div>
  `;

  // attach click handlers
  const choiceEls = questionContainer.querySelectorAll(".choice");
  choiceEls.forEach(el => {
    el.onclick = () => {
      const idx = Number(el.dataset.idx);
      answers[i] = idx;
      // visually mark selection
      choiceEls.forEach(c => c.classList.remove("selected"));
      el.classList.add("selected");
      updateProgress();
    };
  });
}

/* navigation */
document.getElementById("prevBtn").addEventListener("click", (e) => {
  e.preventDefault();
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion(currentIndex);
    updateProgress();
  }
});

document.getElementById("nextBtn").addEventListener("click", (e) => {
  e.preventDefault();
  if (currentIndex < sampleQuiz.questions.length - 1) {
    currentIndex++;
    renderQuestion(currentIndex);
    updateProgress();
  }
});

document.getElementById("submitBtn").addEventListener("click", (e) => {
  e.preventDefault();
  submitQuiz();
});

/* update progress label */
function updateProgress() {
  progressLabel.textContent = `${(answers.findIndex(a => a===null) > -1 ? currentIndex+1 : currentIndex+1)} / ${sampleQuiz.questions.length}`;
}

/* timer */
function startTimer() {
  renderTimer();
  timerInterval = setInterval(() => {
    remainingSeconds--;
    renderTimer();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
  }, 1000);
}

function renderTimer() {
  const mins = Math.floor(remainingSeconds / 60).toString().padStart(2,"0");
  const secs = (remainingSeconds % 60).toString().padStart(2,"0");
  timerEl.textContent = `${mins}:${secs}`;
  // visual warning
  if (remainingSeconds <= 120) { // last 2 minutes
    timerEl.style.color = "var(--danger)";
    timerEl.style.textShadow = "0 0 8px rgba(239,68,68,0.4)";
  }
}

/* submit quiz -> naive grading for objective questions */
function submitQuiz() {
  clearInterval(timerInterval);
  // simple auto-grade for demo (counts correct objective choices)
  let score = 0;
  sampleQuiz.questions.forEach((q, i) => {
    if (answers[i] === q.correct) score++;
  });

  // show quick modal (replace with real UI)
  alert(`Quiz submitted. Score: ${score} / ${sampleQuiz.questions.length}`);

  // Here: POST results to server API, then redirect to results page
  // fetch('/api/quizzes/submit', { method:'POST', body: JSON.stringify({quizId: sampleQuiz.id, answers}) })
  //   .then(r=>r.json()).then(...)

  // demo: update local results list
  const recent = document.getElementById("recentResults");
  const li = document.createElement("li");
  li.innerHTML = `${sampleQuiz.title} — <strong class="score">${score} / ${sampleQuiz.questions.length}</strong> <button class="btn tiny">View</button>`;
  recent.prepend(li);
}

/* ===== Item analysis demo population ===== */
function populateAnalysisTable(){
  const tbody = document.querySelector("#itemAnalysisTable tbody");
  // create demo metrics (difficulty 0..1, discr -1..1)
  const rows = sampleQuiz.questions.map((q, idx) => {
    const difficulty = (Math.random()*0.8 + 0.1).toFixed(2); // 0.1 - 0.9
    const discr = (Math.random()*1.8 - 0.9).toFixed(2); // -0.9 - 0.9
    const recommendation = recommendItem(Number(difficulty), Number(discr));
    return `<tr>
      <td>${idx+1}</td>
      <td>${escapeHtml(q.text)}</td>
      <td>${difficulty}</td>
      <td>${discr}</td>
      <td>${renderBadge(recommendation)}</td>
    </tr>`;
  }).join("");
  tbody.innerHTML = rows;
}

/* recommendation logic:
   - difficulty near 0.5 and positive discrimination -> Retain
   - too easy (difficulty > 0.8) or too hard (< 0.2) -> Revise/Reject depending on discrimination
   - discr negative -> Reject (poor item)
*/
function recommendItem(diff, discr) {
  if (discr < 0) return "reject";
  if (diff > 0.8 || diff < 0.2) return "revise";
  return "retain";
}

function renderBadge(key) {
  if (key === "retain") return `<span class="badge retain"><span class="dot" style="background:var(--success)"></span> Retain</span>`;
  if (key === "revise") return `<span class="badge revise"><span class="dot" style="background:var(--warning)"></span> Revise</span>`;
  return `<span class="badge reject"><span class="dot" style="background:var(--danger)"></span> Reject</span>`;
}

/* very small helper to escape HTML in question text */
function escapeHtml(str){
  return str.replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* init on DOM ready */
document.addEventListener("DOMContentLoaded", init);
