let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timeLeft = 180; // ✅ 1) 3분(180초)으로 변경
let timerInterval;
let currentUser = "";
let selectedCards = [];
let wrongWords = [];
let matchingStageCount = 0;

// 퀴즈 30문제 + 카드 매칭 2세트×4쌍×2점 = 30 + 16 = 총 46점 만점
// (Day당 단어 30개이므로 매칭은 퀴즈 단어 재활용)
const QUIZ_COUNT = 30;
const MATCHING_SETS = 2;
const TOTAL_MAX_SCORE = QUIZ_COUNT + MATCHING_SETS * 4 * 2;

async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allWords = data["Word Master 중등 실력 (2022)_원본"] || Object.values(data)[0];
        createDayButtons();
    } catch (e) { console.error("데이터 로드 실패"); }
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

function startStudy(dayNum) {
    const dayTag = `Day ${dayNum < 10 ? '0' + dayNum : dayNum}`;
    filteredWords = allWords.filter(w => w.day === dayTag);

    // Day당 30개 단어: 퀴즈 30문제 + 매칭은 앞 단어 재활용
    if (filteredWords.length < 30) return alert("단어가 부족합니다.");

    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0; score = 0; timeLeft = 180; // ✅ 1) 3분
    wrongWords = []; matchingStageCount = 0;

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    updateHeader();
    startTimer();
    showNextQuestion();
}

function updateHeader() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    document.getElementById('timer').innerText = `시간: ${m}:${s < 10 ? '0'+s : s}`;
    document.getElementById('game-progress').innerText = `점수: ${score} / ${TOTAL_MAX_SCORE}`;
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
    document.getElementById('input-container').style.display = 'none';
    const container = document.getElementById('choice-container');
    container.style.display = 'grid';
    container.innerHTML = '';
    document.getElementById('question-word').innerText = data.word;
    document.getElementById('hint-text').innerText = `[객관식] 알맞은 뜻을 고르세요`;

    const wrongs = allWords.filter(w => w.meaning !== data.meaning).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
    const choices = [data.meaning, ...wrongs].sort(() => Math.random() - 0.5);

    choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = c;
        btn.onclick = () => {
            if (c === data.meaning) score++;
            else recordWrong(data);
            currentIndex++;
            updateHeader();
            showNextQuestion();
        };
        container.appendChild(btn);
    });
}

function setupSubjective(data) {
    document.getElementById('choice-container').style.display = 'none';
    document.getElementById('input-container').style.display = 'block';
    document.getElementById('question-word').innerText = data.meaning;

    const wordLen = data.word.length;
    const hasSpace = data.word.includes(" ");
    const hintSuffix = hasSpace ? ` (공백 포함)` : "";
    document.getElementById('hint-text').innerText = `힌트: ${data.word[0]}... [${wordLen}자${hintSuffix}]`;

    const input = document.getElementById('answerInput');
    input.value = ""; input.focus();
}

function checkSubjective() {
    if (document.getElementById('input-container').style.display === 'none') return;
    const input = document.getElementById('answerInput');
    const data = filteredWords[currentIndex];

    // ✅ 4) 대소문자 구분 없이 비교 (trim + toLowerCase)
    if (input.value.trim().toLowerCase() === data.word.trim().toLowerCase()) {
        score++;
    } else {
        recordWrong(data);
    }
    currentIndex++;
    updateHeader();
    showNextQuestion();
}

function recordWrong(data) {
    if (!wrongWords.find(w => w.word === data.word)) wrongWords.push(data);
}

function startMatchingStage() {
    matchingStageCount++;

    // ✅ 3) 5세트까지 매칭 진행
    if (matchingStageCount > MATCHING_SETS) {
        endGame();
        return;
    }

    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('matching-area').style.display = 'block';
    document.getElementById('matching-title').innerText = `보너스 매칭 (${matchingStageCount}/${MATCHING_SETS}세트)`;

    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';

    // 퀴즈에 쓴 단어(앞 30개) 중에서 랜덤 4개 재활용
    const quizWords = filteredWords.slice(0, QUIZ_COUNT);
    const shuffled = [...quizWords].sort(() => Math.random() - 0.5);
    const matchWords = shuffled.slice(0, 4);

    if (matchWords.length < 2) { endGame(); return; }

    let items = [];
    matchWords.forEach(d => {
        items.push({text: d.word, id: d.word}, {text: d.meaning, id: d.word});
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
            c1.classList.add('matched'); c2.classList.add('matched');
            score += 2;
            updateHeader();

            setTimeout(() => {
                const remaining = document.querySelectorAll('.card:not(.matched)');
                if (remaining.length === 0) {
                    if (matchingStageCount < MATCHING_SETS) startMatchingStage();
                    else endGame();
                }
            }, 500);
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
        updateHeader();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    const perf = Math.round((score / TOTAL_MAX_SCORE) * 100);
    let msg = `학습 종료! 최종 점수: ${score} / ${TOTAL_MAX_SCORE}점 (${perf}%)\n\n`;

    // ✅ 2) 만점 판정을 score 기준으로 정확하게 수정
    if (score >= TOTAL_MAX_SCORE) {
        msg += `👏 완벽합니다! 만점입니다!`;
    } else if (wrongWords.length > 0) {
        msg += `📝 [오답 리스트]\n` + wrongWords.map(w => `- ${w.word}: ${w.meaning}`).join('\n');
    } else {
        msg += `👏 오답은 없지만 아직 도전할 문제가 남아있어요!`;
    }
    alert(msg);
    location.reload();
}

function saveUser() {
    const name = document.getElementById('userNameInput').value;
    if (!name.trim()) return alert("이름을 입력하세요.");
    currentUser = name;
    document.getElementById('welcome-msg').innerText = `반가워요, ${name}님!`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
}

document.getElementById('submit-btn').onclick = checkSubjective;
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        if (document.getElementById('login-screen').style.display !== 'none') saveUser();
        else if (document.getElementById('input-container').style.display === 'block') checkSubjective();
    }
});

loadData();
