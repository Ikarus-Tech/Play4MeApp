import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "./Modal.jsx"; // Importando o modal
import "../../styles/RequestItem.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RequestItem = ({ request, onUpdateRequest }) => {
  const { cliente, musicas, data_requisicao } = request;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMusica, setSelectedMusica] = useState(null);
  const [currentAction, setCurrentAction] = useState(null); // Aprovar ou Negar

  const handleOpenModal = (musica, action) => {
    setSelectedMusica(musica);
    setCurrentAction(action);
    setIsModalOpen(true);
  };

  const handleSubmitComment = async (comment) => {
    const statusText = currentAction === "approve" ? "approve" : "deny";

    try {
      const response = await fetch("http://localhost:8081/process-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          music_id: selectedMusica.id, // Identificador da música
          status_text: statusText, // Texto do status ("approve" ou "deny")
          comentario: comment, // Comentário fornecido pelo usuário
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Notificar com base na ação realizada
        const actionMessage =
          statusText === "approve" ? "Música Adicionada a Playlist!" : "Música Rejeitada!";
        toast.success(actionMessage);

        // Atualizar a requisição com a música aprovada ou negada
        onUpdateRequest({
          ...request,
          musicas: request.musicas.map((musica) =>
            musica.id === selectedMusica.id
              ? { ...musica, status_text: statusText }
              : musica
          ),
        });
      } else {
        toast.error(result.message || "Algo deu errado. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao enviar o status:", error);
      toast.error("Erro ao processar a ação. Verifique sua conexão.");
    } finally {
      setIsModalOpen(false); // Fechar o modal após a tentativa
    }
  };

  return (
    <div className="request-item">
      {/* Modal para aprovar ou negar com comentário */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitComment}
        title={`${currentAction === "approve" ? "Aprovar" : "Negar"
          } Música`}
        placeholder="Insira seu comentário..."
      />

      {/* Cabeçalho da requisição */}
      <div className="request-header">
        <div className="request-avatar">
          <div className="avatar-placeholder">
            {cliente.nome.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="user-info">
          <p>
            <strong>{cliente.nome}</strong>
          </p>
        </div>
      </div>

      {/* Lista de músicas requisitadas */}
      <div className="music-list">
        <h4>Músicas Requisitadas:</h4>
        {musicas.length > 0 ? (
          musicas.map((musica, index) => {
            const duracaoEmSegundos = Math.floor(musica.duracao / 1000); // Converte milissegundos para segundos

            return (
              <div key={index} className="music-item">
                <img
                  src={musica.imagem || "https://via.placeholder.com/50"}
                  alt={musica.nome}
                  className="music-thumbnail"
                />
                <div className="music-details">
                  <p>
                    <strong>Nome:</strong> {musica.nome}
                  </p>
                  <p>
                    Duração: {Math.floor(duracaoEmSegundos / 60)}:
                    {String(duracaoEmSegundos % 60).padStart(2, "0")} min
                  </p>
                </div>
                <div className="music-actions">
                  <button
                    className="approve"
                    onClick={() => handleOpenModal(musica, "approve")}
                  >
                    ✓
                  </button>
                  <button
                    className="deny"
                    onClick={() => handleOpenModal(musica, "deny")}
                  >
                    ✗
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p>Sem músicas nesta requisição.</p>
        )}
      </div>

      {/* Rodapé da requisição */}
      <div className="request-footer">
        <p>
          <strong>Data da Requisição:</strong>{" "}
          {new Date(data_requisicao).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

RequestItem.propTypes = {
  request: PropTypes.shape({
    cliente: PropTypes.shape({
      nome: PropTypes.string.isRequired,
    }).isRequired,
    musicas: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired, // ID da música
        nome: PropTypes.string.isRequired,
        imagem: PropTypes.string,
        duracao: PropTypes.number.isRequired,
      })
    ).isRequired,
    data_requisicao: PropTypes.string.isRequired,
  }).isRequired,
  onUpdateRequest: PropTypes.func.isRequired, // Callback para atualizar a requisição
};

export default RequestItem;
