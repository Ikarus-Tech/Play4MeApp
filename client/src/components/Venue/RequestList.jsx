import React, { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import axios from "axios";
import RequestItem from "./RequestItem";

const RequestList = forwardRef(({ userId, searchTerm }, ref) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar as requisições com base no userId (da venue)
  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/getrequests?venue_id=${userId}`, {
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

  useEffect(() => {
    if (userId) {
      fetchRequests(); // Passar o userId para buscar as requisições relacionadas ao usuário (da venue)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateRequest = (updatedRequest) => {
    // Recarregar as requisições após uma nova requisição ser recebida
    fetchRequests(); // Chama o fetchRequests para garantir que a lista seja atualizada com os novos dados
  };

  // Expor a função handleUpdateRequest via ref
  useImperativeHandle(ref, () => ({
    handleUpdateRequest,
  }));

  // Função para filtrar as requisições com base no nome do cliente
  const filteredRequests = requests.filter((request) =>
    request.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="request-list">
      {filteredRequests
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
