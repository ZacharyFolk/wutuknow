import sqlite3 from 'sqlite3';
import fs from 'fs';

const db = new sqlite3.Database('questions.db');

fs.readFile('jeopardy_questions.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    db.close();

    return;
  }

  const jsonData = JSON.parse(data);
  const stmt = db.prepare(
    'INSERT INTO clues (category, air_date, question, value, answer, round, show_number) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  jsonData.forEach(
    ({ category, air_date, question, value, answer, round, show_number }) => {
      stmt.run(category, air_date, question, value, answer, round, show_number);
    }
  );

  stmt.finalize(() => {
    console.log('Data imported successfully');
    db.close(); // Close the database after all statements have been finalized
  });
});
