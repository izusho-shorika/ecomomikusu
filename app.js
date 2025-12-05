/* ============================
   エコノミクスクイズ 完全動作版
============================ */

// グローバル変数
let quizList = [];      // 今回出題する問題リスト
let currentIndex = 0;   // 今の何問目か
let score = 0;          // 正解数
let selectedHen = null;
let selectedChapter = null;

/* -----------------------------
   初期セットアップ
----------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  setupModeSwitching();
  setupStartButton();
  setupBackButtons();
});

/* -----------------------------
   モード切り替え（章 or 編→章 or 全範囲）
----------------------------- */
function setupModeSwitching() {
  const modeRadios = document.querySelectorAll("input[name='mode']");
  const chapterArea = document.getElementById("chapter-select-area");
  const henArea = document.getElementById("hen-select-area");

  // 章セレクト初期化
  fillChapterSelect();

  // 編セレクト初期化
  fillHenSelect();

  modeRadios.forEach(r => {
    r.addEventListener("change", () => {
      const mode = document.querySelector("input[name='mode']:checked").value;

      if (mode === "chapter") {
        chapterArea.classList.remove("hidden");
        henArea.classList.add("hidden");
      } else if (mode === "hen") {
        chapterArea.classList.add("hidden");
        henArea.classList.remove("hidden");
      } else {
        chapterArea.classList.add("hidden");
        henArea.classList.add("hidden");
      }
    });
  });
}

/* -----------------------------
   章セレクト生成
----------------------------- */
function fillChapterSelect() {
  const select = document.getElementById("chapter-select");
  select.innerHTML = "";

  for (const hen in BOOK_STRUCTURE) {
    for (const chapter in BOOK_STRUCTURE[hen].chapters) {
      const key = `${hen}-${chapter}`;
      if (QUESTION_BANK[key]) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = `${BOOK_STRUCTURE[hen].chapters[chapter]}（${key}）`;
        select.appendChild(option);
      }
    }
  }
}

/* -----------------------------
   編セレクト生成
----------------------------- */
function fillHenSelect() {
  const henSelect = document.getElementById("hen-select");
  henSelect.innerHTML = "";

  for (const hen in BOOK_STRUCTURE) {
    const option = document.createElement("option");
    option.value = hen;
    option.textContent = BOOK_STRUCTURE[hen].name;
    henSelect.appendChild(option);
  }

  henSelect.addEventListener("change", updateHenChapters);
  updateHenChapters();
}

/* -----------------------------
   編 → 章 セレクト生成
----------------------------- */
function updateHenChapters() {
  const hen = document.getElementById("hen-select").value;
  const chapterSelect = document.getElementById("hen-chapter-select");
  chapterSelect.innerHTML = "";

  const chapters = BOOK_STRUCTURE[hen].chapters;

  for (const chapter in chapters) {
    const key = `${hen}-${chapter}`;
    if (QUESTION_BANK[key]) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = chapters[chapter];
      chapterSelect.appendChild(option);
    }
  }
}

/* -----------------------------
   スタートボタン
----------------------------- */
function setupStartButton() {
  document.getElementById("start-btn").addEventListener("click", () => {
    const mode = document.querySelector("input[name='mode']:checked").value;

    if (mode === "chapter") {
      const key = document.getElementById("chapter-select").value;
      quizList = [...QUESTION_BANK[key]];
    } else if (mode === "hen") {
      const key = document.getElementById("hen-chapter-select").value;
      quizList = [...QUESTION_BANK[key]];
    } else {
      // 全範囲ランダム
      quizList = [];
      for (const key in QUESTION_BANK) {
        quizList = quizList.concat(QUESTION_BANK[key]);
      }
      shuffleArray(quizList);
    }

    startQuiz();
  });
}

/* -----------------------------
   クイズ開始
----------------------------- */
function startQuiz() {
  currentIndex = 0;
  score = 0;

  document.getElementById("setup-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");

  showQuestion();
}

/* -----------------------------
   問題表示
----------------------------- */
function showQuestion() {
  const q = quizList[currentIndex];

  document.getElementById("quiz-progress").textContent =
    `第 ${currentIndex + 1} 問 / 全 ${quizList.length} 問`;

  document.getElementById("quiz-question").textContent = q.q;

  const optionsBox = document.getElementById("quiz-options");
  optionsBox.innerHTML = "";

  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = "";
  feedback.className = "feedback";

  document.getElementById("next-btn").classList.add("hidden");

  q.opts.forEach((text, idx) => {
    const btn = document.createElement("button");
    btn.textContent = text;

    btn.addEventListener("click", () => handleAnswer(idx));

    optionsBox.appendChild(btn);
  });
}

/* -----------------------------
   回答処理
----------------------------- */
function handleAnswer(idx) {
  const q = quizList[currentIndex];
  const feedback = document.getElementById("quiz-feedback");

  if (idx === q.answer) {
    score++;
    feedback.textContent = "⭕ 正解！";
    feedback.classList.add("correct");
  } else {
    feedback.textContent = `❌ 不正解　→ 正解：${q.opts[q.answer]}`;
    feedback.classList.add("wrong");
  }

  // Nextボタン表示
  document.getElementById("next-btn").classList.remove("hidden");

  // 各選択肢ボタンを無効化
  const optionButtons = document.querySelectorAll("#quiz-options button");
  optionButtons.forEach(b => (b.disabled = true));
}

/* -----------------------------
   Next（次へ）ボタン
----------------------------- */
document.getElementById("next-btn").addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < quizList.length) {
    showQuestion();
  } else {
    showResult();
  }
});

/* -----------------------------
   結果画面
----------------------------- */
function showResult() {
  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("result-score").textContent =
    `あなたの得点：${score} / ${quizList.length}`;
  document.getElementById("result-screen").classList.remove("hidden");
}

/* -----------------------------
   戻るボタン
----------------------------- */
function setupBackButtons() {
  document.getElementById("back-to-setup-btn")
    .addEventListener("click", goBackToSetup);
  document.getElementById("back-to-setup-btn2")
    .addEventListener("click", goBackToSetup);

  document.getElementById("retry-same-btn")
    .addEventListener("click", startQuiz);
}

function goBackToSetup() {
  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("setup-screen").classList.remove("hidden");
}

/* -----------------------------
   シャッフル関数
----------------------------- */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
