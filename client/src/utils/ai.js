import { calculateWinner } from "./gameLogic";

const aiPlayer = "O";
const humanPlayer = "X";
let positionsEvaluated = 0;

const minimax = (newSquares, depth, isMaximizing, alpha, beta) => {
  positionsEvaluated++;
  const { winner } = calculateWinner(newSquares);

  if (winner === aiPlayer) return 10 - depth;
  if (winner === humanPlayer) return depth - 10;
  if (!newSquares.includes(null)) return 0;

  if (isMaximizing) {
    let bestScore = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (newSquares[i] === null) {
        
        newSquares[i] = aiPlayer;
        let score = minimax(newSquares, depth + 1, false, alpha, beta);
        newSquares[i] = null
        bestScore = Math.max(score, bestScore);
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) {
          break;
        }
      }
    }
    return bestScore;
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < newSquares.length; i++) {
      if (newSquares[i] === null) {
        
        newSquares[i] = humanPlayer;
        let score = minimax(newSquares, depth + 1, true, alpha, beta);
        newSquares[i] = null
        bestScore = Math.min(score, bestScore);
        beta = Math.min(beta, bestScore);
        if (beta <= alpha) {
          break;
        }
      }
    }
    return bestScore;
  }
};

export const findBestMove = (newSquares) => {
  let bestScore = -Infinity;
  let move = -1;
  for (let i = 0; i < 9; i++) {
    if (newSquares[i] === null) {
      newSquares[i] = aiPlayer;
      let score = minimax(newSquares, 0, false, -Infinity, Infinity);
      newSquares[i] = null
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
};
