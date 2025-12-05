//-------------------------------------------------------------
// DOM 取得
//-------------------------------------------------------------
const setupScreen = document.getElementById("setup-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const chapterSelectArea = document.getElementById("chapter-select-area");
const henSelectArea = document.getElementById("hen-select-area");

const chapterSelect = document.getElementById("chapter-select");
const henSelect = document.getElementById("hen-select");
const henChapterSelect = document.getElementById("hen-chapter-select");

const startBtn = document.getElementById("start-btn");
const backToSetupBtn = document.getElementById("back-to-setup-btn");
const backToSetupBtn2 = document.getElementById("back-to-setup-btn2");
const retrySameBtn = document.getElementById("retry-same-btn");

const quizQuestionEl = document.getElementById("quiz-question");
const quizOptionsEl = document.getElementById("quiz-options");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const quizProgressEl = document.getElementById("quiz-progress");
const resultScoreEl = document.getElementById("result-score");

//-------------------------------------------------------------
// 状態
//-------------------------------------------------------------
let currentMode = "chapter"; 
let currentQuestions = [];
let currentIndex = 0;

//-------------------------------------------------------------
// 画面切替
//-------------------------------------------------------------
function showScreen(name) {
  setupScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");

  if (name === "setup") setupScreen.classList.remove("hidden");
  if (name === "quiz") quizScreen.classList.remove("hidden");
  if (name === "result") resultScreen.classList.remove("hidden");
}

//-------------------------------------------------------------
// モード UI 反映
//-------------------------------------------------------------
function updateModeUI() {
  if (currentMode === "chapter") {
    chapterSelectArea.classList.remove("hidden");
    henSelectArea.classList.add("hidden");
  } else if (currentMode === "hen") {
    chapterSelectArea.classList.add("hidden");
    henSelectArea.classList.remove("hidden");
  } else {
    chapterSelectArea.classList.add("hidden");
    henSelectArea.classList.add("hidden");
  }
}

//-------------------------------------------------------------
// 章セレクトを構築（mode: chapter）
//-------------------------------------------------------------
function initChapterSelect() {
  chapterSelect.innerHTML = "";

  for (let henKey in BOOK_STRUCTURE) {
    const hen = BOOK_STRUCTURE[henKey];
    for (let chapterKey in hen.chapters) {
      const opt = document.createElement("option");
      opt.value = `${henKey}-${chapterKey}`;
      opt.textContent = `${hen.name} / ${hen.chapters[chapterKey]}`;
      chapterSelect.appendChild(opt);
    }
  }
}

//-------------------------------------------------------------
// 編 → 章 セレクト構築（mode: hen）
//-------------------------------------------------------------
function initHenSelect() {
  henSelect.innerHTML = "";
  for (let henKey in BOOK_STRUCTURE) {
    const opt = document.createElement("option");
    opt.value = henKey;
    opt.textContent = BOOK_STRUCTURE[henKey].name;
    henSelect.appendChild(opt);
  }
  updateHenChapters();
}

function updateHenChapters() {
  henChapterSelect.innerHTML = "";
  const henKey = henSelect.value;
  if (!henKey) return;

  const chapters = BOOK_STRUCTURE[henKey].chapters;
  for (let chapterKey in chapters) {
    const opt = document.createElement("option");
    opt.value = `${henKey}-${chapterKey}`;
    opt.textContent = chapters[chapterKey];
    henChapterSelect.appendChild(opt);
  }
}

//-------------------------------------------------------------
// クイズ開始処理
//-------------------------------------------------------------
function startQuiz() {
  if (currentMode === "chapter") {
    currentQuestions = QUESTION_BANK[chapterSelect.value];
  } else if (currentMode === "hen") {
    currentQuestions = QUESTION_BANK[henChapterSelect.value];
  } else if (currentMode === "all") {
    // 全問題を結合
    currentQuestions = [];
    for (let key in QUESTION_BANK) {
      currentQuestions.push(...QUESTION_BANK[key]);
    }
  }

  // 価格暴走対策：シャッフル
  currentQuestions = currentQuestions.sort(() => Math.random() - 0.5);

  currentIndex = 0;
  showScreen("quiz");
  renderQuiz();
}

//-------------------------------------------------------------
// クイズ描画
//-------------------------------------------------------------
function renderQuiz() {
  if (currentIndex >= currentQuestions.length) {
    showResult();
    return;
  }

  const q = currentQuestions[currentIndex];

  quizProgressEl.textContent = `問題 ${currentIndex + 1} / ${currentQuestions.length}`;
  quizQuestionEl.textContent = q.q;
  quizFeedbackEl.textContent = "";

  quizOptionsEl.innerHTML = "";
  q.opts.forEach((optText, i) => {
    const btn = document.createElement("button");
    btn.textContent = optText;
    btn.onclick = () => selectAnswer(i);
    quizOptionsEl.appendChild(btn);
  });
}

//-------------------------------------------------------------
// 回答選択
//-------------------------------------------------------------
function selectAnswer(choice) {
  const q = currentQuestions[currentIndex];

  if (choice === q.answer) {
    quizFeedbackEl.textContent = "◯ 正解！";
    quizFeedbackEl.className = "feedback correct";
  } else {
    quizFeedbackEl.textContent = "✕ 不正解";
    quizFeedbackEl.className = "feedback wrong";
  }

  setTimeout(() => {
    currentIndex++;
    renderQuiz();
  }, 850);
}

//-------------------------------------------------------------
// 結果画面
//-------------------------------------------------------------
function showResult() {
  const score = currentQuestions.filter((q, i) => {
    return (q._correct === true);
  }).length;

  resultScoreEl.textContent = `あなたの正解数：${score} / ${currentQuestions.length}`;
  showScreen("result");
}

//-------------------------------------------------------------
// イベント登録
//-------------------------------------------------------------
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener("change", e => {
    currentMode = e.target.value;
    updateModeUI();
  });
});

henSelect.addEventListener("change", updateHenChapters);

startBtn.addEventListener("click", startQuiz);
backToSetupBtn.addEventListener("click", () => showScreen("setup"));
backToSetupBtn2.addEventListener("click", () => showScreen("setup"));
retrySameBtn.addEventListener("click", startQuiz);

//-------------------------------------------------------------
// 初期化
//-------------------------------------------------------------
initChapterSelect();
initHenSelect();
updateModeUI();
showScreen("setup");
