const mysql = require("mysql2");
const mysql2 = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app); // Criando o servidor HTTP

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Quando o cliente se conecta, ele deve ingressar na sala correta
io.on("connection", (socket) => {
  console.log("Usuário conectado:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`Cliente ${socket.id} ingressou na sala: ${roomId}`);
    socket.join(roomId);
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado:", socket.id);
  });
});

const SECRET_KEY = process.env.SECRET_KEY;
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const db = mysql.createConnection({
  host: process.env.DB_HOST || "your-railway-host",
  user: process.env.DB_USER || "your-railway-user",
  password: process.env.DB_PASSWORD || "your-railway-password",
  database: process.env.DB_NAME || "your-railway-database",
  port: process.env.DB_PORT || 3306,
});

let db2;

(async () => {
  try {
    db2 = await mysql2.createPool({
      host: process.env.DB_HOST || "your-railway-host",
      user: process.env.DB_USER || "your-railway-user",
      password: process.env.DB_PASSWORD || "your-railway-password",
      database: process.env.DB_NAME || "your-railway-database",
      port: process.env.DB_PORT || 3306,
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

// Rota para Login com Google
app.post("/google-login", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token não fornecido" });
  }

  try {
    // Valida o Token usando o cliente do Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, sub: googleId, name } = payload;

    // Verifica se o email está confirmado
    if (!payload.email_verified) {
      return res
        .status(401)
        .json({ message: "Email não verificado pelo Google" });
    }

    // Verifica se o usuário já existe
    const sqlFindUser = "SELECT * FROM Usuario WHERE email = ?";
    const [existingUser] = await db2.execute(sqlFindUser, [email]);

    let user;
    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      // Cria um novo usuário
      const hashedPassword = await bcrypt.hash(googleId, 10); // Hash temporário
      const sqlCreateUser = `
        INSERT INTO Usuario (username, email, pwd)
        VALUES (?, ?, ?)
      `;
      await db2.execute(sqlCreateUser, [name, email, hashedPassword]);
      const [newUser] = await db2.execute(sqlFindUser, [email]);
      user = newUser[0];
    }

    // Gera um token JWT
    const jwtToken = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      SECRET_KEY,
      { expiresIn: "5h" }
    );

    res.json({ token: jwtToken });
  } catch (error) {
    console.error("Erro ao validar o token com a Google:", error);
    res.status(401).json({ message: "Token inválido ou erro de autenticação" });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM Usuario WHERE email = ?";

  db.query(sql, [email], async (err, data) => {
    if (err) {
      console.error("Erro ao executar a consulta:", err);
      return res.status(500).json("Erro interno no servidor");
    }
    if (data.length > 0) {
      const user = data[0];
      const isPasswordValid = await bcrypt.compare(password, user.pwd);
      if (isPasswordValid) {
        const token = jwt.sign(
          { userId: user.id, username: user.username, email: user.email },
          SECRET_KEY,
          { expiresIn: "5h" }
        );
        return res.json({ token }); // Apenas retorna o token, contendo todos os dados necessários
      } else {
        return res.status(401).json("Senha incorreta");
      }
    } else {
      return res.status(401).json("Email não encontrado");
    }
  });
});

app.post("/login-venue", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM Venue WHERE email = ?";

  db.query(sql, [email], async (err, data) => {
    if (err) {
      console.error("Erro ao executar a consulta:", err);
      return res.status(500).json("Erro interno no servidor");
    }
    if (data.length > 0) {
      const venue = data[0];
      const isPasswordValid = password === venue.pwd; // Comparação simples de senha
      if (isPasswordValid) {
        // Gera o token incluindo `id` e `nome` do venue
        const token = jwt.sign(
          { id: venue.id, nome: venue.nome, email: venue.email },
          SECRET_KEY,
          { expiresIn: "5h" }
        );
        return res.json({ token }); // Retorna apenas o token
      } else {
        return res.status(401).json("Senha incorreta");
      }
    } else {
      return res.status(401).json("Email não encontrado");
    }
  });
});

// Rota de registro
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Verifica se o username já está em uso
  db.query(
    "SELECT * FROM Usuario WHERE username = ?",
    [username],
    (err, result) => {
      if (err) return res.status(500).json("Erro no servidor");

      if (result.length > 0) {
        return res.status(400).json("Username já em uso");
      }

      // Verifica se o email já está registrado
      db.query(
        "SELECT * FROM Usuario WHERE email = ?",
        [email],
        async (err, result) => {
          if (err) return res.status(500).json("Erro no servidor");

          if (result.length > 0) {
            return res.status(400).json("Email já registrado");
          }

          try {
            // Encriptação da senha
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Insere o novo usuário no banco de dados
            const sql =
              "INSERT INTO Usuario (username, email, pwd) VALUES (?, ?, ?)";
            const values = [username, email, hashedPassword];

            db.query(sql, values, (err, result) => {
              if (err) {
                console.error("Erro ao registrar:", err);
                return res.status(500).json("Erro no servidor");
              }
              res.json("Usuário registrado com sucesso");
            });
          } catch (error) {
            console.error("Erro ao encriptar senha:", error);
            return res.status(500).json("Erro ao encriptar senha");
          }
        }
      );
    }
  );
});

