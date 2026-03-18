let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 60;
let currentUser = "";

// [1] 데이터 로드
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("data.json 파일을 찾을 수 없습니다.");
        
        const jsonData = await response.json();
        // JSON의 특정 키 이름을 찾아 배열 저장
        allWords = jsonData["Word Master 중등 실력 (2022)_원본"];
        
        if (!allWords) {
            // 키 이름이 다를 경우를 대비해 첫 번째 키의 값을 가져옴
            allWords = Object.values(jsonData)[0];
        }

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
    
    // 데이터 필터링
    filteredWords = allWords.filter(item => item.day === formattedDay);

    if (filteredWords.length === 0) {
        alert(`${formattedDay} 데이터를 찾을 수 없습니다.`);
        return;
    }

    filteredWords.sort(() => Math.random() - 0.5);
    currentIndex = 0;
    score = 0;
    timeLeft = 60;
    
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    startTimer();
    showNextQuestion();
}

// [4] 문제 출제
function showNextQuestion() {
    if (currentIndex >= filteredWords.length) {
        endGame();
        return;
    }

    const currentData = filteredWords[currentIndex];
    const questionWord = document.getElementById('question-word');
    const choiceContainer = document.getElementById('choice-container');
    const inputContainer = document.getElementById('input-container');
    
    document.getElementById('game-progress').innerText = `${currentIndex + 1} / ${filteredWords.length}`;

    if (currentIndex % 2 === 0) { // 객관식
        inputContainer.style.display = 'none';
        choiceContainer.style.display = 'grid';
        questionWord.innerText = currentData.word;
        setupMultipleChoice(currentData);
    } else { // 주관식
        choiceContainer.style.display = 'none';
        inputContainer.style.display = 'block';
        questionWord.innerText = currentData.meaning;
        setupSubjective(currentData);
    }
}

function setupMultipleChoice(data) {
    const choiceContainer = document.getElementById('choice-container');
    choiceContainer.innerHTML = ''; 

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
            nextStep();
        };
        choiceContainer.appendChild(btn);
    });
}

function setupSubjective(data) {
    const hintText = document.getElementById('hint-text');
    const answerInput = document.getElementById('answerInput');
    hintText.innerText = `힌트: ${data.word.charAt(0)}... (${data.word.length}글자)`;
    answerInput.value = "";
    answerInput.focus();
}

function checkSubjective() {
    const answerInput = document.getElementById('answerInput');
    const userAnswer = answerInput.value.trim().toLowerCase();
    const correctAnswer = filteredWords[currentIndex].word.trim().toLowerCase();

    if (userAnswer === correctAnswer) score++;
    nextStep();
}

function nextStep() {
    currentIndex++;
    showNextQuestion();
}

function startTimer() {
    clearInterval(timerInterval);
    const timerDisplay = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = `시간: ${timeLeft}`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    alert(`게임 종료! 맞춘 개수: ${score} / ${filteredWords.length}`);
    location.reload();
}

function saveUser() {
    const nameInput = document.getElementById('userNameInput');
    if (!nameInput.value.trim()) {
        alert("이름을 입력하세요!");
        return;
    }
    currentUser = nameInput.value;
    document.getElementById('welcome-msg').innerText = `안녕하세요, ${currentUser}님!`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
}

// 엔터키 처리
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('input-container').style.display === 'block') {
        checkSubjective();
    }
});

loadData();