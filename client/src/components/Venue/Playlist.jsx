import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/Playlist.css";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom"; // Hook para navegação

const Playlist = () => {
  const [musicas, setMusicas] = useState([]); // Músicas aprovadas
  const [loading, setLoading] = useState(true); // Controle de carregamento
  const navigate = useNavigate();

  const fetchMusicas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token não encontrado.");

      const decodedToken = jwtDecode(token);
      const venueId = decodedToken.id;
      if (!venueId) throw new Error("venue_id não encontrado no token.");

      const response = await fetch(`http://localhost:8081/getrequests?venue_id=${venueId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao carregar músicas.");

      const data = await response.json();

      // Filtra apenas músicas aprovadas
      const approvedMusicas = data.flatMap((req) =>
        req.musicas
          .filter((musica) => musica.status_text === "approve")
          .map((musica) => ({
            ...musica,
            dataResposta: new Date(musica.data_resposta), // Converte a data para Date
          }))
      );

      // Ordena pela data de resposta mais recente
      approvedMusicas.sort((a, b) => b.dataResposta - a.dataResposta);

      setMusicas(approvedMusicas);
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

  const handleBackClick = () => {
    navigate("/request-manager");
  };

  return (
    <div className="playlist-container">
      <ToastContainer />

      {/* Botão de voltar */}
      <button className="back-button" onClick={handleBackClick}>
        ← Voltar
      </button>

      <h2>Playlist</h2>

      {loading ? (
        <p>Carregando...</p>
      ) : musicas.length > 0 ? (
        musicas.map((musica) => {
          const duracaoEmSegundos = Math.floor(musica.duracao / 1000); // Converte milissegundos para segundos

          return (
            <div key={musica.id} className="music-item">
              <img
                src={musica.imagem || "https://via.placeholder.com/50"}
                alt={musica.nome}
                className="music-thumbnail"
              />
              <div className="music-details">
                <p className="music-title">{musica.nome}</p>
                <p>
                  Duração: {Math.floor(duracaoEmSegundos / 60)}:
                  {String(duracaoEmSegundos % 60).padStart(2, "0")} min
                </p>
              </div>
            </div>
          );
        })
      ) : (
        <p>Playlist vazia!</p>
      )}
    </div>
  );
};

export default Playlist;
