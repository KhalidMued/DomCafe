import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';

function App() {
  return <main className="dom-shell"><h1>DŌM</h1><p>Slow coffee. Deep roots.</p></main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
