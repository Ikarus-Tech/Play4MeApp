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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
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
