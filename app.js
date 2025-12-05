// --- ユーティリティ ---
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- DOM ---
const setupScreen = document.getElementById("setup-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const henSelectArea = document.getElementById("hen-select-area");
const chapterSelectArea = document.getElementById("chapter-select-area");
const henSelect = document.getElementById("hen-select");
const chapterSelect = document.getElementById("chapter-select");
const startBtn = document.getElementById("start-btn");

const quizRangeEl = document.getElementById("quiz-range");
const quizProgressEl = document.getElementById("quiz-progress");
const quizQuestionText = document.getElementById("quiz-question-text");
const quizOptionsEl = document.getElementById("quiz-options");
const quizFeedbackEl = document.getElementById("quiz-feedback");
const nextBtn = document.getElementById("next-btn");
const backToSetupBtn = document.getElementById("back-to-setup-btn");

const resultScoreEl = document.getElementById("result-score");
const resultDetailEl = document.getElementById("result-detail");
const retrySameBtn = document.getElementById("retry-same-btn");
const backToSetupBtn2 = document.getElementById("back-to-setup-btn2");
const resultListOl = document.getElementById("result-list-ol");

// --- 状態管理 ---
let currentMode = "chapter"; // "chapter" | "hen" | "all"
let currentHen = "1";
let currentChapter = "2";

let quizQuestions = []; // 実際に出題する20問
let currentIndex = 0;
let score = 0;
let answeredResults = []; // {q, correct, your, correctIndex}

let lastSettings = null; // 同じ範囲でリトライ用

// --- 初期化：編と章のプルダウンをセット ---
function initSelectors() {
  // 編
  henSelect.innerHTML = "";
  for (const henId in BOOK_STRUCTURE) {
    const opt = document.createElement("option");
    opt.value = henId;
    opt.textContent = BOOK_STRUCTURE[henId].name;
    henSelect.appendChild(opt);
  }
  currentHen = henSelect.value;

  // 章
  updateChapterSelect();
}

function updateChapterSelect() {
  const henInfo = BOOK_STRUCTURE[currentHen];
  chapterSelect.innerHTML = "";
  if (!henInfo) return;
  const chapters = henInfo.chapters;
  for (const chId in chapters) {
    const opt = document.createElement("option");
    opt.value = chId;
    opt.textContent = chapters[chId];
    chapterSelect.appendChild(opt);
  }
  currentChapter = chapterSelect.value;
}

// --- モード切替でUIの表示制御 ---
function updateModeUI() {
  const mode = currentMode;
  if (mode === "chapter") {
    henSelectArea.style.display = "block";
    chapterSelectArea.style.display = "block";
  } else if (mode === "hen") {
    henSelectArea.style.display = "block";
    chapterSelectArea.style.display = "none";
  } else {
    // all
    henSelectArea.style.display = "none";
    chapterSelectArea.style.display = "none";
  }
}

// --- 出題セットを作成 ---
function buildQuestionSet(mode, henId, chapterId) {
  let pool = [];

  if (mode === "chapter") {
    const key = `${henId}-${chapterId}`;
    pool = QUESTION_BANK[key] ? QUESTION_BANK[key].slice() : [];
  } else if (mode === "hen") {
    // その編の全章を結合
    const prefix = `${henId}-`;
    for (const key in QUESTION_BANK) {
      if (key.startsWith(prefix)) {
        pool = pool.concat(QUESTION_BANK[key]);
      }
    }
  } else if (mode === "all") {
    // すべて
    for (const key in QUESTION_BANK) {
      pool = pool.concat(QUESTION_BANK[key]);
    }
  }

  const shuffled = shuffle(pool);
  const n = Math.min(20, shuffled.length);
  return shuffled.slice(0, n);
}

// --- 画面表示切り替え ---
function showScreen(name) {
  setupScreen.classList.add("hidden");
  quizScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");

  if (name === "setup") setupScreen.classList.remove("hidden");
  if (name === "quiz") quizScreen.classList.remove("hidden");
  if (name === "result") resultScreen.classList.remove("hidden");
}

// --- クイズ開始 ---
function startQuiz(mode, henId, chapterId) {
  quizQuestions = buildQuestionSet(mode, henId, chapterId);
  currentIndex = 0;
  score = 0;
  answeredResults = [];
  currentMode = mode;
  currentHen = henId;
  currentChapter = chapterId;

  lastSettings = { mode, henId, chapterId };

  // 範囲表示
  let rangeText = "";
  if (mode === "chapter") {
    const henName = BOOK_STRUCTURE[henId]?.name || `第${henId}編`;
    const chName =
      BOOK_STRUCTURE[henId]?.chapters[chapterId] || `第${chapterId}章`;
    rangeText = `${henName} ${chName}`;
  } else if (mode === "hen") {
    const henName = BOOK_STRUCTURE[henId]?.name || `第${henId}編`;
    rangeText = `${henName}（全章からランダム出題）`;
  } else {
    rangeText = "全体（全編・全章からランダム出題）";
  }
  quizRangeEl.textContent = rangeText;

  showScreen("quiz");
  renderCurrentQuestion();
}

// --- 問題表示 ---
let currentSelectedIndex = null;
let locked = false;

function renderCurrentQuestion() {
  const qObj = quizQuestions[currentIndex];
  if (!qObj) return;

  const total = quizQuestions.length;
  quizProgressEl.textContent = `問 ${currentIndex + 1} / ${total}`;

  quizQuestionText.textContent = qObj.q;
  quizOptionsEl.innerHTML = "";
  quizFeedbackEl.textContent = "";
  quizFeedbackEl.className = "feedback";
  nextBtn.disabled = true;
  nextBtn.textContent =
    currentIndex === total - 1 ? "結果を見る" : "次へ";

  currentSelectedIndex = null;
  locked = false;

  qObj.opts.forEach((optText, idx) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = `${"ABCD"[idx]}. ${optText}`;
    btn.addEventListener("click", () => onSelectOption(idx, btn));
    li.appendChild(btn);
    quizOptionsEl.appendChild(li);
  });
}

