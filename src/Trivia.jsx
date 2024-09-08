import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import levenshtein from 'fast-levenshtein';
import './styles.css';

/**--------------------------------------------
 **               Utilities
 *---------------------------------------------**/

function parseString(str) {
  if (str) {
    let unwantedWords = ['the', 'its', 'a', 'an', 'i'];
    let words = str.toLowerCase().split(/[^\w']+/);
    let filteredWords = words.filter((word) => !unwantedWords.includes(word));
    return filteredWords.join(' ');
  }
}

/**--------------------------------------------
 **               Main Component
 *---------------------------------------------**/

const Trivia = () => {
  const MODAL_TIMEOUT = 2000;
  const [game, setGame] = useState([]);
  const [state, setState] = useState({
    score: 0,
    currentClue: {},
    category: '',
    input: null,
    modalOutput: '',
    round: 'Jeopardy!',
    over: true,
    activeCategory: null,
    totalClues: null,
    gameStarted: false,
    splashScreenVisible: true,
    wager: 0,
    wagerEntered: false,
  });

  const answerRef = useRef();

  //* Actions

  const startGame = () => {
    setState((prevState) => ({
      ...prevState,
      gameStarted: true,
      splashScreenVisible: false,
    }));
  };

  const toggleCategory = (index) => {
    setState((prevState) => ({
      ...prevState,
      activeCategory: index === prevState.activeCategory ? null : index,
    }));
  };

  const handleClick = (e, clue, cat) => {
    if (state.round === 'Final%20Jeopardy!' && !state.wagerEntered) {
      // setState((prevState) => ({
      //   ...prevState,
      //   wager: parseInt(clue.value.replace('$', ''), 10),
      //   wagerEntered: true,
      // }));
      return;
    }

    setState((prevState) => ({
      ...prevState,
      currentClue: clue,
      category: cat,
      modalOutput: (
        <Answer
          currentClue={clue}
          currentCategory={cat}
          currentValue={parseInt(clue.value.replace('$', ''), 10)}
        />
      ),
      inputValue: '',
      currentValue: parseInt(clue.value.replace('$', ''), 10),
      totalClues: prevState.totalClues - 1, // Decrement totalClues by 1
    }));

    if (answerRef.current) {
      answerRef.current.innerHTML = '';
      answerRef.current.focus();
    }
    setTimeout(() => {
      e.target.className += ' deactivated';
    }, 500);
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

  const handleButton = () => {
    let typed = parseString(answerRef.current.textContent);
    if (typed === '') return;
    answerRef.current.innerHTML = '';
    setState((prevState) => ({ ...prevState, input: typed }));
  };

  const handleWagerChange = (e) => {
    console.log('Changing wager to:', e.target.value);

    const value = e.target.value.trim();
    let newWager = 0;

    if (value !== '' && !isNaN(value)) {
      newWager = parseInt(value, 10);
      if (newWager < 0) {
        newWager = 0;
      } else if (newWager > state.score) {
        newWager = state.score;
      }
    }

    setState((prevState) => ({
      ...prevState,
      wager: newWager,
    }));
  };

  const fetchBoard = async () => {
    const res = await axios.get(
      `https://wutuknow-api.folk.codes/api/game?round=${state.round}`
    );
    const result = await res.data;

    const totalClues = result.reduce(
      (total, category) => total + category.clues.length,
      0
    );

    setState((prevState) => ({
      ...prevState,
      score: 0,
      totalClues: totalClues,
      wager: 0,
      over: false,
    }));

    setGame(result);
  };

  const setWager = (e, clue, cat) => {
    setState((prevState) => ({
      ...prevState,
      currentClue: clue,
      category: cat,
      modalOutput: (
        <Answer
          currentClue={clue}
          currentCategory={cat}
          currentValue={parseInt(state.wager)}
        />
      ),
      inputValue: '',
      currentValue: parseInt(state.wager),
      totalClues: prevState.totalClues - 1,
    }));

    console.log(state.wager);
  };
  //* Effects

  useEffect(() => {
    fetchBoard();
  }, []);

  useEffect(() => {
    if (state.input != null) {
      checkAnswer();
    }
  }, [state.currentClue, state.input]);

  useEffect(() => {
    console.log('totalClues', state.totalClues);

    if (state.totalClues === 0) {
      nextRound(state.round);
    }
  }, [state.totalClues]);

  const nextRound = (round) => {
    switch (round) {
      case 'Jeopardy!':
        console.log('Next Round : Double%20Jeopardy!');
        setState((prevState) => ({
          ...prevState,
          round: 'Double%20Jeopardy!',
        }));
        break;
      case 'Double%20Jeopardy!':
        console.log('Next Round : Final%20Jeopardy!');
        setState((prevState) => ({
          ...prevState,
          round: 'Final%20Jeopardy!',
        }));
        break;
      case 'Final%20Jeopardy!':
        console.log('Next Round : end');
        break;
      default:
        break;
    }
  };

  const ModalMessage = ({ isCorrect, value, clue }) => {
    return (
      <p className="qResult">
        {isCorrect
          ? `Yes! That is correct for ${value}!`
          : `Sorry, that is incorrect. You lose -${value}!`}
        {!isCorrect && (
          <>
            <br />
            The correct answer was <b>{clue.answer}</b>
          </>
        )}
      </p>
    );
  };

  const checkAnswer = () => {
    const { input, currentClue } = state;
    let parsed = parseString(currentClue.answer);
    const distance = levenshtein.get(input, parsed);
    let percentageMatch =
      (1 - distance / Math.min(input.length, parsed.length)) * 100;
    percentageMatch = Math.round(percentageMatch);
    if (percentageMatch > 70) {
      let newScore = parseInt(state.score) + parseInt(state.currentValue);
      setState((prevState) => ({
        ...prevState,
        modalOutput: (
          <ModalMessage
            isCorrect={true}
            value={state.currentValue}
            clue={state.currentClue}
          />
        ),
        score: newScore,
      }));
      setTimeout(() => {
        setState((prevState) => ({ ...prevState, modalOutput: '' }));
      }, MODAL_TIMEOUT);
    } else {
      let newScore = parseInt(state.score) - parseInt(state.currentValue);
      setState((prevState) => ({
        ...prevState,
        score: newScore,
        modalOutput: (
          <ModalMessage
            isCorrect={false}
            value={state.currentValue}
            clue={state.currentClue}
          />
        ),
      }));
      setTimeout(() => {
        setState((prevState) => ({ ...prevState, modalOutput: '' }));
      }, MODAL_TIMEOUT);
    }
    setState((prevState) => ({
      ...prevState,
      activeCategory: null,
      input: null,
    }));
  };

  const Answer = ({ currentClue, currentCategory, currentValue }) => {
    const [skipped, setSkipped] = useState(false);

    const skipQ = (v) => {
      let penalty = currentValue * 0.5;
      console.log('PENALTY ', penalty, currentValue, v);
      let newScore = parseInt(state.score) - parseInt(penalty);
      setState((prevState) => ({
        ...prevState,
        score: newScore,
      }));
      setSkipped(!skipped);

      if (state.round === 'Final%20Jeopardy!') {
        setState((prevState) => ({
          ...prevState,
          over: true,
        }));
      }
      setTimeout(() => {
        setState((prevState) => ({ ...prevState, modalOutput: '' }));
      }, MODAL_TIMEOUT);
    };

    return (
      <>
        {skipped ? (
          <p>
            OK, skipping that one. The correct answer was
            <b>{' ' + currentClue.answer}</b>
          </p>
        ) : (
          <div className="qaContent" onClick={() => answerRef.current.focus()}>
            <div className="heading">
              <h1>
                {currentCategory} for {currentValue}
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
                <button onClick={() => skipQ(state.currentValue)}>skip</button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  // Function to render the round banner
  const renderRoundBanner = () => {
    switch (state.round) {
      case 'Jeopardy!':
        return <div>ROUND 1</div>;
      case 'Double%20Jeopardy!':
        return <div>ROUND 2</div>;
      case 'Final%20Jeopardy!':
        return <div>FINAL ROUND</div>;
      default:
        return null;
    }
  };
  return (
    <div className="game-container">
      {state.splashScreenVisible ? (
        <div className="splash-screen">
          <h1 className="gameTitle">Wutuknow?</h1>
          <p>
            Welcome to an experimental game that I built just for fun. I also
            built an API to query a huge dataset of over 250,000 questions and
            answers. You can read more about it on my blog.
          </p>
          <p>
            This in no way associated or sponsored by Jeopardy Productions,
            Inc., I am just a fan and making random stuff to improve my Node and
            React skills.
          </p>
          <p>
            I am sure there are still many, many 🐛🐛 but if anyone is actually
            u enjoying this then let me know and maybe I will give it some more
            ❤️
          </p>
          <div className="rules">
            <h2>How to play : </h2>
            <ul>
              <li>
                Type the correct "question", if your spelling is not perfect I
                made the matches a little "fuzzy"
              </li>
              <li>A correct response earns that answer's value</li>
              <li>An incorrect response subtracts that answer's value</li>
              <li>
                Skipping the question will subtract half that answer's value
                from your total score
              </li>
            </ul>
          </div>
          <button onClick={startGame}>Start Game</button>
        </div>
      ) : (
        <>
          <div className="gameHeader">
            <div className="header-left">
              <span className="gameTitle">Wutukno?</span>
              <span className="round">{renderRoundBanner()} </span>
            </div>
            <div className="header-right">
              <span className="score"> SCORE : ${state.score}</span>
              <button onClick={fetchBoard}>New Game</button>
            </div>
          </div>

          <div
            className={`trivia-board ${
              state.round === 'Final%20Jeopardy!' ? 'final-round' : ''
            }`}
          >
            {game.length > 0 &&
              !state.over &&
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
                    className={`clue ${
                      state.activeCategory === i ? 'on' : 'off'
                    }`}
                  >
                    {category.clues.map((clue, index) => (
                      <div
                        key={`${category.category}-${index}`}
                        className={`value ${
                          state.round === 'Final%20Jeopardy!' ? ' wager' : ''
                        }`}
                        onClick={(e) => handleClick(e, clue, category.category)}
                      >
                        {state.round === 'Final%20Jeopardy!' ? (
                          <div className="wager-box">
                            <h3>Wager any amount up to ${state.score}</h3>
                            <input
                              type="number"
                              value={state.wager}
                              onChange={handleWagerChange}
                              placeholder="Enter Wager"
                            />
                            <button
                              onClick={(e) =>
                                setWager(e, clue, category.category)
                              }
                            >
                              GO!
                            </button>
                          </div>
                        ) : (
                          clue.value
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
      {state.modalOutput && (
        <div className="game-modal">
          <div className="modal-content">{state.modalOutput}</div>
        </div>
      )}

      {state.over && (
        <div className="game-over">
          {' '}
          <h1>GAME OVER</h1>
          <p>
            Wow, whoever you are, you did it! You made it all the way through my
            goofy little experiment with an awesome score of {state.score}. I am
            so impressed and a little embarrassed because I never really
            finished this. It was high time for me to do other things with
            myself than work on this random project. Other than I am sure
            hundreds of bugs, all I saw left to do was to add a leader board. In
            a state of clarity I decided not to bother doing this until it was
            proven to me that some other individual actually made it to to the
            end of this.
          </p>
          <p>
            Well, apparently that individual is you!! Congratulations! If you
            take one final step and send me an email with your score I will
            finish this with a leader-board and add your score as the first. You
            will also attain that honorary position of being the only person in
            the world forever highlighted on the leader-board. Just send me an
            email and include your score!
            <br />
            <a href="mailto:folkcodes@gmail.com?subject=Someone actually played WUTUKNO!!">
              folkcodes@gmail.com
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default Trivia;
