# 20232BSET03P2
Inteli - Engenharia de Software | Avaliação 2023-2B P2

# Vulnerabilidades encontradas e soluções Propostas:

Neste documento, descreverei as vulnerabilidades identificadas no código fornecido e as medidas tomadas para corrigi-las.

## Criação redundante de tabelas

O arquivo gera um banco de dados temporário usando o SQLITE3 a cada vez que o servidor é inciado, sendo esse mesmo banco excluído sempre que o servirdor é desligado. Embora essa abordagem funcione na lógica de um servidor temporário, em um futuro poderiam haver conflitos caso o sistema já houvesse um banco de dados e tentasse sobrescrevê-lo novamente ao reiniciar o servidor.
<br>
Para solicionar esse problema, foi adicionada a tag `IF NOT EXISTS` ao comando de criação do database, para permitir a a criação de um novo banco de dados somente se um antigo não existir.

## Problema ao gerar ID's

Ao serem criadas novas tabelas, o atributo id não é configurado para representar um valor único que se auto incrementa, gerando assim problemas de consistências na geração de vários id's. 
<br>
Para solucionar esse problema, foi adicionado a tag `PRIMARY KEY` ao comando, pois esse incremento permite definir o atributo id a partir dos atributos citados anteriormente e garantir a consistência dessa propriedade entre as demais linhas.
```
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS cats (id INTEGER PRIMARY KEY, name TEXT, votes INTEGER)");
  db.run("CREATE TABLE IF NOT EXISTS dogs (id INTEGER PRIMARY KEY, name TEXT, votes INTEGER)");
});
```
## SQL Injection

Ao realizar operações no banco de dados, o código realiza inserções diretas de dados nas consultas SQL, abrindo margem para ataques utilizando o método de *sql injection*. 
<br>
Para mitigar esse problema, foram substituídas as consultas SQL dinâmicas por *prepared statements*. Dessa forma, os dados são separados dos comandos SQL, prevenindo ataques de injeção de SQL.

Antigo:
```
app.post('/cats', (req, res) => {
  const name = req.body.name;
  db.run(`INSERT INTO cats (name, votes) VALUES ('${name}', 0)`, function(err) {
    if (err) {
      res.status(500).send("Erro ao inserir no banco de dados");
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});
```
Novo:

```
app.post('/cats', (req, res) => {
  const name = req.body.name;
  db.run('INSERT INTO cats (name, votes) VALUES (?, ?)', [name, 0], function (err) {
    if (err) {
      res.status(500).send("Erro ao inserir no banco de dados");
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});
```
## Voto sem registro de animal

O endpoint `/vote/:animalType/:id` realiza a inserção de votos em animais do banco de dados com base no tipo de animal, podendo ser esse cachorro ou gato, e em seu número de identificação. Porém não existe nenhum algorítimo que valide se o tipo de animal é valido ou se ele realmente existe na tabela, abrindo margem de erro para que animais não cadastrados em nenhuma das tabelas recebam votoss. 
<br>
Dessa forma, foi adicionado uma estrutura condicional de verificação que gerencia se a espécie do animal é verdadeira e se ele realmente existe na tabela.

Antigo:
```
app.post('/vote/:animalType/:id', (req, res) => {
 
  db.run(`UPDATE ${animalType} SET votes = votes + 1 WHERE id = ${id}`);
  res.status(200).send("Voto computado");
});

```
Novo:
```
app.post('/vote/:animalType/:id', (req, res) => {
  const animalType = req.params.animalType;
  const id = req.params.id;

  if (animalType !== 'cats' && animalType !== 'dogs') {
    return res.status(400).json({ error: 'Bad Request', message: 'Tipo de animal inválido' });
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
            res.status(200).send("Voto computado");
          }
        });
      }
    }
  });
});
```

## Tratamento de erros inadequado

O código apresentando apresenta tratamento de erros vagos e pouco explicativos de como entender o problema e consertá-lo, visto que somente retorna expressões genéricas como "ocorreu um erro" sem detalhar de fato o que ocorreu. 
<br>
Para solucionar esse problema, foram adicionados ao tratamento de erros detalhes adicionais do problema, trazendo de forma clara quais ó código de resposta e a mensagem por trás dele.

Exemplo de código antigo:
```
app.get('/cats', (req, res) => {
  db.all("SELECT * FROM cats", [], (err, rows) => {
    if (err) {
      res.status(500).send("Erro ao consultar o banco de dados");
    } else {
      res.json(rows);
    }
  });
});
```
Exemplo de código novo:
```
app.get('/cats', (req, res) => {
  db.all("SELECT * FROM cats", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      res.json(rows);
    }
  });
});
```

## Assinaturas de código vazias

Ao longo do código, alguns endpoints foram declarados mas não foram devidamente preenchidos, impossibilitando sua execução
<br>
Dessa forma, foram preenchidos os trechos de código vazios com base em endpoints semelhantes que utilizam a mesma lógica de funcionamento.

Exemplo de código antigo:
```
app.get('/dogs', (req, res) => {
  
});
```
Exemplo de código novo:
```
app.get('/dogs', (req, res) => {
  db.all("SELECT * FROM dogs", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error', message: err.message });
    } else {
      res.json(rows);
    }
  });
});
```