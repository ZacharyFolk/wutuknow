import sqlite3 from 'sqlite3';
import fs from 'fs';

const db = new sqlite3.Database('questions.db');

fs.readFile('jeopardy-data/jeopardy_questions.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    db.close();

    return;
  }

  const jsonData = JSON.parse(data);
  const totalRecords = jsonData.length;
  let processedRecords = 0;

  const stmt = db.prepare(
    'INSERT INTO clues (category, air_date, question, value, answer, round, show_number) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  jsonData.forEach(
    ({ category, air_date, question, value, answer, round, show_number }) => {
      stmt.run(category, air_date, question, value, answer, round, show_number, (err) => {
        if (err) {
          console.error(err.message);
        }

        processedRecords++;
        if (processedRecords % 100 === 0 || processedRecords === totalRecords) {
          console.log(`Imported ${processedRecords}/${totalRecords} records`);
        }
      });
    }
  );

  stmt.finalize(() => {
    console.log('Data imported successfully');
    db.close();
  });
});