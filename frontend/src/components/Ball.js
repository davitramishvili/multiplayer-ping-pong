import React from 'react';

function Ball({ x, y, size }) {
  return (
    <div 
      className="ball"
      style={{
        position: 'absolute',
        left: x - size/2,
        top: y - size/2,
        width: size,
        height: size,
        backgroundColor: '#fff',
        borderRadius: '50%'
      }}
    />
  );
}

export default Ball; 