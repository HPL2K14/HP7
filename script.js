const board = document.getElementById('board');
const cells = document.querySelectorAll('[data-cell]');
const message = document.getElementById('message');
const restartBtn = document.getElementById('restartBtn');
const winnerModal = document.getElementById('winnerModal');
const winnerText = document.getElementById('winnerText');
const closeModal = document.getElementById('closeModal');

let currentPlayer = 'X';
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

cells.forEach(cell => {
  cell.addEventListener('click', handleClick, { once: true });
});

function handleClick(e) {
  const cell = e.target;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer.toLowerCase());

  const winCombo = checkWin(currentPlayer);
  if (winCombo) {
    showWin(winCombo, `${currentPlayer} Wins!`);
  } else if (isDraw()) {
    endGame(`It's a Draw!`);
  } else {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  }
}

function checkWin(player) {
  for (const combo of winningCombinations) {
    if (combo.every(i => cells[i].textContent === player)) {
      return combo;
    }
  }
  return null;
}

function isDraw() {
  return [...cells].every(cell => cell.textContent !== '');
}

function disableCells() {
  cells.forEach(cell => cell.removeEventListener('click', handleClick));
}

function showWin(combo, text) {
  combo.forEach(i => cells[i].classList.add('win'));
  endGame(text);
}

function endGame(text) {
  message.textContent = text;
  disableCells();
  showModal(text);
}

function showModal(text) {
  winnerText.textContent = text;
  winnerModal.classList.remove('hidden');
  closeModal.focus();
}

function hideModal() {
  winnerModal.classList.add('hidden');
}

closeModal.addEventListener('click', hideModal);
winnerModal.addEventListener('click', e => { if (e.target === winnerModal) hideModal(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !winnerModal.classList.contains('hidden')) hideModal();
});

restartBtn.addEventListener('click', () => {
  cells.forEach(cell => {
    cell.textContent = '';
    cell.classList.remove('x', 'o', 'win');
    cell.addEventListener('click', handleClick, { once: true });
  });
  currentPlayer = 'X';
  message.textContent = '';
  hideModal();
});