let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 120; // 60에서 120(2분)으로 변경
let currentUser = "";
let selectedCards = [];

// [1] 데이터 로드
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("data.json 파일을 찾을 수 없습니다.");
        
        const jsonData = await response.json();
        allWords = jsonData["Word Master 중등 실력 (2022)_원본"] || Object.values(jsonData)[0];

        console.log("데이터 로드 성공:", allWords.length, "개");
        createDayButtons();
    } catch (error) {
        console.error("에러 발생:", error);
        alert("데이터 로드 실패: " + error.message);
    }
}

// [2] Day 버튼 생성
function createDayButtons() {
    const dayGrid = document.getElementById('day-grid');
    if (!dayGrid) return;
    
    dayGrid.innerHTML = '';
    for (let i = 1; i <= 40; i++) {
        const btn = document.createElement('button');
        btn.className = 'day-btn';
        btn.innerText = `Day ${i < 10 ? '0'+i : i}`;
        btn.onclick = () => startStudy(i);
        dayGrid.appendChild(btn);
    }
}

// [3] 게임 시작
function startStudy(dayNumber) {
    const formattedDay = `Day ${dayNumber < 10 ? '0' + dayNumber : dayNumber}`;
    filteredWords = allWords.filter(item => item.day === formattedDay);

    if (filteredWords.length === 0) {
        alert(`${formattedDay} 데이터를 찾을 수 없습니다.`);
        return;
    }

    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;
    timeLeft = 120; // 게임 시작 시 다시 120초로 초기화
    
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    startTimer();
    showNextQuestion();
}

// [4] 문제 출제 로직
function showNextQuestion() {
    const quizLimit = 10; 

    if (currentIndex >= quizLimit || currentIndex >= filteredWords.length) {
        startMatchingStage();
        return;
    }

    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('matching-area').style.display = 'none';

    const currentData = filteredWords[currentIndex];
    document.getElementById('game-progress').innerText = `${currentIndex + 1} / ${quizLimit}`;

    if (currentIndex % 2 === 0) {
        setupMultipleChoice(currentData);
    } else {
        setupSubjective(currentData);
    }
}

// [5] 듀오링고식 카드 맞추기 스테이지
function startMatchingStage() {
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('matching-area').style.display = 'block';
    document.getElementById('game-progress').innerText = "보너스: 짝 맞추기!";

    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    selectedCards = [];

    const matchSet = filteredWords.slice(currentIndex, currentIndex + 4);
    let cardItems = [];
    
    matchSet.forEach(item => {
        cardItems.push({ text: item.word, pairId: item.word });
        cardItems.push({ text: item.meaning, pairId: item.word });
    });

    cardItems.sort(() => Math.random() - 0.5);

    cardItems.forEach(data => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerText = data.text;
        card.dataset.pairId = data.pairId;
        card.onclick = () => handleCardClick(card);
        grid.appendChild(card);
    });
}

function handleCardClick(card) {
    if (card.classList.contains('matched') || selectedCards.includes(card)) return;

    card.classList.add('selected');
    selectedCards.push(card);

    if (selectedCards.length === 2) {
        const [card1, card2] = selectedCards;

        if (card1.dataset.pairId === card2.dataset.pairId) {
            card1.classList.add('matched');
            card2.classList.add('matched');
            score += 2;
            
            const remaining = document.querySelectorAll('.card:not(.matched)');
            if (remaining.length === 0) {
                setTimeout(endGame, 800);
            }
        } else {
            card1.classList.add('wrong');
            card2.classList.add('wrong');
            setTimeout(() => {
                card1.classList.remove('selected', 'wrong');
                card2.classList.remove('selected', 'wrong');
            }, 500);
        }
        selectedCards = [];
    }
}

// --- 기타 함수 ---

function setupMultipleChoice(data) {
    document.getElementById('input-container').style.display = 'none';
    const container = document.getElementById('choice-container');
    container.style.display = 'grid';
    document.getElementById('question-word').innerText = data.word;
    container.innerHTML = '';

    const otherMeanings = allWords
        .filter(w => w.meaning !== data.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);

    const choices = [data.meaning, ...otherMeanings].sort(() => Math.random() - 0.5);

    choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = choice;
        btn.onclick = () => {
            if (choice === data.meaning) score++;
            currentIndex++;
            showNextQuestion();
        };
        container.appendChild(btn);
    });
}

function setupSubjective(data) {
    document.getElementById('choice-container').style.display = 'none';
    const container = document.getElementById('input-container');
    container.style.display = 'block';
    document.getElementById('question-word').innerText = data.meaning;
    document.getElementById('hint-text').innerText = `힌트: ${data.word.charAt(0)}... (${data.word.length}자)`;
    const input = document.getElementById('answerInput');
    input.value = "";
    input.focus();
}

function checkSubjective() {
    const input = document.getElementById('answerInput');
    if (input.value.trim().toLowerCase() === filteredWords[currentIndex].word.trim().toLowerCase()) {
        score++;
    }
    currentIndex++;
    showNextQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        // 시간을 '0:00' 형식으로 표시
        document.getElementById('timer').innerText = `시간: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    // 템플릿 리터럴로 결과 메시지 표시
    alert(`🎉 게임 종료!\n\n${currentUser}님의 최종 점수는 ${score}점입니다.\n확인을 누르면 메뉴로 돌아갑니다.`);
    location.reload();
}

function saveUser() {
    const name = document.getElementById('userNameInput').value;
    if (!name.trim()) return alert("이름을 입력해 주세요!");
    currentUser = name;
    document.getElementById('welcome-msg').innerText = `안녕하세요, ${currentUser}님!`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('input-container').style.display === 'block') {
        checkSubjective();
    }
});

loadData();
