import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import './styles.css';
export default function Trivia() {
  const [game, setGame] = useState([]);
  const [score, setScore] = useState(0);
  const [q, setQ] = useState('');
  const [a, setA] = useState('');
  const [category, setCategory] = useState('');
  const [input, setInput] = useState(null);
  const [isActive, setActive] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [incorrect, setIncorrect] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [modalOutput, setModalOutput] = useState('');
  const [currentValue, setCurrentValue] = useState(0);
  // const levenshtein = require('fast-levenshtein');
  const answerRef = useRef();

  const processResults = (result) => {
    setGame(result);
  };

  const fetchBoard = async () => {
    setActive(false);
    let localGame = JSON.parse(sessionStorage.getItem('game-one'));
    if (!localGame) {
      const res = await axios.get(
        'http://localhost:3011/api/game?round=Jeopardy!'
      );
      const result = await res.data;
      console.log(result);
      processResults(result);
    } else {
      setGame(localGame);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const handleClick = (clue) => {
    setActive(true);
    setQ(clue.question);
    setA(clue.answer);
    setCategory(clue.category);
    setCurrentValue(clue.value);
    answerRef.current.innerHTML = '';
    answerRef.current.focus();
  };

  function parseString(str) {
    // clean out things so have a more likely match, a lot of the results are surrounded by 'i'
    let unwantedWords = ['the', 'a', 'an', 'i'];
    let words = str.toLowerCase().split(/[^\w']+/);
    let filteredWords = words.filter((word) => !unwantedWords.includes(word));
    return filteredWords.join(' ');
  }

  const handleButton = () => {
    let typed = parseString(answerRef.current.textContent);
    if (typed === '') return;
    answerRef.current.innerHTML = '';
    setInput(typed);
  };
  const handleKeys = (e) => {
    let code = e.keyCode;
    switch (code) {
      case 13:
        e.preventDefault();
        let typed = parseString(e.target.textContent);
        // prevent empty input
        if (typed === '') return;
        e.target.innerHTML = '';
        setInput(typed);

        break;
      default:
      // console.log('something else');
    }
  };

  const checkAnswer = () => {
    const distance = levenshtein.get(input, a);
    let percentageMatch =
      (1 - distance / Math.min(input.length, a.length)) * 100;
    percentageMatch = Math.round(percentageMatch);
    // Here we set how fuzzy the answer can be...
    if (percentageMatch > 70) {
      let newScore = parseInt(score) + parseInt(currentValue);
      setCorrect(true);
      setModalOutput(Correct);
      setScore(newScore);
      setActive(false);
      setTimeout(() => {
        setCorrect(false);
        setModalOutput('');
      }, 2000);
      // fade result message after a few seconds
    } else {
      let newScore = parseInt(score) - parseInt(currentValue);
      setScore(newScore);
      setActive(false);
      setIncorrect(true);
      setModalOutput(Incorrect);
      setTimeout(() => {
        setIncorrect(false);
      }, 3000);
    }
    setActive(false);
  };
  const skipQ = () => {
    setActive(false);
    setSkipped(true);
    setModalOutput(Skip);
    setTimeout(() => {
      setSkipped(false);
      setModalOutput(Skip);
    }, 3000);
  };

  // Modal Messages
  const Correct = () => {
    return <p>Yes! That is correct for ${currentValue}!</p>;
  };

  const Incorrect = () => {
    return (
      <p>
        Sorry, that is incorrect. You lose -${currentValue}! <br />
        The correct answer was <b>{a.toUpperCase()}</b>
      </p>
    );
  };

  const Skip = () => {
    return (
      <>
        <p>
          OK, skipping that one. <br />
          The correct answer was <b>{a.toUpperCase()}</b>
        </p>
      </>
    );
  };

  const newGame = () => {
    sessionStorage.setItem('game-one', null);
    fetchBoard();
  };
  useEffect(() => {
    if (input == null) return;
    checkAnswer(input);
  }, [input]);

  return (
    <div className="game-container">
      <div className="gameHeader">
        <span className="gameTitle">Wutuno?</span>
        <span className="score"> SCORE : ${score}</span>
        <button onClick={newGame}>New Game</button>
      </div>

      <div className="trivia-board">
        {game.length > 0 &&
          game.map((category, i) => (
            <div key={category.category} className={'category cat-' + (i + 1)}>
              <h1>{category.category}</h1>

              {category.clues.map((clue) => (
                <div
                  key={clue.value}
                  className="value"
                  data-value={clue.value}
                  data-category={category.category}
                  data-question={clue.question}
                  data-answer={clue.answer}
                  onClick={() => handleClick(clue)}
                >
                  ${clue.value}
                </div>
              ))}
            </div>
          ))}
      </div>
      {/* TODO : This could probably be cleaned up since everything uses same generic modal */}
      <div
        className={
          (correct || incorrect || skipped ? 'active ' : 'inactive ') +
          ' game-modal'
        }
      >
        {modalOutput}
      </div>

      <div
        className={'qaBox ' + (isActive ? 'active' : 'inactive')}
        onClick={() => answerRef.current.focus()}
      >
        <div className="qaContent">
          <div className="heading">
            <h1>
              {category} for ${currentValue}
            </h1>
          </div>
          <div className="question">{q}</div>
          <div className="answer">
            <span>
              What (<i>who</i>) is
            </span>
            <span
              className="terminal-input"
              contentEditable="true"
              suppressContentEditableWarning={true}
              onKeyDown={(e) => handleKeys(e)}
              ref={answerRef}
            ></span>
            <button className="submitAnswer" onClick={handleButton}>
              <i className="fa-solid fa-right-to-bracket"></i>
            </button>
          </div>
          <div className="skipButton">
            <span>Type your answer and press ENTER or </span>
            <button onClick={skipQ}>skip</button>
          </div>
        </div>
      </div>
    </div>
  );
}
