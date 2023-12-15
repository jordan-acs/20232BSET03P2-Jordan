const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS cats (id INTEGER PRIMARY KEY, name TEXT, votes INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS dogs (id INTEGER PRIMARY KEY, name TEXT, votes INTEGER)");
});

app.post('/cats', (req, res) => {
  const name = req.body.name;
  db.run('INSERT INTO cats (name, votes) VALUES (?, ?)', [name, 0], function (err) {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});

app.post('/dogs', (req, res) => {
  const name = req.body.name;
  db.run('INSERT INTO dogs (name, votes) VALUES (?, ?)', [name, 0], function (err) {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});

app.post('/vote/:animalType/:id', (req, res) => {
  const animalType = req.params.animalType;
  const id = req.params.id;

  if (animalType !== 'cats' && animalType !== 'dogs') {
    return res.status(400).json({ error: 'Bad Request', message: 'Tipo de animal inserido é inválido' });
  }

  const tableName = animalType === 'cats' ? 'cats' : 'dogs';
  db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      if (!row) {
        res.status(404).send("Registro não encontrado");
      } else {
        db.run(`UPDATE ${tableName} SET votes = votes + 1 WHERE id = ?`, [id], function (err) {
          if (err) {
            res.status(500).json({ error: 'Internal Server Error', message: err.message });
          } else {
            res.status(200).send("Voto computado com sucesso!");
          }
        });
      }
    }
  });
});

app.get('/cats', (req, res) => {
  db.all("SELECT * FROM cats", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get('/dogs', (req, res) => {
  db.all("SELECT * FROM dogs", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(port, () => {
  console.log(`Cats and Dogs Vote app listening at http://localhost:${port}`);
});
