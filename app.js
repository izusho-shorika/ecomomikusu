// app.js
// クイズアプリ本体

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

let currentMode = "range";
let selectedHen = null;
let selectedChapter = null;
let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answeredResults = [];
let locked = false;
let lastConfig = null;

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initSelectors() {
  // 編の選択肢
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

function populateChapterSelect() {
  const henId = selectedHen;
  chapterSelect.innerHTML = "";
  const info = BOOK_STRUCTURE[henId];
  if (!info) return;
  Object.entries(info.chapters).forEach(([chId, label]) => {
    const opt = document.createElement("option");
    opt.value = chId;
    opt.textContent = label;
    chapterSelect.appendChild(opt);
  });
  selectedChapter = chapterSelect.value;
}

function updateSelectorsState() {
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

function getSelectedMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

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
    // all
    Object.values(QUESTION_BANK).forEach(arr => {
      list = list.concat(arr);
    });
  }

  if (!list.length) return [];
  const shuffled = shuffle(list);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function startQuiz() {
  const mode = getSelectedMode();
  const henId = henSelect.value;
  const chId = chapterSelect.value;
  const count = parseInt(questionCountSelect.value, 10);

  configErrorEl.textContent = "";

  if (mode === "range") {
    if (!henId || !chId) {
      configErrorEl.textContent = "編と章を選択してください。";
      return;
    }
  } else if (mode === "hen") {
    if (!henId) {
      configErrorEl.textContent = "編を選択してください。";
      return;
    }
  }

  const qs = collectQuestions(mode, henId, chId, count);
  if (!qs.length) {
    configErrorEl.textContent = "この条件に該当する問題がありません。";
    return;
  }

  quizQuestions = qs;
  currentMode = mode;
  selectedHen = henId;
  selectedChapter = chId;
  currentIndex = 0;
  score = 0;
  answeredResults = [];
  locked = false;
  nextBtn.disabled = true;
  quizFeedbackEl.textContent = "";
  quizFeedbackEl.className = "feedback";

  // メタ情報
  let meta = "";
  if (mode === "range") {
    meta = BOOK_STRUCTURE[henId].name + " / " + BOOK_STRUCTURE[henId].chapters[chId];
  } else if (mode === "hen") {
    meta = BOOK_STRUCTURE[henId].name + "：全章ランダム";
  } else {
    meta = "全範囲ランダム";
  }
  quizMetaEl.textContent = meta;

  quizSection.classList.remove("hidden");
  resultSection.classList.add("hidden");

  lastConfig = { mode, henId, chId, count };

  renderQuestion();
}

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
    btn.innerHTML = `<span class="opt-label">${labels[idx]}</span><span class="opt-text">${optText}</span>`;
    btn.addEventListener("click", () => onSelectOption(idx, btn));
    quizOptionsEl.appendChild(btn);
  });
}

function onSelectOption(idx, btnEl) {
  if (locked) return;
  const qObj = quizQuestions[currentIndex];
  const correct = idx === qObj.answer;

  document.querySelectorAll(".option-btn").forEach((b, i) => {
    b.classList.remove("selected", "correct", "wrong");
    if (i === qObj.answer) b.classList.add("correct");
    if (i === idx && !correct) b.classList.add("wrong");
    if (i === idx && correct) b.classList.add("selected");
  });

  const baseMsg = correct ? "正解！" : "不正解...";
  if (qObj.exp) {
    quizFeedbackEl.innerHTML =
      baseMsg + '<br><span class="feedback-exp">' + qObj.exp + "</span>";
  } else {
    quizFeedbackEl.textContent = baseMsg;
  }
  quizFeedbackEl.className = "feedback " + (correct ? "correct" : "wrong");

  locked = true;
  nextBtn.disabled = false;

  answeredResults.push({
    q: qObj.q,
    your: idx,
    correctIndex: qObj.answer,
    correct,
    exp: qObj.exp || ""
  });
  if (correct) score++;
}

function showResult() {
  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");

  const total = quizQuestions.length;
  const rate = Math.round((score / total) * 100);
  resultSummaryEl.textContent = `正解数 ${score} / ${total}（正答率 ${rate}%）`;

  resultListOl.innerHTML = "";
  answeredResults.forEach((r, i) => {
    const li = document.createElement("li");
    const correctMark = r.correct ? "✔" : "✖";
    li.innerHTML =
      `<span class="${r.correct ? "result-item-correct" : "result-item-wrong"}">` +
      `${correctMark} Q${i + 1}</span>：${r.q}` +
      (r.exp ? `<br><span class="feedback-exp">解説：${r.exp}</span>` : "");
    resultListOl.appendChild(li);
  });
}

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
        lastConfig.chId,
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
