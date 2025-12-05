/************************************
 *  エコノミクス甲子園クイズアプリ
 *          app.js（完全版）
 ************************************/

// -------------------------------
// ① QUESTION_BANK から「編一覧」を抽出
// -------------------------------
function getEditionList() {
  const editions = new Set();
  for (const key of Object.keys(QUESTION_BANK)) {
    const [ed] = key.split("-");
    editions.add(ed);
  }
  return Array.from(editions).sort();
}

// -------------------------------
// ② 指定した編の「章一覧」を抽出
// -------------------------------
function getChapterList(edition) {
  return Object.keys(QUESTION_BANK)
    .filter(k => k.startsWith(edition + "-"))
    .map(k => k.split("-")[1])
    .sort((a, b) => Number(a) - Number(b));
}

// -------------------------------
// ③ シャッフル（配列）
// -------------------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// -------------------------------
// ④ 選択肢をシャッフルし、正答位置を再計算
// -------------------------------
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

// -------------------------------
// ⑤ 問題収集（編・章指定 / 編全体 / 全体）
// -------------------------------
function collectQuestions(mode, edition, chapter, count) {
  let list = [];

  if (mode === "select") {
    if (!edition || !chapter) return [];
    list = QUESTION_BANK[`${edition}-${chapter}`] || [];
  }

  else if (mode === "edition") {
    if (!edition) return [];
    const chapters = getChapterList(edition);
    for (const ch of chapters) {
      const data = QUESTION_BANK[`${edition}-${ch}`];
      if (Array.isArray(data)) list.push(...data);
    }
  }

  else if (mode === "all") {
    for (const key of Object.keys(QUESTION_BANK)) {
      const data = QUESTION_BANK[key];
      if (Array.isArray(data)) list.push(...data);
    }
  }

  // 問題シャッフル → 指定数に切り取り → 選択肢をシャッフル
  return shuffle(list)
    .slice(0, Math.min(count, list.length))
    .map(q => shuffleOptions(q));
}

// -------------------------------
// ⑥ UI 初期化（編・章のプルダウンを自動生成）
// -------------------------------
function initUI() {
  const editionSelect = document.getElementById("editionSelect");
  const chapterSelect = document.getElementById("chapterSelect");

  // 編の一覧を表示
  const editions = getEditionList();
  editions.forEach(ed => {
    const op = document.createElement("option");
    op.value = ed;
    op.textContent = `第${ed}編`;
    editionSelect.appendChild(op);
  });

  // 編を選んだら章一覧を更新
  editionSelect.addEventListener("change", () => {
    const ed = editionSelect.value;
    chapterSelect.innerHTML = "<option value=''>章を選択</option>";

    if (!ed) return;

    const chapters = getChapterList(ed);
    chapters.forEach(ch => {
      const op = document.createElement("option");
      op.value = ch;
      op.textContent = `${ch}章`;
      chapterSelect.appendChild(op);
    });
  });
}

// -------------------------------
// ⑦ クイズ開始
// -------------------------------
function startQuiz() {
  const mode = document.querySelector("input[name='mode']:checked").value;
  const edition = document.getElementById("editionSelect").value;
  const chapter = document.getElementById("chapterSelect").value;
  const count = Number(document.getElementById("countSelect").value);

  let questions;
  try {
    questions = collectQuestions(mode, edition, chapter, count);
  } catch (e) {
    alert("問題データの読み込みにエラーがあります。\nquestions.js の構造を確認してください。");
    console.error(e);
    return;
  }

  if (!questions || questions.length === 0) {
    alert("問題が取得できません。条件を確認してください。");
    return;
  }

  renderQuiz(questions);
}

// -------------------------------
// ⑧ クイズ画面表示
// -------------------------------
function renderQuiz(questions) {
  const quizSection = document.getElementById("quizSection");
  const questionBox = document.getElementById("questionBox");
  const resultBox = document.getElementById("resultBox");

  quizSection.classList.remove("hidden");
  resultBox.classList.add("hidden");
  questionBox.innerHTML = "";

  let index = 0;
  let score = 0;

  function showQuestion() {
    const q = questions[index];
    questionBox.innerHTML = `
      <h3>${index + 1}問目</h3>
      <p class="qtext">${q.q}</p>
      <div id="opts"></div>
    `;

    const optsDiv = document.getElementById("opts");
    q.opts.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.className = "opt-btn";
      btn.onclick = () => {
        if (i === q.answer) score++;
        index++;
        if (index < questions.length) showQuestion();
        else showResult();
      };
      optsDiv.appendChild(btn);
    });
  }

  function showResult() {
    questionBox.innerHTML = "";
    resultBox.classList.remove("hidden");

    resultBox.innerHTML = `
      <h3>結果</h3>
      <p>${questions.length}問中 ${score}問正解</p>
      <h4>解説</h4>
    `;

    questions.forEach((q, i) => {
      resultBox.innerHTML += `
        <div class="exp-box">
          <p>${i + 1}. ${q.q}</p>
          <p><strong>正解：</strong>${q.opts[q.answer]}</p>
          <p class="exp">${q.exp}</p>
        </div>
      `;
    });
  }

  showQuestion();
}

// -------------------------------
// ⑨ イベント登録
// -------------------------------
window.addEventListener("DOMContentLoaded", () => {
  initUI();
  document.getElementById("startBtn").addEventListener("click", startQuiz);
});
