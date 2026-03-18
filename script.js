
let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 120; // 2분 설정
let currentUser = "";
let selectedCards = [];

async function loadData() {
    try {
        const response = await fetch('data.json');
        const jsonData = await response.json();
        // 데이터 구조에 맞춰 키 선택
        allWords = jsonData["Word Master 중등 실력 (2022)_원본"] || Object.values(jsonData)[0];
        createDayButtons();
    } catch (e) { console.error("데이터 로드 실패:", e); }
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

function startStudy(dayNumber) {
    const target = `Day ${dayNumber < 10 ? '0' + dayNumber : dayNumber}`;
    filteredWords = allWords.filter(item => item.day === target);
    if (filteredWords.length === 0) return alert("데이터가 없습니다.");

    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0; score = 0; timeLeft = 120;
    
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    startTimer();
    showNextQuestion();
}

function showNextQuestion() {
    const quizLimit = 10; // 10문제 후 카드 매칭
    if (currentIndex >= quizLimit || currentIndex >= filteredWords.length) {
        startMatchingStage();
        return;
    }

    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('matching-area').style.display = 'none';
    const data = filteredWords[currentIndex];
    document.getElementById('game-progress').innerText = `${currentIndex + 1} / ${quizLimit}`;

    if (currentIndex % 2 === 0) setupMultipleChoice(data);
    else setupSubjective(data);
}

function setupMultipleChoice(data) {
    document.getElementById('input-container').style.display = 'none';
    const container = document.getElementById('choice-container');
    container.style.display = 'grid';
    document.getElementById('question-word').innerText = data.word;
    document.getElementById('hint-text').innerText = "";
    container.innerHTML = '';

    const otherMeanings = allWords.filter(w => w.meaning !== data.meaning).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.meaning);
    const choices = [data.meaning, ...otherMeanings].sort(() => Math.random() - 0.5);

    choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = c;
        btn.onclick = () => { if (c === data.meaning) score++; currentIndex++; showNextQuestion(); };
        container.appendChild(btn);
    });
}

function setupSubjective(data) {
    document.getElementById('choice-container').style.display = 'none';
    const container = document.getElementById('input-container');
    container.style.display = 'block';
    document.getElementById('question-word').innerText = data.meaning;
    document.getElementById('hint-text').innerText = `힌트: ${data.word[0]}... (${data.word.length}자)`;
    const input = document.getElementById('answerInput');
    input.value = ""; input.focus();
}

function checkSubjective() {
    const input = document.getElementById('answerInput');
    if (input.value.trim().toLowerCase() === filteredWords[currentIndex].word.toLowerCase()) score++;
    currentIndex++; showNextQuestion();
}

function startMatchingStage() {
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('matching-area').style.display = 'block';
    document.getElementById('game-progress').innerText = "보너스 매칭!";
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    
    // 4쌍 추출 (총 8개 카드)
    const matchSet = filteredWords.slice(currentIndex, currentIndex + 4);
    let items = [];
    matchSet.forEach(d => { 
        items.push({text: d.word, id: d.word}); 
        items.push({text: d.meaning, id: d.word}); 
    });
    items.sort(() => Math.random() - 0.5);

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = item.text;
        card.dataset.pairId = item.id;
        card.onclick = () => handleCardClick(card);
        grid.appendChild(card);
    });
}

function handleCardClick(card) {
    if (card.classList.contains('matched') || selectedCards.includes(card)) return;
    card.classList.add('selected');
    selectedCards.push(card);

    if (selectedCards.length === 2) {
        const [c1, c2] = selectedCards;
        if (c1.dataset.pairId === c2.dataset.pairId) {
            c1.classList.add('matched'); c2.classList.add('matched'); score += 2;
            if (document.querySelectorAll('.card:not(.matched)').length === 0) setTimeout(endGame, 800);
        } else {
            c1.classList.add('wrong'); c2.classList.add('wrong');
            setTimeout(() => { c1.classList.remove('selected', 'wrong'); c2.classList.remove('selected', 'wrong'); }, 500);
        }
        selectedCards = [];
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('timer').innerText = `시간: ${m}:${s < 10 ? '0' + s : s}`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    alert(`🎉 학습 종료!\n${currentUser}님의 최종 점수: ${score}점`);
    location.reload();
}

function saveUser() {
    const input = document.getElementById('userNameInput');
    if (!input.value.trim()) return alert("이름을 입력하세요!");
    currentUser = input.value;
    document.getElementById('welcome-msg').innerText = `안녕하세요, ${currentUser}님!`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('input-container').style.display === 'block') checkSubjective();
});

loadData();
