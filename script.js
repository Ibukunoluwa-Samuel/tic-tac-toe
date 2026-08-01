const boardElement = document.querySelector('#board');
const statusText = document.querySelector('#statusText');
const roundNumber = document.querySelector('#roundNumber');
const scoreXElement = document.querySelector('#scoreX');
const scoreOElement = document.querySelector('#scoreO');
const opponentLabel = document.querySelector('#opponentLabel');
const turnHint = document.querySelector('#turnHint');
const winnerLine = document.querySelector('#winnerLine');
const modeButtons = document.querySelectorAll('.mode-button');
const viewButtons = document.querySelectorAll('.view-tab');
const viewPanels = document.querySelectorAll('.view-panel');
const guessInput = document.querySelector('#guessInput');
const guessForm = document.querySelector('#guessForm');
const guessFeedback = document.querySelector('#guessFeedback');
const guessAttempts = document.querySelector('#guessAttempts');
const guessWins = document.querySelector('#guessWins');
const guessBest = document.querySelector('#guessBest');

const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const wallpapers = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2200&q=85',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=2200&q=85'
];

let mode = 'cpu';
let board = Array(9).fill('');
let currentPlayer = 'X';
let gameOver = false;
let round = 1;
let scores = { X: 0, O: 0 };
let cpuTimer;
let secretNumber = null;
let attempts = 0;
let wins = 0;
let bestScore = null;

function renderBoard() {
  boardElement.innerHTML = '';
  board.forEach((value, index) => {
    const cell = document.createElement('button');
    cell.className = `cell ${value.toLowerCase()}`;
    cell.type = 'button';
    cell.dataset.index = index;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`);
    cell.textContent = value;
    cell.disabled = Boolean(value) || gameOver || (mode === 'cpu' && currentPlayer === 'O');
    cell.addEventListener('click', () => playMove(index));
    boardElement.appendChild(cell);
  });
}

function getWinner(state) {
  for (const line of winningLines) {
    const [a, b, c] = line;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return { player: state[a], line };
  }
  return state.every(Boolean) ? { player: 'draw', line: [] } : null;
}

function playMove(index) {
  if (board[index] || gameOver || (mode === 'cpu' && currentPlayer === 'O')) return;
  board[index] = currentPlayer;
  const result = getWinner(board);
  if (result) finishRound(result);
  else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
    renderBoard();
    if (mode === 'cpu' && currentPlayer === 'O') cpuTimer = setTimeout(makeCpuMove, 460);
  }
}

function makeCpuMove() {
  if (gameOver || mode !== 'cpu') return;
  const move = chooseCpuMove();
  if (move !== -1) playCpuMove(move);
}

function playCpuMove(index) {
  board[index] = 'O';
  const result = getWinner(board);
  if (result) finishRound(result);
  else {
    currentPlayer = 'X';
    updateStatus();
    renderBoard();
  }
}

function chooseCpuMove() {
  const openCells = board.map((cell, index) => cell ? null : index).filter(index => index !== null);
  if (!openCells.length) return -1;
  const immediate = findWinningMove('O') ?? findWinningMove('X');
  if (immediate !== null) return immediate;
  if (!board[4]) return 4;
  const corners = [0, 2, 6, 8].filter(index => !board[index]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return openCells[Math.floor(Math.random() * openCells.length)];
}

function findWinningMove(player) {
  for (const index of board.map((_, cellIndex) => cellIndex)) {
    if (!board[index]) {
      board[index] = player;
      const wins = Boolean(getWinner(board)?.player === player);
      board[index] = '';
      if (wins) return index;
    }
  }
  return null;
}

function finishRound(result) {
  gameOver = true;
  clearTimeout(cpuTimer);
  renderBoard();
  if (result.player === 'draw') {
    statusText.textContent = 'A clean draw';
    turnHint.textContent = 'No space left on the grid';
  } else {
    scores[result.player] += 1;
    statusText.textContent = mode === 'cpu' ? (result.player === 'X' ? 'You take it' : 'CPU takes it') : `${result.player} takes it`;
    turnHint.textContent = 'Round complete';
    result.line.forEach(index => boardElement.children[index].classList.add('winner'));
    drawWinnerLine(result.line);
  }
  updateScores();
}

function drawWinnerLine(line) {
  const [start, end] = [boardElement.children[line[0]], boardElement.children[line[2]]];
  const boardRect = boardElement.getBoundingClientRect();
  const startRect = start.getBoundingClientRect();
  const endRect = end.getBoundingClientRect();
  const x1 = startRect.left + startRect.width / 2 - boardRect.left;
  const y1 = startRect.top + startRect.height / 2 - boardRect.top;
  const x2 = endRect.left + endRect.width / 2 - boardRect.left;
  const y2 = endRect.top + endRect.height / 2 - boardRect.top;
  const length = Math.hypot(x2 - x1, y2 - y1);
  winnerLine.style.width = `${length}px`;
  winnerLine.style.left = `${x1}px`;
  winnerLine.style.top = `${y1 - 1.5}px`;
  winnerLine.style.transform = `rotate(${Math.atan2(y2 - y1, x2 - x1)}rad)`;
  winnerLine.classList.add('visible');
}

function updateStatus() {
  if (mode === 'cpu') statusText.textContent = currentPlayer === 'X' ? 'Your move' : 'CPU is thinking';
  else statusText.textContent = `${currentPlayer}'s move`;
  turnHint.textContent = currentPlayer === 'X' ? 'X starts every round' : 'O is on the board';
}

function updateScores() {
  scoreXElement.textContent = scores.X;
  scoreOElement.textContent = scores.O;
}

function startRound() {
  clearTimeout(cpuTimer);
  board = Array(9).fill('');
  currentPlayer = 'X';
  gameOver = false;
  winnerLine.classList.remove('visible');
  winnerLine.removeAttribute('style');
  roundNumber.textContent = String(round).padStart(2, '0');
  updateStatus();
  renderBoard();
}

function setMode(nextMode) {
  mode = nextMode;
  opponentLabel.textContent = mode === 'cpu' ? 'CPU' : 'PLAYER O';
  modeButtons.forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  round = 1;
  scores = { X: 0, O: 0 };
  updateScores();
  startRound();
}

function setActiveView(view) {
  viewButtons.forEach(button => button.classList.toggle('active', button.dataset.view === view));
  viewPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.viewPanel === view));
}

