// app.js（シャッフル機能組込み版）
// クイズアプリ本体

const modeRadios = () => document.querySelectorAll('input[name="mode"]');
const henSelect = document.getElementById("hen-select");
const chapterSelect = document.getElementById("chapter-select");
const questionCountSelect = document.getElementById("question-count");
const startBtn = document.getElementById("start-btn");
const configErrorEl = document.getElementById("config-error");

const quizSection = document.getElementById("quiz-section");
const quizProgressEl = document.getElementById("quiz-progress");
const quizMetaEl = document.getElementById("quiz-meta");
const quizQuestionEl = document.getElementById("quiz-question");
const quizOptionsEl = document.getElementById("quiz-options");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const nextBtn = document.getElementById("next-btn");

const resultSection = document.getElementById("result-section");
const resultSummaryEl = document.getElementById("result-summary");
const resultListOl = document.getElementById("result-list");
const retryBtn = document.getElementById("retry-btn");
const backBtn = document.getElementById("back-btn");

let currentMode = "range";
let selectedHen = null;
let selectedChapter = null;
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answeredResults = [];
let locked = false;
let lastConfig = null;

// --------------------------------------
// ★ Fisher-Yates シャッフル
// --------------------------------------
function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// --------------------------------------
// ★ 選択肢シャッフル + 正答インデックス更新
// --------------------------------------
function shuffleOptions(qObj) {
  const order = shuffle([0, 1, 2, 3]);
  const newOpts = order.map(i => qObj.opts[i]);
  const newAnswer = order.indexOf(qObj.answer);

  return {
    q: qObj.q,
    opts: newOpts,
    answer: newAnswer,
    exp: qObj.exp
  };
}

// --------------------------------------
// 初期処理（略）
// --------------------------------------
function initSelectors() {
  henSelect.innerHTML = "";
  Object.entries(BOOK_STRUCTURE).forEach(([henId, info]) => {
    const opt = document.createElement("option");
    opt.value = henId;
    opt.textContent = info.name;
    henSelect.appendChild(opt);
  });
  selectedHen = henSelect.value;
  populateChapterSelect();

  henSelect.addEventListener("change", () => {
    selectedHen = henSelect.value;
    populateChapterSelect();
  });

  chapterSelect.addEventListener("change", () => {
    selectedChapter = chapterSelect.value;
  });

  modeRadios().forEach(radio => {
    radio.addEventListener("change", () => {
      currentMode = document.querySelector('input[name="mode"]:checked').value;
      updateSelectorsState();
    });
  });

  updateSelectorsState();
}

// （populateChapterSelect / updateSelectorsState / getSelectedMode は変更なし）

// --------------------------------------
// ★ 問題収集 → 必ずシャッフル適用
// --------------------------------------
function collectQuestions(mode, henId, chapterId, count) {
  let list = [];

  if (mode === "range") {
    const key = henId + "-" + chapterId;
    if (!QUESTION_BANK[key]) return [];
    list = QUESTION_BANK[key].slice();
  } else if (mode === "hen") {
    const prefix = henId + "-";
    Object.keys(QUESTION_BANK)
      .filter(k => k.startsWith(prefix))
      .forEach(k => {
        list = list.concat(QUESTION_BANK[k]);
      });
  } else {
    Object.values(QUESTION_BANK).forEach(arr => {
      list = list.concat(arr);
    });
  }

if (!list.length) return [];

// ★ 個々の問題にも毎回シャッフルを適用
const shuffledList = shuffle(list)
  .slice(0, Math.min(count, list.length))
  .map(q => shuffleOptions(q));  // ← ここが重要！

return shuffledList;
}

// --------------------------------------
// startQuiz（略）
// --------------------------------------

// --------------------------------------
// renderQuestion（選択肢はすでにシャッフル済み）
// --------------------------------------
function renderQuestion() {
  const total = quizQuestions.length;
  const qObj = quizQuestions[currentIndex];

  quizProgressEl.textContent = (currentIndex + 1) + " / " + total;
  quizQuestionEl.textContent = qObj.q;
  quizOptionsEl.innerHTML = "";
  quizFeedbackEl.textContent = "";
  quizFeedbackEl.className = "feedback";
  nextBtn.disabled = true;
  locked = false;

  const labels = ["A", "B", "C", "D"];
  qObj.opts.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.innerHTML = `<span class="opt-label">${labels[idx]}</span><span class="opt-text">${optText}</span>`;
    btn.addEventListener("click", () => onSelectOption(idx, btn));
    quizOptionsEl.appendChild(btn);
  });
}

// onSelectOption / showResult / イベント登録は変更なし

document.addEventListener("DOMContentLoaded", () => {
  initSelectors();
  startBtn.addEventListener("click", startQuiz);

  nextBtn.addEventListener("click", () => {
    if (currentIndex < quizQuestions.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      showResult();
    }
  });

  retryBtn.addEventListener("click", () => {
    if (lastConfig) {
      quizSection.classList.remove("hidden");
      resultSection.classList.add("hidden");
      quizQuestions = collectQuestions(
        lastConfig.mode,
        lastConfig.henId,
        lastConfig.chId,
        lastConfig.count
      );
      currentIndex = 0;
      score = 0;
      answeredResults = [];
      renderQuestion();
    }
  });

  backBtn.addEventListener("click", () => {
    quizSection.classList.add("hidden");
    resultSection.classList.add("hidden");
  });
});
