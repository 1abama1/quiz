const QUESTIONS = [
    {
        q: 'Какой тег делает самый большой заголовок?',
        choices: ['<title>', '<h6>', '<h1>', '<header>'],
        correct: 2
    },
    {
        q: 'Какой метод добавляет элемент в конец массива?',
        choices: ['push()', 'pop()', 'shift()', 'unshift()'],
        correct: 0
    },
    {
        q: 'Как свойством CSS задать жирность текста?',
        choices: ['font-weight', 'font-style', 'font-bold', 'text-weight'],
        correct: 0
    },
    {
        q: 'Где хранить пары ключ-значение в браузере без сервера?',
        choices: ['cookies только', 'localStorage', 'FTP', 'SSH'],
        correct: 1
    },
    {
        q: 'Как получить элемент по id в JS?',
        choices: ['document.get(el)', 'document.query(#id)', 'document.getElementById()', 'window.id()'],
        correct: 2
    },
];

const STORAGE_KEY = 'quiz-best';

let best = 0;
let idx = 0;
let score = 0;
let timer = 20;
let ticking = null;

const $qText = document.getElementById('qText');
const $questionNum = document.getElementById('questionNum');
const $choices = document.getElementById('choices');
const $next = document.getElementById('next');
const $bar = document.getElementById('bar');
const $score = document.getElementById('score');
const $best = document.getElementById('best');
const $timer = document.getElementById('timer');
const $screenQ = document.getElementById('screen-question');
const $screenR = document.getElementById('screen-result');
const $final = document.getElementById('final');
const $total = document.getElementById('total');
const $bestResult = document.getElementById('bestResult');
const $resultEmoji = document.getElementById('resultEmoji');
const $again = document.getElementById('again');

$total.textContent = QUESTIONS.length;

async function loadBest() {
    try {
        const result = await window.storage.get(STORAGE_KEY);
        if (result && result.value) {
            best = parseInt(result.value);
        }
    } catch (error) {
        console.log('Рекорд не найден, начинаем с 0');
        best = 0;
    }
    $best.textContent = best;
    $bestResult.textContent = best;
}

async function saveBest(newBest) {
    try {
        await window.storage.set(STORAGE_KEY, String(newBest));
        best = newBest;
        $best.textContent = best;
    } catch (error) {
        console.error('Ошибка сохранения рекорда:', error);
    }
}

function start() {
    idx = 0;
    score = 0;
    $score.textContent = score;
    renderQuestion();
}

function renderQuestion() {
    clearInterval(ticking);

    if (idx >= QUESTIONS.length) {
        return showResult();
    }

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
    const pct = (idx / QUESTIONS.length) * 100;
    $bar.style.width = pct + '%';
    $score.textContent = score;
}

function lockChoices() {
    Array.from(document.querySelectorAll('.choice')).forEach(b => {
        b.disabled = true;
    });
}

function revealCorrect(choiceIndex = null) {
    const correct = QUESTIONS[idx].correct;
    const nodes = Array.from(document.querySelectorAll('.choice'));

    nodes.forEach((b, i) => {
        if (i === correct) {
            b.classList.add('correct');
        }
        if (choiceIndex !== null && i === choiceIndex && i !== correct) {
            b.classList.add('wrong');
        }
    });
}

function select(i) {
    if ($next.disabled === false) return;

    const correct = QUESTIONS[idx].correct;
    if (i === correct) {
        score++;
    }

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

async function showResult() {
    $screenQ.classList.add('hidden');
    $screenR.classList.remove('hidden');
    $final.textContent = `${score}`;
    $bar.style.width = '100%';

    if (score > best) {
        await saveBest(score);
        $bestResult.textContent = score;
    }

    const percentage = (score / QUESTIONS.length) * 100;
    if (percentage === 100) {
        $resultEmoji.textContent = '🏆';
    } else if (percentage >= 80) {
        $resultEmoji.textContent = '🎉';
    } else if (percentage >= 60) {
        $resultEmoji.textContent = '😊';
    } else if (percentage >= 40) {
        $resultEmoji.textContent = '🤔';
    } else {
        $resultEmoji.textContent = '💪';
    }
}

loadBest().then(() => start());