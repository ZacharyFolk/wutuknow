import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import levenshtein from 'fast-levenshtein';
import './styles.css';

/**--------------------------------------------
 **               Modal Responses
 *---------------------------------------------**/

const Correct = ({ value }) => {
  return <p>Yes! That is correct for ${value}!</p>;
};

const Incorrect = ({ value, clue }) => {
  return (
    <p>
      Sorry, that is incorrect. You lose -${value}! <br />
      The correct answer was <b>{clue.answer}</b>
    </p>
  );
};

/**--------------------------------------------
 **               Utilities
 *---------------------------------------------**/

function parseString(str) {
  let unwantedWords = ['the', 'a', 'an', 'i'];
  let words = str.toLowerCase().split(/[^\w']+/);
  let filteredWords = words.filter((word) => !unwantedWords.includes(word));
  return filteredWords.join(' ');
}

/**--------------------------------------------
 **               Main Component
 *---------------------------------------------**/

const Trivia = () => {
  const [game, setGame] = useState([]);
  const [state, setState] = useState({
    score: 0,
    currentClue: {},
    category: '',
    input: null,
    modalOutput: '',
    activeCategory: null,
  });
  const answerRef = useRef();

  const toggleCategory = (index) => {
    setState((prevState) => ({
      ...prevState,
      activeCategory: prevState.activeCategory === index ? null : index,
    }));
  };

  const fetchBoard = async () => {
    let localGame = JSON.parse(sessionStorage.getItem('game-one'));
    if (!localGame) {
      const res = await axios.get(
        'http://localhost:3011/api/game?round=Jeopardy!'
      );
      const result = await res.data;
      console.log(result);
      setGame(result);
    } else {
      setGame(localGame);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  useEffect(() => {
    if (state.input != null) {
      checkAnswer();
    }
  }, [state.currentClue, state.input]);

  const handleClick = (e, clue, cat) => {
    console.log('WHAT CAT ', cat);
    setState((prevState) => ({
      ...prevState,
      currentClue: clue,
      category: cat,
      modalOutput: <Answer currentClue={clue} currentCategory={cat} />,
      inputValue: '',
      currentValue: parseInt(clue.value.replace('$', ''), 10),
    }));
    if (answerRef.current) {
      answerRef.current.innerHTML = '';
      answerRef.current.focus();
    }
    setTimeout(() => {
      e.target.className += ' deactivated';
    }, 500);
  };

  const handleButton = () => {
    let typed = parseString(answerRef.current.textContent);
    if (typed === '') return;
    answerRef.current.innerHTML = '';
    setState((prevState) => ({ ...prevState, input: typed }));
  };

  const handleKeys = (e) => {
    let code = e.keyCode;
    switch (code) {
      case 13:
        e.preventDefault();
        let typed = parseString(e.target.textContent);
        if (typed === '') return;
        e.target.innerHTML = '';
        setState((prevState) => ({ ...prevState, input: typed }));
        break;
      default:
      // console.log('something else');
    }
  };

  const checkAnswer = () => {
    const { input, currentClue } = state;
    const distance = levenshtein.get(input, currentClue.answer);
    let percentageMatch =
      (1 - distance / Math.min(input.length, currentClue.answer.length)) * 100;
    percentageMatch = Math.round(percentageMatch);
    if (percentageMatch > 70) {
      let newScore = parseInt(state.score) + parseInt(state.currentValue);
      setState((prevState) => ({
        ...prevState,
        modalOutput: <Correct value={state.currentValue} />,
        score: newScore,
      }));
      setTimeout(() => {
        setState((prevState) => ({ ...prevState, modalOutput: '' }));
      }, 3000);
    } else {
      let newScore = parseInt(state.score) - parseInt(state.currentValue);
      setState((prevState) => ({
        ...prevState,
        score: newScore,
        modalOutput: (
          <Incorrect value={state.currentValue} clue={state.currentClue} />
        ),
      }));
      setTimeout(() => {
        setState((prevState) => ({ ...prevState, modalOutput: '' }));
      }, 3000);
    }
    setState((prevState) => ({
      ...prevState,
      activeCategory: null,
      input: null,
    }));
  };

  const Answer = ({ currentClue, currentCategory }) => {
    const [skipped, setSkipped] = useState(false);
    const skipQ = () => {
      setSkipped(!skipped);
      setTimeout(() => {
        setState((prevState) => ({ ...prevState, modalOutput: '' }));
      }, 2000);
    };

    return (
      <>
        {skipped ? (
          <p>
            OK, skipping that one. <br />
            The correct answer was <b>{currentClue.answer}</b>
          </p>
        ) : (
          <div className="qaContent" onClick={() => answerRef.current.focus()}>
            <div className="heading">
              <h1>
                {currentCategory} for ${state.currentValue}
              </h1>
            </div>
            <div
              className="question"
              dangerouslySetInnerHTML={{ __html: currentClue.question }}
            ></div>
            <div className="answer">
              <span>
                What (<i>who</i>) is
              </span>
              <span className="qForm">
                <span
                  className="terminal-input"
                  contentEditable="true"
                  suppressContentEditableWarning={true}
                  onKeyDown={(e) => handleKeys(e)}
                  ref={answerRef}
                ></span>
                <button className="submitAnswer" onClick={handleButton}>
                  Submit
                </button>
              </span>
              <div className="skipButton">
                <button onClick={skipQ}>skip</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const newGame = () => {
    fetchBoard();
  };

  return (
    <div className="game-container">
      <div className="gameHeader">
        <span className="gameTitle">Wutuno?</span>
        <span className="score"> SCORE : ${state.score}</span>
        <button onClick={newGame}>New Game</button>
      </div>

      <div className="trivia-board">
        {game.length > 0 &&
          game.map((category, i) => (
            <div key={category.category}>
              <h1
                className={`category cat-${i + 1} ${
                  state.activeCategory === i ? 'active' : ''
                }`}
                onClick={() => toggleCategory(i)}
              >
                {category.category}
              </h1>
              <div
                className={`clue ${state.activeCategory === i ? 'on' : 'off'}`}
              >
                {category.clues.map((clue) => (
                  <div
                    key={clue.value}
                    className="value"
                    data-value={clue.value}
                    data-category={category.category}
                    data-question={clue.question}
                    data-answer={clue.answer}
                    onClick={(e) => handleClick(e, clue, category.category)}
                  >
                    {clue.value}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      {state.modalOutput && (
        <div className="game-modal">
          <div className="modal-content">{state.modalOutput}</div>
        </div>
      )}
    </div>
  );
};

export default Trivia;
