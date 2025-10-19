import React from "react";

const Square = ({ handleClick, value, isWinningLine }) => {
  const isOdd = value % 2 === 1;
  const isEven = value > 0 && value % 2 === 0;

  return (
    <button
      onClick={handleClick}
      className={`square
        ${isWinningLine ? "winning" : ""} 
        ${isOdd ? "isOdd" : "isEven"}
        `}
    >
      {value > 0 ? value : "0"}
    </button>
  );
};

export default Square;
