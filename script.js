let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timeLeft = 180;       // ✅ 3분
let timerInterval;
let currentUser = "";
let selectedCards = [];
let wrongWords = [];
let matchingStageCount = 0;

// ✅ 퀴즈 30문제 + 매칭 2세트×4쌍×2점 = 총 46점 만점
// Day당 단어 30개 → 매칭은 퀴즈 단어 재활용
const QUIZ_COUNT = 30;
const MATCHING_SETS = 2;
const TOTAL_MAX_SCORE = QUIZ_COUNT + MATCHING_SETS * 4 * 2; // 46

async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allWords = data["Word Master 중등 실력 (2022)_원본"] || Object.values(data)[0];
        createDayButtons();
    } catch (e) { console.error("데이터 로드 실패", e); }
}

function createDayButtons() {
    const grid = document.getElementById('day-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= 40; i++) {
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.innerText = `Day ${i < 10 ? '0'+i : i}`;
        btn.onclick = () => startStudy(i);
        grid.appendChild(btn);
    }
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const el = document.getElementById(id);
    el.style.display = 'flex';
    el.classList.add('active');
}

function startStudy(dayNum) {
    const dayTag = `Day ${dayNum < 10 ? '0' + dayNum : dayNum}`;
    filteredWords = allWords.filter(w => w.day === dayTag);

    if (filteredWords.length < 10) return alert("단어가 부족합니다.");

    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0; score = 0; timeLeft = 180;
    wrongWords = []; matchingStageCount = 0;

    showScreen('game-screen');
    updateHUD();
    startTimer();
    showNextQuestion();
}

function updateHUD() {
    // 타이머
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer-text').innerText = `${m}:${s < 10 ? '0'+s : s}`;

    // 타이머 경고
    const timerEl = document.querySelector('.hud-timer');
    if (timeLeft <= 30) timerEl.classList.add('warning');
    else timerEl.classList.remove('warning');

    // 점수
    document.getElementById('score-text').innerText = score;

    // 프로그레스바
    const pct = Math.min((currentIndex / QUIZ_COUNT) * 100, 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    const shown = Math.min(currentIndex, QUIZ_COUNT);
    document.getElementById('progress-label').innerText = `${shown} / ${QUIZ_COUNT}`;
}

function showNextQuestion() {
    if (currentIndex >= QUIZ_COUNT) {
        startMatchingStage();
        return;
    }
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('matching-area').style.display = 'none';

    const data = filteredWords[currentIndex];
    if (currentIndex % 2 === 0) setupMultiple(data);
    else setupSubjective(data);
}

function setupMultiple(data) {
    document.getElementById('stage-badge').innerText = '객관식';
    document.getElementById('input-container').style.display = 'none';
    const container = document.getElementById('choice-container');
    container.style.display = 'grid';
    container.innerHTML = '';
    document.getElementById('question-word').innerText = data.word;
    document.getElementById('hint-text').innerText = '알맞은 뜻을 고르세요';

    const wrongs = allWords
        .filter(w => w.meaning !== data.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);
    const choices = [data.meaning, ...wrongs].sort(() => Math.random() - 0.5);

    choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = c;
        btn.onclick = () => {
            if (c === data.meaning) score++;
            else recordWrong(data);
            currentIndex++;
            updateHUD();
            showNextQuestion();
        };
        container.appendChild(btn);
    });
}

function setupSubjective(data) {
    document.getElementById('stage-badge').innerText = '주관식';
    document.getElementById('choice-container').style.display = 'none';
    document.getElementById('input-container').style.display = 'flex';
    document.getElementById('question-word').innerText = data.meaning;

    const wordLen = data.word.length;
    const hasSpace = data.word.includes(" ");
    const hint = hasSpace ? ` (공백 포함, ${wordLen}자)` : ` (${wordLen}자)`;
    document.getElementById('hint-text').innerText = `힌트: ${data.word[0]}...${hint}`;

    const input = document.getElementById('answerInput');
    input.value = '';
    input.focus();
}

function checkSubjective() {
    if (document.getElementById('input-container').style.display === 'none') return;
    const input = document.getElementById('answerInput');
    const data = filteredWords[currentIndex];

    // ✅ 대소문자 구분 없이 비교
    if (input.value.trim().toLowerCase() === data.word.trim().toLowerCase()) {
        score++;
    } else {
        recordWrong(data);
    }
    currentIndex++;
    updateHUD();
    showNextQuestion();
}

