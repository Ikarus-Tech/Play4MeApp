import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/Playlist.css";
import { jwtDecode } from "jwt-decode"; // Certifique-se de importar corretamente

const Playlist = () => {
  const [musicas, setMusicas] = useState([]); // Músicas requisitadas
  const [loading, setLoading] = useState(true); // Controle de carregamento

  const fetchMusicas = async () => {
    try {
      const token = localStorage.getItem("token"); // Token JWT salvo
      if (!token) throw new Error("Token não encontrado.");

      // Decodifica o token JWT para acessar os dados no payload
      const decodedToken = jwtDecode(token);

      // Acessa o userId no token
      const userId = decodedToken.userId;

      if (!userId) throw new Error("user_id não encontrado no token.");

      // Faz a requisição para buscar as músicas
      const response = await fetch(
        `http://localhost:8081/getrequests?user_id=${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`, // Cabeçalho com token JWT
          },
        }
      );

      if (!response.ok) throw new Error("Erro ao carregar músicas.");

      const data = await response.json();
      const allMusicas = data.flatMap((req) =>
        req.musicas.map((musica) => ({
          ...musica,
          venueNome: req.venue.nome, // Adiciona o nome da venue
          dataRequisicao: req.data_requisicao, // Adiciona a data da requisição
        }))
      );
      setMusicas(allMusicas);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar músicas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMusicas();
  }, []);

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

  return (
    <div className="playlist-container">
      <ToastContainer /> {/* Notificações de erro */}
      <h2>Minhas Requisições</h2>
      {loading ? (
        <p>Carregando...</p>
      ) : musicas.length > 0 ? (
        <div className="playlist-grid">
          {musicas.map((musica) => (
            <div key={musica.id} className="music-item">
              <img
                src={musica.imagem || "https://via.placeholder.com/150"}
                alt={musica.nome}
                className="music-thumbnail"
              />
              <div className="music-details">
                <p className="music-title">{musica.nome}</p>
                <p className="music-status">
                  Estado: {musica.status_text || "Desconhecido"}
                </p>
                <p className="venue-name">Venue: {musica.venueNome}</p>
                <p className="request-date">
                  Data: {formatarData(musica.dataRequisicao)}
                </p>
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

export default Playlist;