//Rota/Endpoint para Pesquisa de Sons
app.post("/search", async (req, res) => {
  const { query } = req.body;

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    data: "grant_type=client_credentials",
  };

  try {
    const authResponse = await axios(authOptions);
    const accessToken = authResponse.data.access_token;

    const searchOptions = {
      url: "https://api.spotify.com/v1/search",
      method: "get",
      headers: {
        Authorization: "Bearer " + accessToken,
      },
      params: {
        q: query,
        type: "track",
        limit: 30,
      },
    };

    const searchResponse = await axios(searchOptions);
    const tracks = searchResponse.data.tracks.items;

    res.json(tracks);
  } catch (err) {
    // Corrected to 'err' instead of 'error'
    console.error("Erro ao buscar músicas:", err);
    res.status(500).json({ error: "Erro ao buscar músicas" });
  }
});

// Adiciona um novo request e avisa o Venue especifico
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

          // Consulta o nome do cliente
          const clienteSql = "SELECT username FROM Usuario WHERE id = ?";
          db.query(clienteSql, [cliente_id], (err, clienteResult) => {
            if (err) {
              console.error("Erro ao buscar nome do cliente:", err);
              return res.status(500).json("Erro ao buscar nome do cliente");
            }
            const clienteNome = clienteResult[0]?.username; // Ajuste aqui para 'username'

            console.log(`Sala : veune-${venue_id}`);
            // Emite o evento para o venue específico com o nome do cliente
            const sala = `venue-${venue_id}`;
            console.log(`Tentando enviar para a sala: ${sala}`);
            io.to(sala).emit("new-request", {
              message: "Nova requisição recebida!",
              requisicaoId,
              musicas,
              clienteNome,
            });

            res.json({ message: "Requisição Enviada!" });
          });
        });
      });
    });
  } catch (err) {
    console.error("Erro de autenticação ou ao processar requisição:", err);
    res.status(401).json("Token inválido ou expirado");
  }
});

// Rota para retornar as requisições
app.get("/getrequests", async (req, res) => {
  try {
    // Verificar se o token foi enviado no cabeçalho da requisição
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer token"

    if (!token) {
      return res
        .status(401)
        .json({ error: "Token de autorização não fornecido" });
    }

    // Validar e decodificar o token
    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Token inválido" });
      }

      // Capturamos o filtro opcional de `venue_id` ou `user_id`
      const { venue_id: queryVenueId, user_id: queryUserId } = req.query;

      // Construção dinâmica da query SQL
      let query = `
        SELECT 
          r.requisicao_id,
          u.id AS cliente_id,
          u.username AS cliente_nome,
          u.email AS cliente_email,
          v.id AS venue_id,
          v.nome AS venue_nome,
          v.localizacao AS venue_localizacao,
          r.data_requisicao,
          m.id AS musica_id,
          m.nome AS musica_nome,
          m.imagem AS musica_imagem,
          m.duracao AS musica_duracao,
          m.played AS musica_played,  -- Inclui o campo played
          s.status_text, s.data_resposta, s.comentario  -- Inclui o campo comentario
        FROM Requisicoes r
        JOIN Usuario u ON r.cliente_id = u.id
        JOIN Venue v ON r.venue_id = v.id
        LEFT JOIN Musicas_Requisicao m ON r.requisicao_id = m.requisicao_id
        LEFT JOIN Status_ s ON m.id = s.music_id
        WHERE 1=1
      `;

      const queryParams = [];

      if (queryVenueId) {
        query += " AND r.venue_id = ?";
        queryParams.push(queryVenueId);
      }

      if (queryUserId) {
        query += " AND r.cliente_id = ?";
        queryParams.push(queryUserId);
      }

      query += " ORDER BY r.data_requisicao DESC";

      // Executa a consulta no banco de dados
      const [rows] = await db2.query(query, queryParams);

      // Processa os resultados da consulta para estruturar os dados
      const requisicoes = rows.reduce((acc, row) => {
        let requisicao = acc.find((r) => r.requisicao_id === row.requisicao_id);
        if (!requisicao) {
          requisicao = {
            requisicao_id: row.requisicao_id,
            cliente: {
              id: row.cliente_id,
              nome: row.cliente_nome,
              email: row.cliente_email,
            },
            venue: {
              id: row.venue_id,
              nome: row.venue_nome,
              localizacao: row.venue_localizacao,
            },
            data_requisicao: row.data_requisicao,
            musicas: [],
          };
          acc.push(requisicao);
        }

        if (row.musica_nome) {
          requisicao.musicas.push({
            id: row.musica_id,
            nome: row.musica_nome,
            imagem: row.musica_imagem,
            duracao: row.musica_duracao,
            played: row.musica_played, // Inclui o campo played
            status_text: row.status_text,
            data_resposta: row.data_resposta,
            comentario: row.comentario, // Inclui o campo comentario
          });
        }

        return acc;
      }, []);

      // Retorna as requisições processadas
      res.json(requisicoes);
    });
  } catch (error) {
    console.error("Erro ao buscar requisições:", error);
    res.status(500).json({ error: "Erro ao buscar requisições" });
  }
});

