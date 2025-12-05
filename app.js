// =====================
// 初期データ読み込み
// =====================
const book = window.BOOK_STRUCTURE;
const bank = window.QUESTION_BANK;

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let lastMode = "";
let lastHen = "";
let lastChapter = "";

// =====================
// DOM
// =====================
const setupScreen = document.getElementById("setup-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const chapterSelectArea = document.getElementById("chapter-select-area");
const henSelectArea = document.getElementById("hen-select-area");

const chapterSelect = document.getElementById("chapter-select");
const henSelect = document.getElementById("hen-select");
const henChapterSelect = document.getElementById("hen-chapter-select");

const startBtn = document.getElementById("start-btn");
const progressEl = document.getElementById("quiz-progress");
const questionEl = document.getElementById("quiz-question");
const optionsEl = document.getElementById("quiz-options");
const feedbackEl = document.getElementById("quiz-feedback");
const nextBtn = document.getElementById("next-btn");

// =====================
// モード切替
// =====================
document.querySelectorAll("input[name='mode']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    const mode = e.target.value;

    if (mode === "chapter") {
      chapterSelectArea.classList.remove("hidden");
      henSelectArea.classList.add("hidden");
    } else if (mode === "hen") {
      chapterSelectArea.classList.add("hidden");
      henSelectArea.classList.remove("hidden");
    } else {
      chapterSelectArea.classList.add("hidden");
      henSelectArea.classList.add("hidden");
    }
  });
});

// =====================
// セレクト初期化
// =====================
function loadChapterList() {
  chapterSelect.innerHTML = "";
  for (const key in bank) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = key + "： " + bank[key][0].q.slice(0, 10);
    chapterSelect.appendChild(opt);
  }
}

function loadHenList() {
  henSelect.innerHTML = "";
  for (const h in book) {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = book[h].name;
    henSelect.appendChild(opt);
  }
}

function loadHenChapters(h) {
  henChapterSelect.innerHTML = "";
  const chapters = book[h].chapters;

  for (const c in chapters) {
    const opt = document.createElement("option");
    opt.value = `${h}-${c}`;
    opt.textContent = chapters[c];
    henChapterSelect.appendChild(opt);
  }
}

henSelect.addEventListener("change", () => {
  loadHenChapters(henSelect.value);
});

// 初期ロード
loadChapterList();
loadHenList();
loadHenChapters(henSelect.value);

// =====================
// スタート処理
// =====================
startBtn.addEventListener("click", () => {
  const mode = document.querySelector("input[name='mode']:checked").value;
  lastMode = mode;

  if (mode === "chapter") {
    lastChapter = chapterSelect.value;
    currentQuestions = [...bank[lastChapter]];
  } else if (mode === "hen") {
    lastHen = henSelect.value;
    lastChapter = henChapterSelect.value;
    currentQuestions = [...bank[lastChapter]];
  } else {
    // 全問題ランダム
    let all = [];
    for (const key in bank) {
      all = all.concat(bank[key]);
    }
    shuffle(all);
    currentQuestions = all.slice(0, 20);
  }

  currentIndex = 0;
  score = 0;

  setupScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  showQuestion();
});

// =====================
// 問題表示
// =====================
function showQuestion() {
  const q = currentQuestions[currentIndex];

  progressEl.textContent = `第 ${currentIndex + 1} 問 / 全 ${currentQuestions.length} 問`;
  questionEl.textContent = q.q;

  optionsEl.innerHTML = "";
  q.opts.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.textContent = opt;
    btn.addEventListener("click", () => selectAnswer(idx));
    optionsEl.appendChild(btn);
  });

  feedbackEl.textContent = "";
  nextBtn.classList.add("hidden");
}

// =====================
// 回答処理
// =====================
function selectAnswer(idx) {
  const q = currentQuestions[currentIndex];

  if (idx === q.answer) {
    feedbackEl.textContent = "◎ 正解！ " + q.exp;
    feedbackEl.className = "feedback correct";
    score++;
  } else {
    feedbackEl.textContent = `× 不正解… 正解は「${q.opts[q.answer]}」\n${q.exp}`;
    feedbackEl.className = "feedback wrong";
  }

  nextBtn.classList.remove("hidden");

  // ボタン無効化
  document.querySelectorAll("#quiz-options button").forEach(b => b.disabled = true);
}

// =====================
// 次へ
// =====================
nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex >= currentQuestions.length) {
    showResult();
  } else {
    showQuestion();
  }
});

// =====================
// 結果
// =====================
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  resultScore.textContent = `得点： ${score} / ${currentQuestions.length}`;
}

// =====================
// シャッフル関数
// =====================
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
