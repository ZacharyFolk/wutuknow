import axios from 'axios';
/**
 * Fetches the game board from the API or local storage and processes the results.
 * @param {function} setGameBoard - The state setter function to update the game state.
 * @returns {void}
 */
export const fetchBoard = async (setGameBoard) => {
  try {
    // setActive(false);
    let localGame = JSON.parse(sessionStorage.getItem('game-one'));
    if (!localGame) {
      const res = await axios.get('https://jservice.io/api/clues');
      const result = await res.data;
      console.log(result);
      const processed = await processResults(result);
      setGameBoard(processed);
    } else {
      setGameBoard(localGame);
    }
  } catch (error) {
    console.error('Error fetching game board:', error.message);
    // Could show user error here
  }
};
/**
 * Processes the API results to create the game board.
 * @param {function} setGameBoard - The state setter function to update the game state.
 * @param {Array} result - The array of clues from the API.
 * @returns {void}
 */
const processResults = (result) => {
  let categories = {};

  result.forEach((clue) => {
    // if category in not in the object yet, add it
    if (!categories[clue.category.title]) {
      categories[clue.category.title] = {};
      categories[clue.category.title].values = [];
    }

    // if value doesnt exist in category, add it
    if (!categories[clue.category.title][clue.value] && clue.value) {
      categories[clue.category.title].values.push(clue.value);
    }
  });
  // filter out categories that do not have all of the values (the values array should always have a length of 5 (200, 400, 600... ))
  const validCategories = Object.keys(categories).filter((category) => {
    const values = categories[category].values;
    console.log('VALUES', values.length);
    return values.length === 5;
  });

  // Only want 6 categories for each gamme
  const gameOne = validCategories.slice(0, 6);

  let gameBoard = {};

  // gameboard is going to be an object of 6 child objects with category title as parent of each child
  // loop through the initial result and matched titles create new object with the question and answer as a child object of their value

  gameOne.forEach((category) => {
    gameBoard[category] = {};

    for (const clue of result) {
      if (clue.category.title === category) {
        gameBoard[category][clue.value] = {
          question: clue.question,
          answer: clue.answer,
        };
      }
    }
  });

  // set to local storage
  sessionStorage.setItem('game-one', JSON.stringify(gameBoard));

  return gameBoard;
};
/**
 * Parses a string to remove unwanted words.
 * @param {string} str - The string to parse.
 * @returns {string} - The parsed string.
 */
function parseString(str) {
  // clean out things so have a more likely match, a lot of the results are surrounded by 'i'
  let unwantedWords = ['the', 'a', 'an', 'i'];
  let words = str.toLowerCase().split(/[^\w']+/);
  let filteredWords = words.filter((word) => !unwantedWords.includes(word));
  return filteredWords.join(' ');
}
/**
 * Handles the click event for a trivia question.
 * @param {Event} e - The click event object.
 * @returns {void}
 */
const handleClick = (e) => {
  setActive(true);
  let q = e.target.getAttribute('data-question');
  let a = e.target.getAttribute('data-answer');
  let v = e.target.getAttribute('data-value');
  let c = e.target.getAttribute('data-category');
  setCurrentValue(v);
  // filter answer to remove some words
  a = parseString(a);
  setQ(q);
  setA(a);
  setCategory(c);
  setTimeout(() => {
    answerRef.current.innerHTML = '';
    answerRef.current.focus();
  }, 100);
  console.log(answerRef.current);
  // set this target to deactivated

  e.target.className += ' deactivated';

  // update number of answers clicked - where check that this = 30?
};
