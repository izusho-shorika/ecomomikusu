let quizList = [];
let quizIndex = 0;
let score = 0;

// ▼ 「次へ」ボタンを後で生成するための変数
let nextBtn = null;

// ================================
// 問題を表示
// ================================
function showQuiz() {
  const q = quizList[quizIndex];

  document.getElementById("quiz-question").textContent = q.q;

  const optionsDiv = document.getElementById("quiz-options");
  optionsDiv.innerHTML = "";

  // フィードバック非表示
  const feedback = document.getElementById("quiz-feedback");
  feedback.textContent = "";
  feedback.className = "feedback";

  // 以前の「次へ」ボタンを消す
  if (nextBtn) nextBtn.remove();

  // 選択肢ボタン生成
  q.opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    btn.onclick = () => handleAnswer(i, q.answer, q.exp);

    optionsDiv.appendChild(btn);
  });
}


// ================================
// 回答処理（選択肢を押した時）
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

  // すべてのボタンを無効化
  const optionButtons = document.querySelectorAll("#quiz-options button");
  optionButtons.forEach(b => b.disabled = true);

  // ▼ 「次へ」ボタンを生成
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
// 結果画面
// ================================
function showResult() {
  document.getElementById("quiz-screen").classList.add("hidden");
  document.getElementById("result-screen").classList.remove("hidden");

  document.getElementById("result-score").textContent =
    `正解数：${score} / ${quizList.length}`;
}
