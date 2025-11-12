const STORAGE_KEY = 'quiz-best';
const API_URL = "https://691475d53746c71fe0484dd7.mockapi.io/api/v1/questions";

let QUESTIONS = [];
let best = 0, idx = 0, score = 0, timer = 20, ticking = null;
let currentCategory = "";

const $catScreen = document.getElementById('screen-category');
const $screenQ = document.getElementById('screen-question');
const $screenR = document.getElementById('screen-result');
const $qText = document.getElementById('qText');
const $questionNum = document.getElementById('questionNum');
const $choices = document.getElementById('choices');
const $next = document.getElementById('next');
const $bar = document.getElementById('bar');
const $score = document.getElementById('score');
const $best = document.getElementById('best');
const $timer = document.getElementById('timer');
const $final = document.getElementById('final');
const $total = document.getElementById('total');
const $bestResult = document.getElementById('bestResult');
const $resultEmoji = document.getElementById('resultEmoji');
const $again = document.getElementById('again');
const $backToMenu = document.getElementById('backToMenu');

// ✅ Загрузка вопросов с mockAPI (под right_answer_id)
async function loadQuestions(category) {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`Ошибка загрузки вопросов: ${res.status}`);
    const data = await res.json();

    const filtered = data.filter(q => q && q.category === category);
    if (!filtered.length) throw new Error("Нет вопросов для этой категории!");

    QUESTIONS = filtered.map((r, idx) => {
        // Преобразуем ответы в массив
        let answersArr = Array.isArray(r.answers)
            ? r.answers.map(a => String(a).trim())
            : String(r.answers ?? '').split(',').map(a => a.trim()).filter(Boolean);

        // Определяем правильный индекс
        let correctIndex = 0;
        if (typeof r.right_answer_id === 'number') {
            correctIndex = r.right_answer_id;
        } else if (typeof r.right_answer_id === 'string' && /^\d+$/.test(r.right_answer_id)) {
            correctIndex = parseInt(r.right_answer_id, 10);
        } else {
            correctIndex = 0; // fallback
        }

        if (correctIndex < 0 || correctIndex >= answersArr.length) {
            correctIndex = 0;
        }

        return {
            q: r.question ?? '(без вопроса)',
            choices: answersArr,
            correct: correctIndex
        };
    });

    $total.textContent = QUESTIONS.length;
}

// ✅ Работа с рекордом
function loadBest() {
    best = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
    $best.textContent = best;
    $bestResult.textContent = best;
}

function saveBest(newBest) {
    localStorage.setItem(STORAGE_KEY, newBest);
    best = newBest;
    $best.textContent = best;
    $bestResult.textContent = best;
}

// ✅ Основная логика игры
function start() {
    idx = 0;
    score = 0;
    $score.textContent = score;
    renderQuestion();
}

function renderQuestion() {
    clearInterval(ticking);
    if (idx >= QUESTIONS.length) return showResult();

    const item = QUESTIONS[idx];
    $questionNum.textContent = `Вопрос ${idx + 1} из ${QUESTIONS.length}`;
    $qText.textContent = item.q;
    $choices.innerHTML = '';
    $next.disabled = true;

    timer = 20;
    $timer.textContent = timer;
    updateProgress();

    item.choices.forEach((text, i) => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.textContent = text;
        btn.addEventListener('click', () => select(i));
        $choices.append(btn);
    });

    ticking = setInterval(() => {
        timer--;
        $timer.textContent = timer;
        if (timer <= 0) {
            clearInterval(ticking);
            lockChoices();
            revealCorrect();
            $next.disabled = false;
        }
    }, 1000);
}

function updateProgress() {
    if (!QUESTIONS.length) {
        $bar.style.width = '0%';
    } else {
        const pct = (idx / QUESTIONS.length) * 100;
        $bar.style.width = pct + '%';
    }
    $score.textContent = score;
}

function lockChoices() {
    document.querySelectorAll('.choice').forEach(b => b.disabled = true);
}

function revealCorrect(choiceIndex = null) {
    const correct = QUESTIONS[idx].correct;
    document.querySelectorAll('.choice').forEach((b, i) => {
        if (i === correct) b.classList.add('correct');
        if (choiceIndex !== null && i === choiceIndex && i !== correct) b.classList.add('wrong');
    });
}

function select(i) {
    if (!$next.disabled) return;
    if (i === QUESTIONS[idx].correct) score++;
    lockChoices();
    revealCorrect(i);
    $next.disabled = false;
    clearInterval(ticking);
    updateProgress();
}

$next.addEventListener('click', () => {
    idx++;
    renderQuestion();
});

$again.addEventListener('click', () => {
    $screenR.classList.add('hidden');
    $screenQ.classList.remove('hidden');
    start();
});

$backToMenu.addEventListener('click', () => {
    if (document.body.dataset.category) {
        window.location.href = 'index.html';
        return;
    }
    $screenR.classList.add('hidden');
    $catScreen.classList.remove('hidden');
});

// ✅ Показ результата
function showResult() {
    $screenQ.classList.add('hidden');
    $screenR.classList.remove('hidden');
    $final.textContent = score;
    $bar.style.width = '100%';
    if (score > best) saveBest(score);

    const percent = (score / QUESTIONS.length) * 100;
    if (percent === 100) $resultEmoji.textContent = '🏆';
    else if (percent >= 80) $resultEmoji.textContent = '🎉';
    else if (percent >= 60) $resultEmoji.textContent = '😊';
    else if (percent >= 40) $resultEmoji.textContent = '🤔';
    else $resultEmoji.textContent = '💪';
}

// ✅ Обработка выбора категории и прямых ссылок
async function startCategory(category) {
    if (!category) return;

    clearInterval(ticking);
    currentCategory = category;

    if ($catScreen) {
        if (document.body.dataset.category) {
            $catScreen.classList.remove('hidden');
        } else {
            $catScreen.classList.add('hidden');
        }
    }
    $screenR.classList.add('hidden');
    $screenQ.classList.remove('hidden');

    idx = 0;
    score = 0;
    $score.textContent = score;
    $questionNum.textContent = '';
    $qText.textContent = 'Загружаем вопросы...';
    $choices.innerHTML = '';
    $next.disabled = true;
    $bar.style.width = '0%';
    timer = 20;
    $timer.textContent = timer;

    try {
        await loadQuestions(currentCategory);
        if ($catScreen) {
            $catScreen.classList.add('hidden');
        }
        start();
    } catch (err) {
        alert("Ошибка загрузки данных: " + err.message);
        console.error(err);
        if (document.body.dataset.category) {
            window.location.href = 'index.html';
        } else {
            if ($catScreen) $catScreen.classList.remove('hidden');
            $screenQ.classList.add('hidden');
        }
    }
}

function init() {
    loadBest();

    const preset = document.body.dataset.category;
    if (preset) {
        startCategory(preset);
        return;
    }

    document.querySelectorAll('.category').forEach(btn => {
        btn.addEventListener('click', () => startCategory(btn.dataset.cat));
    });
}

init();
