<h1 align="center">
WUTUKNOW
</h1>

<p align="center">
  <a href="https://github.com/">
    <img src="https://img.shields.io/github/v/release/SafdarJamal/vite-template-react" alt="GitHub Release (latest by date)" />
  </a>
  <a href="https://github.com/SafdarJamal/vite-template-react/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/SafdarJamal/vite-template-react" alt="License" />
  </a>
</p>

<p align="center">
    A <a href="https://vitejs.dev">Vite</a> + <a href="https://react.dev">React</a> starter template.
</p>

An experiment to build a Jeopardy style game. It is just for fun and far from perfect.  
It relies on the fuzzy math of [ Levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance) to allow for some flexibility with matching user input.  

You can play around with this [here](https://wutuknow.folk.codes).

If you would like to run this on your own server these are the steps to get set up. 

## Development


To get a local copy of the code, clone it using git:

```
git clone https://github.com/ZacharyFolk/wutuknow.git
cd wutuknow
```

Assuming Node is all set up you will all need to install sqlite3 for the database.

```
sudo apt-get update
sudo apt-get install sqlite3
```

and also install for Node to use in the project folder run

```
npm install sqlite3
```

Now create the database and schema 

```
cd sqlite
touch questions.db
sqlite3 questions.db

# In SQLite shell create the clues table : 

CREATE TABLE clues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT,
  air_date TEXT,
  question TEXT,
  value TEXT,
  answer TEXT,
  round TEXT,
  show_number TEXT
);

# Exit to run the import process
.quit
```

Now Node will run the import process which takes some time with over 200,000 records.

```
node import.js
```



#### Available Scripts

In this project, you can run the following scripts:

| Script        | Description                                             |
| ------------- | ------------------------------------------------------- |
| npm start     | Runs the app in the development mode.                   |
| npm test      | Launches the test runner in the interactive watch mode. |
| npm run build | Builds the app for production to the `dist` folder.     |
| npm run serve | Serves the production build from the `dist` folder.     |

## Credits

Built from a Vite Template React is built and maintained by [Safdar Jamal](https://safdarjamal.github.io).

## License

This project is licensed under the terms of the [MIT license](https://github.com/SafdarJamal/vite-template-react/blob/main/LICENSE).