function setGuessFeedback(message, type = '') {
  guessFeedback.textContent = message;
  guessFeedback.className = `guess-feedback${type ? ` ${type}` : ''}`;
}

function updateGuessStats() {
  guessAttempts.textContent = attempts;
  guessWins.textContent = wins;
  guessBest.textContent = bestScore === null ? '—' : bestScore;
}

function startGuessGame() {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  attempts = 0;
  guessInput.value = '';
  guessInput.disabled = false;
  guessInput.focus();
  updateGuessStats();
  setGuessFeedback('A new secret number is waiting. Enter your first guess.');
}

function resetGuessStats() {
  wins = 0;
  bestScore = null;
  updateGuessStats();
}

document.querySelector('#newGameButton').addEventListener('click', () => { round += 1; startRound(); });
document.querySelector('#resetScoreButton').addEventListener('click', () => { scores = { X: 0, O: 0 }; updateScores(); });
document.querySelector('#guessNewGameButton').addEventListener('click', startGuessGame);
document.querySelector('#guessResetButton').addEventListener('click', () => {
  resetGuessStats();
  startGuessGame();
});
modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
viewButtons.forEach(button => button.addEventListener('click', () => setActiveView(button.dataset.view)));
guessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const rawValue = guessInput.value.trim();
  if (!rawValue) {
    setGuessFeedback('Please enter a number before guessing.', 'warn');
    return;
  }

  const guess = Number(rawValue);
  if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
    setGuessFeedback('Enter a whole number between 1 and 100.', 'warn');
    return;
  }

  attempts += 1;
  updateGuessStats();

  if (guess === secretNumber) {
    wins += 1;
    bestScore = bestScore === null ? attempts : Math.min(bestScore, attempts);
    updateGuessStats();
    setGuessFeedback(`Correct! ${secretNumber} was the secret number.`, 'success');
    guessInput.disabled = true;
    return;
  }

  if (guess < secretNumber) setGuessFeedback('Too low — try a higher number.', '');
  else setGuessFeedback('Too high — try a lower number.', '');
  guessInput.value = '';
  guessInput.focus();
});

let wallpaperIndex = 0;
setInterval(() => {
  wallpaperIndex = (wallpaperIndex + 1) % wallpapers.length;
  document.querySelector('.wallpaper').style.backgroundImage = `linear-gradient(90deg, rgba(10, 16, 17, .88), rgba(10, 16, 17, .54)), url("${wallpapers[wallpaperIndex]}")`;
}, 8000);

setActiveView('ttt');
startRound();
startGuessGame();
