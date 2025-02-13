import React from "react";
import PropTypes from "prop-types";
import "../../styles/Modal.css";

const Modal = ({ isOpen, onClose, onSubmit, title, placeholder }) => {
  const [comment, setComment] = React.useState("");

  const handleSubmit = () => {
    if (comment.trim()) {
      onSubmit(comment);
      setComment(""); // Reseta o campo de comentário
      onClose(); // Fecha o modal
    } else {
      alert("Por favor, insira um comentário!");
    }
  };

  const handleReadyResponse = (response) => {
    setComment(response);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        <div className="ready-responses">
          <button onClick={() => handleReadyResponse("Boa escolha!")}>
            Boa escolha!
          </button>
          <button onClick={() => handleReadyResponse("Ótimo!")}>Ótimo!</button>
          <button onClick={() => handleReadyResponse("Excelente!")}>
            Excelente!
          </button>
          <button
            className="negative"
            onClick={() => handleReadyResponse("Não gostei.")}
          >
            Não gostei.
          </button>
          <button
            className="negative"
            onClick={() => handleReadyResponse("Péssima escolha.")}
          >
            Péssima escolha.
          </button>
          <button
            className="negative"
            onClick={() => handleReadyResponse("Não é o meu estilo.")}
          >
            Não é o meu estilo.
          </button>
        </div>
        <textarea
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-submit" onClick={handleSubmit}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
};

export default Modal;
