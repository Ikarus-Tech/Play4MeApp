import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../styles/Playlist.css";

const Playlist = () => {
  const [musicas, setMusicas] = useState([]); // Músicas aprovadas
  const [loading, setLoading] = useState(true); // Controle de carregamento

  const fetchMusicas = async () => {
    try {
      const token = localStorage.getItem("token"); // Token JWT salvo
      if (!token) throw new Error("Token não encontrado.");

      const response = await fetch("http://localhost:8081/getrequests", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Cabeçalho com token JWT
        },
      });

      if (!response.ok) throw new Error("Erro ao carregar músicas.");

      const data = await response.json();
      const approvedMusicas = data.flatMap((req) =>
        req.musicas.filter((musica) => musica.status_text === "approve")
      );
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


  return (
    <div className="playlist-container">
      <ToastContainer /> {/* Notificações de erro */}
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
