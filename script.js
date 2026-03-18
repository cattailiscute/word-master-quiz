let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timeLeft = 120;
let timerInterval;
let currentUser = "";
let selectedCards = [];
let wrongWords = [];
let matchingStageCount = 0;

// 데이터 로드
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        allWords = data["Word Master 중등 실력 (2022)_원본"] || Object.values(data)[0];
        createDayButtons();
    } catch (e) { alert("데이터 로드 중 오류가 발생했습니다."); }
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
    if (filteredWords.length < 18) return alert("단어 개수가 부족합니다 (최소 18개 필요).");

    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0; score = 0; timeLeft = 120;
    wrongWords = []; matchingStageCount = 0;

    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    startTimer();
    showNextQuestion();
}

function showNextQuestion() {
    if (currentIndex >= 10) {
        startMatchingStage();
        return;
    }
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('matching-area').style.display = 'none';
    const data = filteredWords[currentIndex];
    document.getElementById('game-progress').innerText = `${currentIndex + 1} / 10`;

    if (currentIndex % 2 === 0) setupMultiple(data);
    else setupSubjective(data);
}

function setupMultiple(data) {
    document.getElementById('input-container').style.display = 'none';
    const container = document.getElementById('choice-container');
    container.style.display = 'grid';
    container.innerHTML = '';
    document.getElementById('question-word').innerText = data.word;
    document.getElementById('hint-text').innerText = "";

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
            showNextQuestion();
        };
        container.appendChild(btn);
    });
}

function setupSubjective(data) {
    document.getElementById('choice-container').style.display = 'none';
    document.getElementById('input-container').style.display = 'block';
    document.getElementById('question-word').innerText = data.meaning;
    document.getElementById('hint-text').innerText = `힌트: ${data.word[0]}... (${data.word.length}자)`;
    const input = document.getElementById('answerInput');
    input.value = ""; input.focus();
}

function checkSubjective() {
    const input = document.getElementById('answerInput');
    const data = filteredWords[currentIndex];
    if (input.value.trim().toLowerCase() === data.word.toLowerCase()) score++;
    else recordWrong(data);
    currentIndex++;
    showNextQuestion();
}

function recordWrong(data) {
    if (!wrongWords.find(w => w.word === data.word)) wrongWords.push(data);
}

function startMatchingStage() {
    matchingStageCount++;
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('matching-area').style.display = 'block';
    document.getElementById('matching-title').innerText = `보너스 매칭 (${matchingStageCount}/2세트)`;
    
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    
    // 퀴즈 이후 단어 4개씩 슬라이스
    const start = 10 + (matchingStageCount - 1) * 4;
    const items = [];
    filteredWords.slice(start, start + 4).forEach(d => {
        items.push({t: d.word, id: d.word}, {t: d.meaning, id: d.word});
    });
    items.sort(() => Math.random() - 0.5);

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = item.t;
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
            c1.classList.add('matched'); c2.classList.add('matched'); score += 2;
            if (document.querySelectorAll('.card:not(.matched)').length === 0) {
                setTimeout(() => matchingStageCount < 2 ? startMatchingStage() : endGame(), 800);
            }
        } else {
            c1.classList.add('wrong'); c2.classList.add('wrong');
            const data = filteredWords.find(w => w.word === c1.dataset.id);
            if (data) recordWrong(data);
            setTimeout(() => { c1.classList.remove('selected', 'wrong'); c2.classList.remove('selected', 'wrong'); }, 500);
        }
        selectedCards = [];
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
        document.getElementById('timer').innerText = `시간: ${m}:${s < 10 ? '0'+s : s}`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    let msg = `학습 종료! 점수: ${score}점\n\n`;
    if (wrongWords.length > 0) msg += `📝 [오답 리스트]\n` + wrongWords.map(w => `- ${w.word}: ${w.meaning}`).join('\n');
    else msg += `👏 완벽합니다!`;
    alert(msg);
    location.reload();
}

function saveUser() {
    const name = document.getElementById('userNameInput').value;
    if (!name.trim()) return alert("이름을 입력하세요.");
    currentUser = name;
    document.getElementById('welcome-msg').innerText = `안녕하세요, ${name}님!`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
}

// 이벤트 리스너 통합
document.getElementById('submit-btn').onclick = checkSubjective;
document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('input-container').style.display === 'block') checkSubjective();
});

loadData();
