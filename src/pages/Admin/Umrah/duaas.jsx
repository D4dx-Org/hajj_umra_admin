// Hello.jsx
import React from 'react';

function Duas() {
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Hello, World!</h1>
      <p style={styles.text}>This is a simple JSX component.</p>
    </div>
  );
}

const styles = {
  container: {
    textAlign: 'center',
    marginTop: '50px',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    color: '#333',
    fontSize: '2.5rem',
  },
  text: {
    color: '#666',
    fontSize: '1.2rem',
  }
};

export default Duas;