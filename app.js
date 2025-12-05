// ------------------------------
// UI 切替
// ------------------------------
const setupScreen = document.getElementById("setup-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");

const chapterArea = document.getElementById("chapter-select-area");
const henArea = document.getElementById("hen-select-area");

const chapterSelect = document.getElementById("chapter-select");
const henSelect = document.getElementById("hen-select");
const henChapterSelect = document.getElementById("hen-chapter-select");

let currentQuestions = [];
let quizIndex = 0;
let correctCount = 0;
let lastMode = "chapter";

// ------------------------------
// モード選択で UI 切替
// ------------------------------
document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener("change", () => {
    const m = r.value;
    lastMode = m;

    chapterArea.classList.toggle("hidden", m !== "chapter");
    henArea.classList.toggle("hidden", m !== "hen");
  });
});

// ------------------------------
// プルダウン生成
// ------------------------------
function initSelectors() {
  // 章選択 mode=chapter 用
  chapterSelect.innerHTML = "";
  Object.keys(BOOK_STRUCTURE).forEach(h => {
    const chapters = BOOK_STRUCTURE[h].chapters;

    Object.keys(chapters).forEach(ch => {
      const opt = document.createElement("option");
      opt.value = `${h}-${ch}`;
      opt.textContent = `${BOOK_STRUCTURE[h].name} / ${chapters[ch]}`;
      chapterSelect.appendChild(opt);
    });
  });

  // 編選択 mode=hen 用
  henSelect.innerHTML = "";
  Object.keys(BOOK_STRUCTURE).forEach(h => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = BOOK_STRUCTURE[h].name;
    henSelect.appendChild(opt);
  });

  updateHenChapters();
}

function updateHenChapters() {
  const h = henSelect.value;
  henChapterSelect.innerHTML = "";

  Object.keys(BOOK_STRUCTURE[h].chapters).forEach(ch => {
    const opt = document.createElement("option");
    opt.value = `${h}-${ch}`;
    opt.textContent = BOOK_STRUCTURE[h].chapters[ch];
    henChapterSelect.appendChild(opt);
  });
}

henSelect.addEventListener("change", updateHenChapters);

// ------------------------------
// クイズ開始
// ------------------------------
document.getElementById("start-btn").addEventListener("click", () => {
  let key = "";

  if (lastMode === "chapter") {
    key = chapterSelect.value;
  } else if (lastMode === "hen") {
    key = henChapterSelect.value;
  } else {
    // 全問題モード
    const allKeys = Object.keys(QUESTION_BANK);
    key = allKeys[Math.floor(Math.random() * allKeys.length)];
  }

  currentQuestions = QUESTION_BANK[key];

  if (!currentQuestions || currentQuestions.length === 0) {
    alert("問題データがありません");
    return;
  }

  quizIndex = 0;
  correctCount = 0;

  setupScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");

  showQuestion();
});

// ------------------------------
// 問題表示
// ------------------------------
function showQuestion() {
  const q = currentQuestions[quizIndex];
  document.getElementById("quiz-question").textContent = q.q;
  document.getElementById("quiz-progress").textContent = `${quizIndex + 1} / ${currentQuestions.length}`;

  const optArea = document.getElementById("quiz-options");
  optArea.innerHTML = "";

  q.opts.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.addEventListener("click", () => answer(i));
    optArea.appendChild(btn);
  });

  document.getElementById("quiz-feedback").textContent = "";
}

// ------------------------------
// 回答処理
// ------------------------------
function answer(i) {
  const q = currentQuestions[quizIndex];
  const fb = document.getElementById("quiz-feedback");

  if (i === q.answer) {
    fb.textContent = "正解！ " + q.exp;
    fb.style.color = "green";
    correctCount++;
  } else {
    fb.textContent = "不正解… 正しくは「" + q.opts[q.answer] + "」";
    fb.style.color = "red";
  }

  setTimeout(() => {
    quizIndex++;
    if (quizIndex >= currentQuestions.length) {
      showResult();
    } else {
      showQuestion();
    }
  }, 1100);
}

// ------------------------------
// 結果表示
// ------------------------------
function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  document.getElementById("result-score").textContent =
    `正解数：${correctCount} / ${currentQuestions.length}`;
}

// ------------------------------
// ボタン：戻る・やり直し
// ------------------------------
document.getElementById("back-to-setup-btn").addEventListener("click", () => {
  quizScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
});

document.getElementById("back-to-setup-btn2").addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  setupScreen.classList.remove("hidden");
});

document.getElementById("retry-same-btn").addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  quizIndex = 0;
  correctCount = 0;
  quizScreen.classList.remove("hidden");
  showQuestion();
});

// ------------------------------
initSelectors();
