const express = require("express");
const mysql = require("mysql2");
const mysql2 = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "play4me",
});

let db2;

(async () => {
  try {
    db2 = await mysql2.createPool({
      host: "localhost",
      user: "root",
      password: "12345678",
      database: "play4me",
    });
    console.log("Conexão com o banco de dados (db2) inicializada.");
  } catch (err) {
    console.error("Erro ao conectar ao banco de dados (db2):", err);
  }
})();

// Verifique se há erros ao conectar-se ao banco de dados
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conectado ao banco de dados MySQL.");
});

// Endpoint POST /request
app.post("/request", async (req, res) => {
  const { cliente_id, venue_id, musicas } = req.body;
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json("Token de autenticação ausente");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!cliente_id || !venue_id || !musicas || !Array.isArray(musicas)) {
      return res.status(400).json("Dados insuficientes para a requisição");
    }

    if (musicas.length === 0) {
      return res.json({ message: "Sem músicas selecionadas!" });
    }

    const requisicaoSql =
      "INSERT INTO Requisicoes (cliente_id, venue_id) VALUES (?, ?)";
    const requisicaoValues = [cliente_id, venue_id];

    db.query(requisicaoSql, requisicaoValues, (err, requisicaoResult) => {
      if (err) {
        console.error("Erro ao inserir a requisição:", err);
        return res.status(500).json("Erro ao salvar a requisição");
      }

      const requisicaoId = requisicaoResult.insertId;

      const musicasSql =
        "INSERT INTO Musicas_Requisicao (requisicao_id, nome, imagem, duracao) VALUES ?";
      const musicasValues = musicas.map((musica) => [
        requisicaoId,
        musica.name,
        musica.album?.images?.[0]?.url || null,
        musica.duration_ms || 0,
      ]);

      db.query(musicasSql, [musicasValues], (err, musicasResult) => {
        if (err) {
          console.error("Erro ao inserir músicas na requisição:", err);
          return res
            .status(500)
            .json("Erro ao salvar as músicas da requisição");
        }

        const firstMusicId = musicasResult.insertId;

        const statusSql =
          "INSERT INTO Status_ (music_id, status_text, comentario) VALUES ?";
        const statusValues = musicas.map((_, index) => [
          firstMusicId + index,
          "PENDING",
          "",
        ]);

        db.query(statusSql, [statusValues], (err) => {
          if (err) {
            console.error("Erro ao inserir status das músicas:", err);
            return res.status(500).json("Erro ao salvar status das músicas");
          }

          res.json({ message: "Requisição Enviada!" });
        });
      });
    });
  } catch (err) {
    console.error("Erro de autenticação ou ao processar requisição:", err);
    res.status(401).json("Token inválido ou expirado");
  }
});

app.listen(8081, () => {
  console.log("Servidor rodando na porta 8081...");
});