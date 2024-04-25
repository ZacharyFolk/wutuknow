import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
const app = express();
const db = new sqlite3.Database('./../sqlite/questions.db');
// Enable all CORS requests
app.use(cors());
/**
 * GET /api/game
 * Returns categories with their clues for the specified round (Jeopardy!, Double Jeopardy!, or Final Jeopardy!).
 *
 * @param {string} round - The round of the game (Jeopardy!, Double Jeopardy!, Final Jeopardy!).
 * @returns {Object[]} - An array of categories with their clues.
 */
app.get('/api/game', (req, res) => {
  const { round } = req.query;

  let roundFilter = '';
  if (round) {
    if (round === 'Final Jeopardy!') {
      roundFilter = `AND round = '${round}'`;
    } else {
      roundFilter = `AND round = '${round}' AND round != 'Final Jeopardy!'`;
    }
  }

  db.get(
    'SELECT DISTINCT show_number FROM clues ORDER BY RANDOM() LIMIT 1',
    (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }

      const { show_number } = row;

      let query = `
          SELECT category, question, answer, value
          FROM clues 
          WHERE show_number = '${show_number}' ${roundFilter}
          ORDER BY category, value`;

      if (round === 'Final Jeopardy!') {
        query = `
            SELECT category, question, answer, value
            FROM clues 
            WHERE show_number = '${show_number}' AND round = '${round}'
            ORDER BY RANDOM()`;
      }

      db.all(query, (err, rows) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
          return;
        }

        const categories = {};
        rows.forEach((row) => {
          if (!categories[row.category]) {
            categories[row.category] = {
              category: row.category,
              clues: [],
            };
          }
          categories[row.category].clues.push({
            question: row.question,
            answer: row.answer,
            value: row.value,
          });
        });

        const categoriesArray = Object.values(categories);

        res.json(categoriesArray);
      });
    }
  );
});

app.listen(3011, () => {
  console.log('Server running on port 3011');
});
