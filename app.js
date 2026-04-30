// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Check if questionsData is available
    if (typeof questionsData === 'undefined') {
        document.getElementById('questionText').textContent = 'Ошибка загрузки вопросов. Проверьте questions.js';
        return;
    }

    // State variables
    let questions = [];
    let currentQuestionIndex = 0;
    let correctAnswersCount = 0;
    let incorrectAnswersCount = 0;
    let hasAnsweredCurrent = false;

    // DOM Elements
    const questionTextEl = document.getElementById('questionText');
    const optionsContainerEl = document.getElementById('optionsContainer');
    const nextBtnEl = document.getElementById('nextBtn');
    const currentQuestionNumEl = document.getElementById('currentQuestionNum');
    const totalQuestionsNumEl = document.getElementById('totalQuestionsNum');
    const progressFillEl = document.getElementById('progressFill');
    const questionViewEl = document.getElementById('questionView');
    const resultsViewEl = document.getElementById('resultsView');
    
    // Results elements
    const scorePercentageEl = document.getElementById('scorePercentage');
    const scoreCircleEl = document.getElementById('scoreCircle');
    const correctCountEl = document.getElementById('correctCount');
    const incorrectCountEl = document.getElementById('incorrectCount');
    const restartBtnEl = document.getElementById('restartBtn');

    // Utility: Shuffle array
    function shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Utility: Escape HTML special characters
    function escapeHTML(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }

    // Initialize Quiz
    function initQuiz() {
        // Shuffle questions
        questions = shuffleArray(questionsData);
        
        // Reset state
        currentQuestionIndex = 0;
        correctAnswersCount = 0;
        incorrectAnswersCount = 0;
        
        // Update UI
        totalQuestionsNumEl.textContent = questions.length;
        questionViewEl.classList.remove('hidden');
        resultsViewEl.classList.add('hidden');
        
        loadQuestion();
    }

    // Load current question
    function loadQuestion() {
        hasAnsweredCurrent = false;
        nextBtnEl.disabled = true;
        
        const q = questions[currentQuestionIndex];
        currentQuestionNumEl.textContent = currentQuestionIndex + 1;
        
        // Update progress bar
        const progressPercent = (currentQuestionIndex / questions.length) * 100;
        progressFillEl.style.width = `${progressPercent}%`;

        // Render question text (escape HTML to prevent <Tag> from being parsed)
        questionTextEl.innerHTML = escapeHTML(q.question).replace(/\n/g, '<br>');
        
        // Render options
        optionsContainerEl.innerHTML = '';
        
        // If options don't contain correct answer explicitly in their text,
        // we use correct_answer string. But the PDF parser already has it.
        // We need to match option exactly with correct_answer.
        
        // Let's create an array of options and shuffle them
        const shuffledOptions = shuffleArray(q.options);
        
        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
        
        shuffledOptions.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            
            // Try to match the option string with correct_answer string
            // Sometimes there are slight variations in spacing, let's normalize for comparison
            const normalize = str => str.replace(/\s+/g, ' ').trim().toLowerCase();
            const isCorrect = normalize(optText) === normalize(q.correct_answer);
            
            btn.dataset.correct = isCorrect;
            
            btn.innerHTML = `
                <span class="option-letter">${letters[idx]})</span>
                <span class="option-text">${escapeHTML(optText)}</span>
            `;
            
            btn.addEventListener('click', () => handleOptionSelect(btn));
            optionsContainerEl.appendChild(btn);
        });
        
        // Check if there is a correct answer matched
        const hasCorrect = Array.from(optionsContainerEl.children).some(b => b.dataset.correct === 'true');
        if (!hasCorrect) {
            console.warn("No exact match found for correct answer. Question:", q);
            // Fallback: Check if correct_answer is contained in any option
            Array.from(optionsContainerEl.children).forEach(b => {
                const optSpan = b.querySelector('.option-text').textContent;
                const normalize = str => str.replace(/\s+/g, ' ').trim().toLowerCase();
                if (normalize(optSpan).includes(normalize(q.correct_answer)) || normalize(q.correct_answer).includes(normalize(optSpan))) {
                    b.dataset.correct = 'true';
                }
            });
        }
    }

    // Handle option click
    function handleOptionSelect(selectedBtn) {
        if (hasAnsweredCurrent) return; // Prevent multiple answers
        hasAnsweredCurrent = true;
        
        const isCorrect = selectedBtn.dataset.correct === 'true';
        
        if (isCorrect) {
            selectedBtn.classList.add('correct');
            correctAnswersCount++;
        } else {
            selectedBtn.classList.add('incorrect');
            incorrectAnswersCount++;
            
            // Highlight the correct one
            const buttons = optionsContainerEl.querySelectorAll('.option-btn');
            buttons.forEach(btn => {
                if (btn.dataset.correct === 'true') {
                    btn.classList.add('correct');
                }
            });
        }
        
        // Disable all buttons
        const buttons = optionsContainerEl.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.disabled = true);
        
        // Enable next button
        nextBtnEl.disabled = false;
        
        // Change text to 'Finish' if last question
        if (currentQuestionIndex === questions.length - 1) {
            nextBtnEl.textContent = 'Завершить тест ✓';
        } else {
            nextBtnEl.textContent = 'Следующий вопрос ➔';
        }
    }

    // Go to next question or finish
    nextBtnEl.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            loadQuestion();
        } else {
            showResults();
        }
    });

    // Show Results
    function showResults() {
        questionViewEl.classList.add('hidden');
        resultsViewEl.classList.remove('hidden');
        
        // Final progress bar full
        progressFillEl.style.width = '100%';
        currentQuestionNumEl.textContent = questions.length;
        
        const total = questions.length;
        const percentage = total === 0 ? 0 : Math.round((correctAnswersCount / total) * 100);
        
        correctCountEl.textContent = correctAnswersCount;
        incorrectCountEl.textContent = incorrectAnswersCount;
        
        // Animate circular progress
        setTimeout(() => {
            scoreCircleEl.style.strokeDasharray = `${percentage}, 100`;
            if (percentage >= 80) {
                scoreCircleEl.style.stroke = '#10b981'; // Green
            } else if (percentage >= 50) {
                scoreCircleEl.style.stroke = '#f59e0b'; // Yellow
            } else {
                scoreCircleEl.style.stroke = '#ef4444'; // Red
            }
            
            // Animate number
            let currentPercent = 0;
            const interval = setInterval(() => {
                if (currentPercent >= percentage) {
                    clearInterval(interval);
                    scorePercentageEl.textContent = `${percentage}%`;
                } else {
                    currentPercent++;
                    scorePercentageEl.textContent = `${currentPercent}%`;
                }
            }, 1500 / (percentage || 1));
        }, 100);
    }

    // Restart Quiz
    restartBtnEl.addEventListener('click', () => {
        scoreCircleEl.style.strokeDasharray = '0, 100';
        initQuiz();
    });

    // Start
    initQuiz();
});
