let allWords = [];
let filteredWords = [];
let currentIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 120;
let currentUser = "";
let selectedCards = [];
let wrongWords = []; 

async function loadData() {
    try {
        const response = await fetch('data.json');
        const jsonData = await response.json();
        // 데이터 구조 유연하게 대응
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
    currentIndex = 0; 
    score = 0; 
    timeLeft = 120;
    wrongWords = []; // 게임 시작 전 초기화
    
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    startTimer();
    showNextQuestion();
}

function showNextQuestion() {
    const quizLimit = 10;
    // 10문제 다 풀면 매칭 스테이지로
    if (currentIndex >= quizLimit || currentIndex >= filteredWords.length) {
        startMatchingStage();
        return;
    }

    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('matching-area').style.display = 'none';
    
    const data = filteredWords[currentIndex];
    document.getElementById('game-progress').innerText = `${currentIndex + 1} / ${quizLimit}`;

    // 짝수 인덱스는 객관식, 홀수 인덱스는 주관식
    if (currentIndex % 2 === 0) {
        setupMultipleChoice(data);
    } else {
        setupSubjective(data);
    }
}

function setupMultipleChoice(data) {
    document.getElementById('input-container').style.display = 'none';
    const container = document.getElementById('choice-container');
    container.style.display = 'grid';
    document.getElementById('question-word').innerText = data.word;
    document.getElementById('hint-text').innerText = "";
    container.innerHTML = '';

    // 오답 보기 생성
    const otherMeanings = allWords
        .filter(w => w.meaning !== data.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);
    
    const choices = [data.meaning, ...otherMeanings].sort(() => Math.random() - 0.5);

    choices.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerText = c;
        btn.onclick = () => { 
            if (c === data.meaning) {
                score++; // 정답 시에만 점수 증가
            } else {
                addWrongWord(data); // 틀리면 오답노트 추가
            }
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
    document.getElementById('hint-text').innerText = `힌트: ${data.word[0]}... (${data.word.length}자)`;
    
    const input = document.getElementById('answerInput');
    input.value = ""; 
    input.focus();
}

// 주관식 정답 확인 함수 (Enter키나 버튼 클릭 시 호출)
function checkSubjective() {
    const input = document.getElementById('answerInput');
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = filteredWords[currentIndex].word.toLowerCase();

    if (userAnswer === correctAnswer) {
        score++;
    } else {
        addWrongWord(filteredWords[currentIndex]);
    }
    currentIndex++; 
    showNextQuestion();
}

function addWrongWord(data) {
    // 중복 체크 후 오답 배열에 저장
    const exists = wrongWords.find(w => w.word === data.word);
    if (!exists) {
        wrongWords.push({ word: data.word, meaning: data.meaning });
    }
}

function startMatchingStage() {
    document.getElementById('quiz-area').style.display = 'none';
    document.getElementById('matching-area').style.display = 'block';
    document.getElementById('game-progress').innerText = "보너스 매칭!";
    
    const grid = document.getElementById('card-grid');
    grid.innerHTML = '';
    
    // 현재 인덱스 이후의 4단어 추출
    const matchSet = filteredWords.slice(currentIndex, currentIndex + 4);
    if (matchSet.length < 2) { // 단어가 부족하면 바로 종료
        endGame();
        return;
    }

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
            c1.classList.add('matched'); 
            c2.classList.add('matched'); 
            score += 2; // 매칭 성공 시 보너스 2점
            
            // 모든 카드가 맞았는지 확인
            const remaining = document.querySelectorAll('.card:not(.matched)');
            if (remaining.length === 0) {
                setTimeout(endGame, 800);
            }
        } else {
            c1.classList.add('wrong'); 
            c2.classList.add('wrong');
            // 매칭 실패 시 오답노트 추가 (선택사항)
            const failData = filteredWords.find(w => w.word === c1.dataset.pairId);
            if (failData) addWrongWord(failData);

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
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        document.getElementById('timer').innerText = `시간: ${m}:${s < 10 ? '0' + s : s}`;
        if (timeLeft <= 0) endGame();
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    
    let report = `학습 종료!\n${currentUser}님의 점수: ${score}점\n\n`;
    
    if (wrongWords.length > 0) {
        report += `📝 [오답 리스트]\n`;
        wrongWords.forEach((w, i) => {
            report += `${i+1}. ${w.word} : ${w.meaning}\n`;
        });
    } else {
        report += `👏 완벽해요! 틀린 단어가 없습니다.`;
    }

    alert(report);
    location.reload(); // 게임 리셋
}

function saveUser() {
    const input = document.getElementById('userNameInput');
    if (!input.value.trim()) return alert("이름을 입력하세요!");
    currentUser = input.value;
    document.getElementById('welcome-msg').innerText = `안녕하세요, ${currentUser}님!`;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
}

// Enter 키 이벤트 리스너 (한 번만 등록되도록 수정)
document.addEventListener('keydown', e => {
    const inputContainer = document.getElementById('input-container');
    if (e.key === 'Enter' && inputContainer.style.display === 'block') {
        checkSubjective();
    }
});

loadData();
