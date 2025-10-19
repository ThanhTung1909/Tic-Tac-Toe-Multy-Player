export const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
    [0, 5, 11, 16, 21],
    [1, 6, 12, 17, 22],
    [2, 7, 13, 18, 23],
    [3, 8, 14, 19, 24],
    [4, 10, 15, 20, 25],
    [0, 6, 13, 19, 25],
    [4, 9, 13, 17, 21],
  ];

  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[b] === squares[c]) {
      return { winner: squares[a], line: lines[i] };
    }
  }
  return { winner: null, line: [] };
};
