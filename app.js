// ================================
// 変数
// ================================
let quizList = [];
let quizIndex = 0;
let score = 0;
let nextBtn = null;


// ================================
// モードによって出題リストを作る
// ================================
function buildQuizList() {
  const mode = document.querySelector("input[name=mode]:checked").value;

  if (mode === "chapter") {
    const chapter = document.getElementById("chapter-select").value;
    quizList = QUESTION_BANK[chapter] || [];

  } else if (mode === "hen") {
    const hen = document.getElementById("hen-select").value;
    const ch = document.getElementById("hen-chapter-select").value;
    const key = `${hen}-${ch}`;
    quizList = QUESTION_BANK[key] || [];

  } else {
    // 全問題を統合
    quizList = [];
    for (const key in QUESTION_BANK) {
      quizList = quizList.concat(QUESTION_BANK[key]);
    }
  }

  // ランダムにシャッフル
  quizList = quizList.sort(() => Math.random() - 0.5);
}


// ================================
// クイズ開始
// ================================
document.getElementById("start-btn").onclick = () => {
  buildQuizList();

  if (quizList.length === 0) {
    alert("問題がありません。");
    return;
  }

  quizIndex = 0;
  score = 0;

  document.getElementById("setup-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.add("hidden");
  document.getElementById("quiz-screen").classList.remove("hidden");

  showQuiz();
};


// ================================
// 問題表示
// ================================
function showQuiz() {
  const q = quizList[quizIndex];

  document.getElementById("quiz-question").textContent = q.q;

  const optionsDiv = document.getElementById("quiz-options");
  optionsDiv.innerHTML = "";

  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = "";
  feedback.className = "feedback";

  if (nextBtn) nextBtn.remove();

  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    btn.onclick = () => handleAnswer(i, q.answer, q.exp);

    optionsDiv.appendChild(btn);
  });
}


// ================================
// 回答処理
// ================================
function handleAnswer(selected, correct, explanation) {
  const feedback = document.getElementById("quiz-feedback");

  if (selected === correct) {
    score++;
    feedback.textContent = "⭕ 正解！\n" + explanation;
    feedback.classList.add("correct");
  } else {
    feedback.textContent = "❌ 不正解\n" + explanation;
    feedback.classList.add("wrong");
  }

  const optionButtons = document.querySelectorAll("#quiz-options button");
  optionButtons.forEach(b => b.disabled = true);

  nextBtn = document.createElement("button");
  nextBtn.textContent = "次へ";
  nextBtn.className = "btn-primary";
  nextBtn.style.marginTop = "20px";

  nextBtn.onclick = () => {
    quizIndex++;

    if (quizIndex < quizList.length) {
      showQuiz();
    } else {
      showResult();
    }
  };

  document.getElementById("quiz-screen").appendChild(nextBtn);
}


// ================================
// 結果表示
