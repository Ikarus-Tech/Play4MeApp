import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Hook para navegação
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/Playlist.css";
import { jwtDecode } from "jwt-decode"; // Decodificação do token JWT
import { io } from "socket.io-client"; // Biblioteca Socket.IO
import { useRequest } from "../../context/RequestContext"; // Importa o contexto

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8081";

const MyRequests = () => {
  const [musicas, setMusicas] = useState([]); // Músicas requisitadas
  const [loading, setLoading] = useState(true); // Controle de carregamento
  const [searchTerm, setSearchTerm] = useState(""); // Estado para o campo de pesquisa
  const socketRef = useRef(null); // Referência para o socket
  const navigate = useNavigate(); // Hook para navegação

  const { state, dispatch } = useRequest(); // Usa o contexto global

  // Função para buscar músicas requisitadas
  const fetchMusicas = async () => {
    try {
      const token = localStorage.getItem("token"); // Token JWT salvo
      if (!token) throw new Error("Token não encontrado.");

      // Decodifica o token JWT para acessar os dados no payload
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      if (!userId) throw new Error("user_id não encontrado no token.");

      // Faz a requisição para buscar as músicas
      const response = await fetch(
        `http://localhost:8081/getrequests?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Erro ao carregar músicas.");

      const data = await response.json();
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const allMusicas = data.flatMap((req) =>
        req.musicas
          .filter((musica) => new Date(req.data_requisicao) >= twoWeeksAgo)
          .map((musica) => ({
            ...musica,
            venueNome: req.venue.nome, // Adiciona o nome da venue
            dataRequisicao: req.data_requisicao, // Adiciona a data da requisição
            dataResposta: musica.data_resposta || null, // Adiciona a data da resposta para ordenação
            played: !!musica.played, // Converte o campo played para booleano
            comentario: musica.comentario || "", // Adiciona o comentário da venue
          }))
      );

      // Ordena as músicas pela dataResposta mais recente
      allMusicas.sort((a, b) => {
        const dateA = new Date(a.dataResposta || a.dataRequisicao);
        const dateB = new Date(b.dataResposta || b.dataRequisicao);
        return dateB - dateA; // Ordena da mais recente para a mais antiga
      });

      setMusicas(allMusicas);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar músicas.");
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar a data da requisição
  const formatarData = (data) => {
    const date = new Date(data);
    return date.toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Função para eliminar uma música
  const handleDeleteMusic = async (musicId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8081/delete-music`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ music_id: musicId }),
      });

      if (!response.ok) throw new Error("Erro ao eliminar música.");

      // Atualiza a lista de músicas após a eliminação
      setMusicas((prevMusicas) =>
        prevMusicas.filter((musica) => musica.id !== musicId)
      );

      toast.success("Música eliminada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao eliminar música.");
    }
  };

  // Conectar-se ao WebSocket para receber atualizações em tempo real
  useEffect(() => {
    fetchMusicas();

    // Conectar ao WebSocket
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on("connect", () => {
      console.log("Conectado ao servidor:", socketRef.current.id);
      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      const roomId = `user-${userId}`;

      socketRef.current.emit("join-room", roomId);
      console.log(`Entrando na sala: ${roomId}`);
    });

    // Ouvir por atualizações de música (aceita ou rejeitada)
    socketRef.current.on("music-action-response", (response) => {
      console.log("Resposta recebida:", response);
      const { message, music_id, status_text, data_resposta, comentario } =
        response;

      // Atualiza o estado da música conforme a resposta do servidor
      setMusicas((prevMusicas) => {
        const updatedMusicas = prevMusicas.map((musica) =>
          musica.id === music_id
            ? {
                ...musica,
                status_text,
                dataResposta: data_resposta,
                comentario,
              }
            : musica
        );

        // Reordena após atualização
        updatedMusicas.sort((a, b) => {
          const dateA = new Date(a.dataResposta || a.dataRequisicao);
          const dateB = new Date(b.dataResposta || b.dataRequisicao);
          return dateB - dateA;
        });

        return updatedMusicas;
      });

      // Exibe uma notificação
      toast.success(message, { position: "top-right", autoClose: 5000 });
    });

    // Ouvir por notificações de música tocada
    socketRef.current.on("music-played", (response) => {
      console.log("Notificação de música tocada recebida:", response);
      const { message, music_id } = response;

      // Atualiza o estado da música para tocada
      setMusicas((prevMusicas) => {
        const updatedMusicas = prevMusicas.map((musica) =>
          musica.id === music_id ? { ...musica, played: true } : musica
        );

        return updatedMusicas;
      });

      // Exibe uma notificação
      toast.success(message, { position: "top-right", autoClose: 5000 });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        console.log("Socket desconectado.");
      }
    };
  }, []);

  // Função para lidar com o botão de voltar
  const handleBackClick = () => {
    // Navega para a página inicial
    navigate("/home");
  };

  // Função para traduzir o estado
  const traduzirEstado = (estado) => {
    switch (estado.toLowerCase()) {
      case "approve":
        return "Aprovado";
      case "deny":
        return "Rejeitado";
      case "pending":
        return "Pendente";
      default:
        return "Desconhecido";
    }
  };

  // Filtra as músicas com base na pesquisa
  const filteredMusicas = musicas.filter((musica) =>
    musica.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="playlist-container">
      <ToastContainer />

      {/* Botão de voltar */}
      <button className="back-button" onClick={handleBackClick}>
        ← Voltar
      </button>

      <h2>Minhas Requisições</h2>

      {/* Barra de pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar música..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="search-bar"
      />

      {loading ? (
        <p>Carregando...</p>
      ) : filteredMusicas.length > 0 ? (
        <div className="playlist-grid">
          {filteredMusicas.map((musica) => (
            <div
              key={musica.id}
              className={`music-item ${musica.played ? "played" : ""}`}
            >
              <img
                src={musica.imagem || "https://via.placeholder.com/150"}
                alt={musica.nome}
                className="music-thumbnail"
              />
              <div className="music-details">
                <p className="music-title">{musica.nome}</p>
                <p className="venue-name">Venue: {musica.venueNome}</p>
                <p className="request-date">
                  <strong>Requisitado em:</strong>{" "}
                  {formatarData(musica.dataRequisicao)}
                </p>
                {musica.comentario && (
                  <p className="music-comment">
                    <strong>Comentário:</strong> {musica.comentario}
                  </p>
                )}
                <div className="music-status-container">
                  <p
                    className={`music-status ${musica.status_text.toLowerCase()}`}
                  >
                    {traduzirEstado(musica.status_text)}
                  </p>
                  {musica.status_text.toLowerCase() !== "deny" &&
                    (musica.played ? (
                      <i className="fas fa-music music-played-icon"></i>
                    ) : (
                      <i className="fas fa-clock music-not-played-icon"></i>
                    ))}
                  {(musica.status_text.toLowerCase() === "approve" ||
                    musica.status_text.toLowerCase() === "deny") && (
                    <i
                      className="fas fa-trash-alt music-delete-icon"
                      onClick={() => handleDeleteMusic(musica.id)}
                    ></i>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Nenhuma música encontrada!</p>
      )}
    </div>
  );
};

export default MyRequests;
