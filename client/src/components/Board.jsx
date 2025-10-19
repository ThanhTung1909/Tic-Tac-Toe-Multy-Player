import React from 'react'
import Square from './Square'

const Board = ({squares, handleClick, winningLine}) => {
    
  return (
    <div
      className="board grid grid-cols-5 gap-2 justify-center mx-auto w-fit"
    >
      {squares.map((square, index) => (
        <Square
          key={index}
          handleClick={() => handleClick(index)}
          value={square}
          isWinningLine={winningLine?.includes(index) ?? false} 
        />
      ))}
    </div>
  );
}

export default Board