import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'boxicons/css/boxicons.min.css';
import '../index.css';

function RoleSelection() {
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    if (role === 'client') {
      navigate('/login');  // Rota para login de cliente
    } else if (role === 'venue-manager') {
      navigate('/login-venue');  // Rota para login de gestor de local de eventos
    }
  };

  return (
    <div className="role-selection-container">
      <h1>Como deseja aproveitar nosso serviço?</h1>
      <div className="role-card" onClick={() => handleRoleSelect('client')}>
        <i className="bx bx-user"></i>
        <h2>Cliente</h2>
        <p>Solicite músicas e personalize a playlist do evento.</p>
      </div>
      <div className="role-card" onClick={() => handleRoleSelect('venue-manager')}>
        <i className="bx bx-building-house"></i>
        <h2>Gestor de Local</h2>
        <p>Gerencie as solicitações e personalize a experiência musical.</p>
      </div>
    </div>
  );
}

export default RoleSelection;