function recordWrong(data) {
    if (!wrongWords.find(w => w.word === data.word)) wrongWords.push(data);
}

function startMatchingStage() {
    matchingStageCount++;

    if (matchingStageCount > MATCHING_SETS) {
        endGame();
        return;
    }

    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('matching-area').style.display = 'block';
    document.getElementById('matching-title').innerText = `세트 ${matchingStageCount} / ${MATCHING_SETS}`;

    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    // ✅ Day당 단어 30개 → 퀴즈 단어에서 랜덤 4개 재활용
    const shuffled = [...filteredWords.slice(0, QUIZ_COUNT)].sort(() => Math.random() - 0.5);
    const matchWords = shuffled.slice(0, 4);

    if (matchWords.length < 2) { endGame(); return; }

    let items = [];
    matchWords.forEach(d => {
        items.push({ text: d.word, id: d.word }, { text: d.meaning, id: d.word });
    });
    items.sort(() => Math.random() - 0.5);

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = item.text;
        card.dataset.id = item.id;
        card.onclick = () => handleMatch(card);
        grid.appendChild(card);
    });
}

function handleMatch(card) {
    if (card.classList.contains('matched') || selectedCards.includes(card)) return;
    card.classList.add('selected');
    selectedCards.push(card);

    if (selectedCards.length === 2) {
        const [c1, c2] = selectedCards;
        if (c1.dataset.id === c2.dataset.id) {
            c1.classList.add('matched');
            c2.classList.add('matched');
            score += 2;
            updateHUD();
            setTimeout(() => {
                const remaining = document.querySelectorAll('.card:not(.matched)');
                if (remaining.length === 0) {
                    if (matchingStageCount < MATCHING_SETS) startMatchingStage();
                    else endGame();
                }
            }, 400);
        } else {
            c1.classList.add('wrong'); c2.classList.add('wrong');
            const data = filteredWords.find(w => w.word === c1.dataset.id);
            if (data) recordWrong(data);
            setTimeout(() => {
                c1.classList.remove('selected', 'wrong');
                c2.classList.remove('selected', 'wrong');
            }, 500);
        }
        selectedCards = [];
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateHUD();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    const perf = Math.round((score / TOTAL_MAX_SCORE) * 100);

    document.getElementById('result-score').innerText = score;
    document.getElementById('result-max').innerText = `/ ${TOTAL_MAX_SCORE}`;
    document.getElementById('result-percent').innerText = `${perf}%`;

    // ✅ 만점 판정: score 기준으로 정확하게
    if (score >= TOTAL_MAX_SCORE) {
        document.getElementById('result-emoji').innerText = '🏆';
        document.getElementById('result-title').innerText = '완벽해요! 만점!';
    } else if (perf >= 80) {
        document.getElementById('result-emoji').innerText = '🎉';
        document.getElementById('result-title').innerText = '훌륭해요!';
    } else if (perf >= 50) {
        document.getElementById('result-emoji').innerText = '💪';
        document.getElementById('result-title').innerText = '잘했어요!';
    } else {
        document.getElementById('result-emoji').innerText = '📚';
        document.getElementById('result-title').innerText = '다시 도전해봐요!';
    }

    // 오답 리스트
    const wrap = document.getElementById('wrong-list-wrap');
    wrap.innerHTML = '';
    if (wrongWords.length > 0) {
        wrongWords.forEach(w => {
            const div = document.createElement('div');
            div.className = 'wrong-item';
            div.innerHTML = `<span class="wrong-word">${w.word}</span><span class="wrong-meaning">${w.meaning}</span>`;
            wrap.appendChild(div);
        });
    }

    document.getElementById('result-overlay').style.display = 'flex';
}

function saveUser() {
    const name = document.getElementById('userNameInput').value.trim();
    if (!name) return alert("이름을 입력하세요.");
    currentUser = name;
    document.getElementById('welcome-msg').innerText = `${name}님, 반가워요!`;
    showScreen('menu-screen');
}

document.getElementById('submit-btn').onclick = checkSubjective;
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const loginVisible = document.getElementById('login-screen').classList.contains('active');
        if (loginVisible) { saveUser(); return; }
        if (document.getElementById('input-container').style.display !== 'none') checkSubjective();
    }
});

loadData();
