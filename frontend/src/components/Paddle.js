import React from 'react';

function Paddle({ x, y, width, height, isHighlighted }) {
  return (
    <div 
      className={`paddle ${isHighlighted ? 'highlighted' : ''}`}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor: '#fff',
        boxShadow: isHighlighted ? '0 0 10px #fff' : 'none'
      }}
    />
  );
}

export default Paddle; 