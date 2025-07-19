const board = document.getElementById('board');
let cells = document.querySelectorAll('[data-cell]'); // will reassign after reset if needed
const message = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const closeModal = document.getElementById('closeModal');
const modeSelect = document.getElementById('modeSelect');
const difficultyWrapper = document.getElementById('difficultyWrapper');
const difficultySelect = document.getElementById('difficulty');

// ================= Game State =================
let currentPlayer = 'X'; // Human is X when vs AI
const HUMAN = 'X';
const AI = 'O';
let gameOver = false;

const winningCombinations = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// ================= Initialization =================
initListeners();
updateStatusMessage();

function initListeners() {
  cells.forEach((cell, idx) => {
    cell.addEventListener('click', handleClick, { once: true });
    cell.addEventListener('keydown', e => { if (!gameOver && (e.key === 'Enter' || e.key === ' ')) cell.click(); });
  });
}

modeSelect.addEventListener('change', () => {
  const vsAI = isVsAI();
  difficultyWrapper.classList.toggle('hidden', !vsAI);
  resetGame();
});

difficultySelect.addEventListener('change', () => {
  if (isVsAI() && currentPlayer === AI && !gameOver) {
    setTimeout(aiMove, 200);
  }
});

restartBtn.addEventListener('click', resetGame);
closeModal.addEventListener('click', hideModal);
winnerModal.addEventListener('click', e => { if (e.target === winnerModal) hideModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !winnerModal.classList.contains('hidden')) hideModal(); });

function isVsAI() { return modeSelect.value === 'ai'; }

// ================= Event Handlers =================
function handleClick(e) {
  if (gameOver) return;
  if (isVsAI() && currentPlayer === AI) return; // ignore clicks during AI turn
  const cell = e.target;
  playMove(cell, currentPlayer);
  if (gameOver) return;
  if (isVsAI()) {
    currentPlayer = AI;
    updateStatusMessage();
    setTimeout(aiMove, 250);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatusMessage();
  }
}

// ================= Core Logic =================
function playMove(cell, player) {
  if (cell.textContent !== '') return; // already filled
  cell.textContent = player;
  cell.classList.add(player.toLowerCase());
  const winCombo = checkWin(player);
  if (winCombo) {
    showWin(winCombo, `${player} Wins!`);
    gameOver = true;
  } else if (isDraw()) {
    endGame(`It's a Draw!`);
    gameOver = true;
  }
}

function checkWin(player) {
  for (const combo of winningCombinations) {
    if (combo.every(i => cells[i].textContent === player)) return combo;
  }
  return null;
}

function isDraw() { return [...cells].every(c => c.textContent !== ''); }

function disableCells() { cells.forEach(c => c.removeEventListener('click', handleClick)); }

function showWin(combo, text) { combo.forEach(i => cells[i].classList.add('win')); endGame(text); }

function endGame(text) { message.textContent = text; disableCells(); showModal(text); }

// ================= Modal =================
function showModal(text) { winnerText.textContent = text; winnerModal.classList.remove('hidden'); closeModal.focus(); }
function hideModal() { winnerModal.classList.add('hidden'); }

// ================= Reset =================
function resetGame() {
  gameOver = false;
  currentPlayer = 'X';
  hideModal();
  // Clear board & listeners
  cells.forEach(cell => {
    cell.textContent = '';
    cell.className = 'cell';
    cell.replaceWith(cell); // no-op keeps reference
  });
  // Remove & re-add listeners (safe even if some still had theirs)
  cells.forEach(cell => {
    cell.removeEventListener('click', handleClick); // ensure clean slate
    cell.addEventListener('click', handleClick, { once: true });
  });
  updateStatusMessage();
}

function updateStatusMessage() {
  if (gameOver) return;
  if (isVsAI()) {
    if (currentPlayer === HUMAN) {
      message.textContent = 'Your turn (X)';
    } else {
      message.textContent = 'AI thinking...';
    }
  } else {
    message.textContent = `${currentPlayer}'s turn`;
  }
}

// ================= AI Logic =================
function aiMove() {
  if (gameOver) return;
  const difficulty = difficultySelect.value;
  const moveIndex = (difficulty === 'easy') ? randomMove() : bestMove();
  if (moveIndex == null) return;
  const cell = cells[moveIndex];
  playMove(cell, AI);
  if (!gameOver) {
    currentPlayer = HUMAN;
    updateStatusMessage();
  }
}

function randomMove() {
  const empty = emptyIndices();
  return empty[Math.floor(Math.random() * empty.length)];
}

function emptyIndices() {
  const idx = [];
  cells.forEach((c,i)=> { if (!c.textContent) idx.push(i); });
  return idx;
}

function bestMove() {
  const boardState = [...cells].map(c => c.textContent || '');
  let bestScore = -Infinity;
  let move = null;
  for (const i of emptyIndices()) {
    boardState[i] = AI;
    const score = minimax(boardState, 0, false, -Infinity, Infinity);
    boardState[i] = '';
    if (score > bestScore) { bestScore = score; move = i; }
  }
  return move;
}

const scores = { [AI]: 10, [HUMAN]: -10, draw: 0 };
function minimax(state, depth, isMaximizing, alpha, beta) {
  const result = evaluateState(state);
  if (result !== null) return scores[result] - depth * (result === AI ? 1 : -1);

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of indicesEmpty(state)) {
      state[i] = AI;
      const val = minimax(state, depth + 1, false, alpha, beta);
      state[i] = '';
      best = Math.max(best, val);
      alpha = Math.max(alpha, val);
      if (beta <= alpha) break; // prune
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of indicesEmpty(state)) {
      state[i] = HUMAN;
      const val = minimax(state, depth + 1, true, alpha, beta);
      state[i] = '';
      best = Math.min(best, val);
      beta = Math.min(beta, val);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function evaluateState(state) {
  for (const combo of winningCombinations) {
    const [a,b,c] = combo;
    if (state[a] && state[a] === state[b] && state[a] === state[c]) return state[a];
  }
  if (state.every(v => v)) return 'draw';
  return null;
}

function indicesEmpty(state) {
  const out = [];
  state.forEach((v,i) => { if (!v) out.push(i); });
  return out;
}