// Rota para processar a resposta do Venue para uma música específica
app.post("/process-action", (req, res) => {
  const { music_id, status_text, comentario, user_id } = req.body; // Adicionado user_id

  // Validações iniciais
  if (!music_id || !status_text || typeof comentario !== "string" || !user_id) {
    return res.status(400).json({ message: "Dados incompletos ou inválidos!" });
  }

  // Recuperar o nome da música usando o music_id
  const musicQuery = `SELECT nome FROM Musicas_Requisicao WHERE id = ?`;

  db.query(musicQuery, [music_id], (err, result) => {
    if (err) {
      console.error("Erro ao buscar o nome da música:", err);
      return res.status(500).json({ message: "Erro interno no servidor!" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Música não encontrada!" });
    }

    const musicName = result[0].nome;

    // Atualizar status e comentário da música específica
    const updateQuery = `
    UPDATE Status_
    SET status_text = ?, comentario = ?, data_resposta = ?
    WHERE music_id = ?`;

    const now = new Date();
    const dataResposta = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds()
    ).padStart(2, "0")}`;
    // Formato compatível com MySQL

    db.query(
      updateQuery,
      [status_text, comentario, dataResposta, music_id],
      (err, result) => {
        if (err) {
          console.error("Erro ao atualizar o status da música:", err);
          return res.status(500).json({ message: "Erro interno no servidor!" });
        }

        if (result.affectedRows === 0) {
          return res
            .status(404)
            .json({ message: "Música ou status não encontrado!" });
        }

        // Enviar atualização para a sala do usuário
        const sala = `user-${user_id}`;
        console.log(`Enviando resposta para a sala: ${sala}`);

        // Ajustando a mensagem para incluir o nome da música
        const actionMessage =
          status_text === "approve"
            ? `A música "${musicName}" foi aceita!`
            : `A música "${musicName}" foi rejeitada!`;

        io.to(sala).emit("music-action-response", {
          message: actionMessage,
          music_id,
          status_text,
          comentario,
          data_resposta: dataResposta, // Enviando a data de resposta no evento
        });

        // Resposta de sucesso
        res.json({ message: "Status da música atualizado com sucesso!" });
      }
    );
  });
});

// Rota para marcar a música como tocada
app.post("/play-music", async (req, res) => {
  const { music_id } = req.body;

  if (!music_id) {
    return res.status(400).json({ message: "ID da música não fornecido!" });
  }

  try {
    // Atualiza o status da música para tocada
    const updateQuery =
      "UPDATE Musicas_Requisicao SET played = TRUE WHERE id = ?";
    const [result] = await db2.query(updateQuery, [music_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Música não encontrada!" });
    }

    // Recupera o ID do usuário dono da requisição
    const userQuery = `
      SELECT r.cliente_id, m.nome AS musica_nome
      FROM Musicas_Requisicao m
      JOIN Requisicoes r ON m.requisicao_id = r.requisicao_id
      WHERE m.id = ?
    `;
    const [userRows] = await db2.query(userQuery, [music_id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "Requisição não encontrada!" });
    }

    const userId = userRows[0].cliente_id;
    const musicaNome = userRows[0].musica_nome;

    // Envia uma notificação ao usuário dono da requisição
    const sala = `user-${userId}`;
    io.to(sala).emit("music-played", {
      message: `A música "${musicaNome}" foi tocada!`,
      music_id,
    });

    res.json({ message: "Música marcada como tocada!" });
  } catch (error) {
    console.error("Erro ao marcar a música como tocada:", error);
    res.status(500).json({ message: "Erro interno no servidor!" });
  }
});

// Rota para eliminar uma música da requisição
app.delete("/delete-music", async (req, res) => {
  const { music_id } = req.body;
  const token = req.headers.authorization?.split(" ")[1]; // "Bearer token"

  if (!token) {
    return res
      .status(401)
      .json({ error: "Token de autorização não fornecido" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.userId;

    // Verifica se a música pertence ao usuário
    const [rows] = await db2.query(
      `SELECT r.cliente_id FROM Musicas_Requisicao m
       JOIN Requisicoes r ON m.requisicao_id = r.requisicao_id
       WHERE m.id = ?`,
      [music_id]
    );

    if (rows.length === 0 || rows[0].cliente_id !== userId) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Exclui as entradas na tabela Status_ que referenciam a música
    await db2.query(`DELETE FROM Status_ WHERE music_id = ?`, [music_id]);

    // Elimina a música
    await db2.query(`DELETE FROM Musicas_Requisicao WHERE id = ?`, [music_id]);

    res.json({ message: "Música eliminada com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar música:", error);
    res.status(500).json({ error: "Erro ao eliminar música" });
  }
});

server.listen(8081, () => {
  console.log("Servidor HTTP rodando na porta 8081...");
});
