import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import RequestItem from "./RequestItem";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8081";

const RequestList = forwardRef(({ userId }, ref) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar as requisições
  const fetchRequests = async () => {
    try {
      const response = await axios.get("http://localhost:8081/getrequests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRequests(response.data);
    } catch (err) {
      console.error("Erro ao buscar requisições:", err);
      setError("Não foi possível carregar as requisições.");
    } finally {
      setLoading(false);
    }
  };

  // Buscar as requisições ao montar o componente
  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateRequest = (updatedRequest) => {
    // Recarregar as requisições após uma nova requisição ser recebida
    fetchRequests(); // Chama o fetchRequests para garantir que a lista seja atualizada com os novos dados
  };

  // Expor a função handleUpdateRequest via ref
  useImperativeHandle(ref, () => ({
    handleUpdateRequest,
  }));

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="request-list">
      {requests
        .map((request) => {
          const pendingMusicas = request.musicas.filter(
            (musica) => musica.status_text === "PENDING"
          );

          if (pendingMusicas.length === 0) {
            return null;
          }

          return (
            <RequestItem
              key={request.requisicao_id}
              request={{ ...request, musicas: pendingMusicas }}
              onUpdateRequest={handleUpdateRequest}
            /> 
          );
        })
        .filter(Boolean)}
    </div>
  );
});

export default RequestList;
