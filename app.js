// app.js（完全版）
// 章が表示されないバグ修正済み
// 正答位置のシャッフル機能搭載

//----------------------------------------------------
// DOM
//----------------------------------------------------
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

//----------------------------------------------------
let currentMode = "range";
let selectedHen = null;
let selectedChapter = null;
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answeredResults = [];
let locked = false;
let lastConfig = null;

//----------------------------------------------------
// シャッフル処理
//----------------------------------------------------
function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 正答インデックスも含めてシャッフル
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

//----------------------------------------------------
// 章セレクト生成
//----------------------------------------------------
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

// 章を表示
function populateChapterSelect() {
  chapterSelect.innerHTML = "";
  const chapters = BOOK_STRUCTURE[selectedHen].chapters;
  Object.entries(chapters).forEach(([cid, cname]) => {
    const opt = document.createElement("option");
    opt.value = cid;
    opt.textContent = cname;
    chapterSelect.appendChild(opt);
  });
  selectedChapter = chapterSelect.value;
}

// モードに応じてセレクト有効・無効を切替
function updateSelectorsState() {
  configErrorEl.textContent = "";

  if (currentMode === "range") {
    henSelect.disabled = false;
    chapterSelect.disabled = false;
  } else if (currentMode === "hen") {
    henSelect.disabled = false;
    chapterSelect.disabled = true;
  } else {
    henSelect.disabled = true;
    chapterSelect.disabled = true;
  }
}

//----------------------------------------------------
// 問題収集（シャッフル適用版）
//----------------------------------------------------
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

  // ★エラーを起こしていた部分を完全修正★
  return shuffle(list)
    .slice(0, Math.min(count, list.length))
    .map(q => shuffleOptions(q));
}

//----------------------------------------------------
// クイズ開始
//----------------------------------------------------
function startQuiz() {
  configErrorEl.textContent = "";

  const mode = currentMode;
  const henId = selectedHen;
  const chapterId = selectedChapter;
  const count = parseInt(questionCountSelect.value, 10);

  quizQuestions = collectQuestions(mode, henId, chapterId, count);

  if (!quizQuestions.length) {
    configErrorEl.textContent = "問題データがありません。";
    return;
  }

  quizSection.classList.remove("hidden");
  resultSection.classList.add("hidden");

  currentIndex = 0;
  score = 0;
  answeredResults = [];

  lastConfig = { mode, henId, chapterId, count };

  renderQuestion();
}

//----------------------------------------------------
// 問題表示
//----------------------------------------------------
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
    btn.innerHTML =
      `<span class="opt-label">${labels[idx]}</span><span class="opt-text">${optText}</span>`;

    btn.addEventListener("click", () => onSelectOption(idx, btn));
    quizOptionsEl.appendChild(btn);
  });
}

//----------------------------------------------------
// 回答処理
//----------------------------------------------------
function onSelectOption(idx, btn) {
  if (locked) return;
  locked = true;

  const qObj = quizQuestions[currentIndex];
  const isCorrect = idx === qObj.answer;

  if (isCorrect) {
    score++;
    quizFeedbackEl.textContent = "正解！";
    quizFeedbackEl.classList.add("correct");
  } else {
    quizFeedbackEl.textContent = "不正解……";
    quizFeedbackEl.classList.add("incorrect");
  }

  const buttons = quizOptionsEl.querySelectorAll("button");
  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === qObj.answer) b.classList.add("correct-option");
    if (i === idx && idx !== qObj.answer) b.classList.add("wrong-option");
  });

  answeredResults.push({
    q: qObj.q,
    opts: qObj.opts,
    answer: qObj.answer,
    userAnswer: idx,
    exp: qObj.exp
  });

  nextBtn.disabled = false;
}

//----------------------------------------------------
// 結果
//----------------------------------------------------
function showResult() {
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  resultSummaryEl.textContent = `正解数：${score} / ${quizQuestions.length}`;

  resultListOl.innerHTML = "";
  answeredResults.forEach((r, idx) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${idx + 1}. ${r.q}</strong><br>
      あなたの答え：${r.opts[r.userAnswer]}<br>
      正解：${r.opts[r.answer]}<br>
      <em>解説：${r.exp}</em>
    `;
    resultListOl.appendChild(li);
  });
}

//----------------------------------------------------
// 初期化
//----------------------------------------------------
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
        lastConfig.chapterId,
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
