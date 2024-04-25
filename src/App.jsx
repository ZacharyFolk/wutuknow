import { useState } from 'react';
import logo from './logo.svg';
import './App.css';
import Trivia from './Trivia';

const App = () => {
  const [count, setCount] = useState(0);

  return <Trivia />;
};

export default App;
