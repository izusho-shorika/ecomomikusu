/* =======================================================
   エコノミクス クイズアプリ  app.js（完全版）
   ======================================================= */

// DOM 取得
const setupScreen = document.getElementById("setup-screen");
const quizScreen  = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

// 選択 UI
const hensSelect = document.getElementById("hens");
const chapterSelect = document.getElementById("chapters");
const startBtn = document.getElementById("start-btn");

// クイズ画面
const questionText = document.getElementById("question-text");
const choicesContainer = document.getElementById("choices");
const nextBtn = document.getElementById("next-btn");

// 結果画面
const scoreText = document.getElementById("score-text");
const detailList = document.getElementById("detail-list");
const retryBtn = document.getElementById("retry-btn");

// 状態管理
let currentMode = "chapter"; // "all" / "hen" / "chapter"
let currentHen = null;
let currentChapter = null;

let questions = [];
let currentIndex = 0;
let correctCount = 0;
let userAnswers = [];


/* =======================================================
   初期ロード：編の選択肢を作る
   ======================================================= */
function initSetupScreen() {
  hensSelect.innerHTML = "";

  for (const henId in BOOK_STRUCTURE) {
    const opt = document.createElement("option");
    opt.value = henId;
    opt.textContent = BOOK_STRUCTURE[henId].name;
    hensSelect.appendChild(opt);
  }

  // 初期値
  currentHen = hensSelect.value;
  renderChapters(currentHen);
}

function renderChapters(henId) {
  chapterSelect.innerHTML = "";

  const chapters = BOOK_STRUCTURE[henId].chapters;

  for (const chapId in chapters) {
    const opt = document.createElement("option");
    opt.value = chapId;
    opt.textContent = chapters[chapId];
    chapterSelect.appendChild(opt);
  }

  currentChapter = chapterSelect.value;
}


/* =======================================================
   編・章 UI の変更イベント
   ======================================================= */
hensSelect.addEventListener("change", () => {
  currentHen = hensSelect.value;
  renderChapters(currentHen);
});

chapterSelect.addEventListener("change", () => {
  currentChapter = chapterSelect.value;
});


/* =======================================================
   スタートボタン
   ======================================================= */
startBtn.addEventListener("click", () => {
  const key = `${currentHen}-${currentChapter}`;

  if (!QUESTION_BANK[key]) {
    alert("この章の問題が存在しません。questions.js を確認してください。");
    return;
  }

  // 問題セット
  questions = QUESTION_BANK[key];
  currentIndex = 0;
  correctCount = 0;
  userAnswers = [];

  // 画面遷移
  setupScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  renderQuestion();
});


/* =======================================================
   問題表示
   ======================================================= */
function renderQuestion() {
  const q = questions[currentIndex];

  questionText.textContent = `Q${currentIndex + 1}. ${q.q}`;
  choicesContainer.innerHTML = "";

  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = opt;

    btn.addEventListener("click", () => {
      handleAnswer(i);
    });

    choicesContainer.appendChild(btn);
  });

  nextBtn.disabled = true;
}


/* =======================================================
   回答処理
   ======================================================= */
function handleAnswer(choiceIndex) {
  const q = questions[currentIndex];
  const correctIndex = q.answer;

  const buttons = document.querySelectorAll(".choice-btn");

  // 全ボタンを無効化
  buttons.forEach((b) => b.disabled = true);

  // 正解に色をつける
  buttons[correctIndex].classList.add("correct");

  // 不正解だったら赤
  if (choiceIndex !== correctIndex) {
    buttons[choiceIndex].classList.add("wrong");
  } else {
    correctCount++;
  }

  // 記録
  userAnswers.push({
    question: q.q,
    chosen: choiceIndex,
    correct: correctIndex,
    explanation: q.exp
  });

  nextBtn.disabled = false;
}


/* =======================================================
   次へボタン
   ======================================================= */
nextBtn.addEventListener("click", () => {
  currentIndex++;

  if (currentIndex >= questions.length) {
    // 結果画面へ
    showResult();
  } else {
    // 次の問題表示
    renderQuestion();
  }
});


/* =======================================================
   結果画面
   ======================================================= */
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  scoreText.textContent = `得点：${correctCount} / ${questions.length}`;

  detailList.innerHTML = "";

  userAnswers.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "result-item";

    div.innerHTML = `
      <p><b>Q${i + 1}：${item.question}</b></p>
      <p>あなたの回答：${item.chosen + 1}</p>
      <p>正解：${item.correct + 1}</p>
      <p class="exp">${item.explanation}</p>
      <hr>
    `;

    detailList.appendChild(div);
  });
}


/* =======================================================
   もう一度
   ======================================================= */
retryBtn.addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
});


/* =======================================================
   初期実行
   ======================================================= */
initSetupScreen();