function onSelectOption(idx, btnEl) {
  if (locked) return;

  currentSelectedIndex = idx;

  // 選択状態の見た目
  document
    .querySelectorAll(".option-btn")
    .forEach((b) => b.classList.remove("selected"));
  btnEl.classList.add("selected");

  // 回答を即時判定してもよいし、「次へ」で判定でもよい。
  // ここでは「選んだ時点で正誤表示」にする。
  const qObj = quizQuestions[currentIndex];
  const correct = idx === qObj.answer;

  document
    .querySelectorAll(".option-btn")
    .forEach((b, i) => {
      b.classList.remove("correct", "wrong");
      if (i === qObj.answer) b.classList.add("correct");
      if (i === idx && !correct) b.classList.add("wrong");
    });

  quizFeedbackEl.textContent = correct ? "正解！" : "不正解...";
  quizFeedbackEl.className = "feedback " + (correct ? "correct" : "wrong");

  locked = true;
  nextBtn.disabled = false;

  // スコア・履歴に保存
  answeredResults.push({
    q: qObj.q,
    your: idx,
    correctIndex: qObj.answer,
    correct
  });
  if (correct) score++;
}

// --- 次の問題 or 結果 ---
nextBtn.addEventListener("click", () => {
  const total = quizQuestions.length;
  if (currentIndex < total - 1) {
    currentIndex++;
    renderCurrentQuestion();
  } else {
    showResult();
  }
});

// --- 結果表示 ---
function showResult() {
  const total = quizQuestions.length;
  const percent = Math.round((score / total) * 100);

  resultScoreEl.textContent = `${score} / ${total} 問 正解（正答率 ${percent}%）`;
  let comment = "";
  if (percent >= 80) comment = "さすが！本番レベルでも十分戦えそうです。";
  else if (percent >= 60) comment = "いい感じです。この調子で弱点をつぶしていきましょう。";
  else comment = "まだ伸びしろ充分。間違えた問題を重点的に復習しよう。";

  resultDetailEl.textContent = comment;

  // 問題ごとの正誤リスト
  resultListOl.innerHTML = "";
  answeredResults.forEach((r, i) => {
    const li = document.createElement("li");
    const correctMark = r.correct ? "✔" : "✖";
    li.textContent = `${correctMark} Q${i + 1}: ${r.q}`;
    li.className = r.correct
      ? "result-item-correct"
      : "result-item-wrong";
    resultListOl.appendChild(li);
  });

  showScreen("result");
}

// --- イベント設定 ---
// モード選択
document.querySelectorAll('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    currentMode = e.target.value;
    updateModeUI();
  });
});

// 編選択
henSelect.addEventListener("change", (e) => {
  currentHen = e.target.value;
  if (currentMode === "chapter" || currentMode === "hen") {
    updateChapterSelect();
  }
});

// 章選択
chapterSelect.addEventListener("change", (e) => {
  currentChapter = e.target.value;
});

// スタートボタン
startBtn.addEventListener("click", () => {
  const mode = currentMode;
  let henId = currentHen;
  let chapterId = currentChapter;

  if (mode === "chapter") {
    startQuiz(mode, henId, chapterId);
  } else if (mode === "hen") {
    startQuiz(mode, henId, null);
  } else {
    startQuiz(mode, null, null);
  }
});

// 最初に戻る
backToSetupBtn.addEventListener("click", () => {
  showScreen("setup");
});

backToSetupBtn2.addEventListener("click", () => {
  showScreen("setup");
});

// 同じ範囲で再チャレンジ
retrySameBtn.addEventListener("click", () => {
  if (!lastSettings) return;
  startQuiz(lastSettings.mode, lastSettings.henId, lastSettings.chapterId);
});

// 初期起動
initSelectors();
updateModeUI();
showScreen("setup");
