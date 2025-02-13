import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import RequestList from "./RequestList.jsx";
import Footer from "./Footer.jsx";
import "../../styles/RequestManager.css";
import "../../styles/Playlist.css"
import { ToastContainer, toast } from "react-toastify";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8081";

function RequestManager() {
  const [userId, setUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para o campo de pesquisa
  const navigate = useNavigate();
  const requestListRef = useRef(null); // Ref para o componente RequestList
  const socketRef = useRef(null); // Ref para manter a instância do socket

  // Verificar token de autenticação e setar o userId
  useEffect(() => {
    const checkToken = () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp < currentTime) {
            localStorage.removeItem("token");
            navigate("/login-venue");
            toast.error("Sessão expirada. Faça login novamente.");
          } else {
            setUserId(decodedToken.id);
          }
        } catch (error) {
          console.error("Erro ao decodificar o token:", error);
          localStorage.removeItem("token");
          navigate("/login-venue");
        }
      } else {
        navigate("/login-venue");
      }
    };

    checkToken();
  }, [navigate]);

  // Configurar socket para se conectar e escutar eventos
  useEffect(() => {
    if (userId) {
      const socket = io(SOCKET_URL);

      socketRef.current = socket; // Salvar a instância do socket

      socket.on("connect", () => {
        console.log("Conectado ao servidor:", socket.id);

        const roomId = `venue-${userId}`;
        socket.emit("join-room", roomId); // Entrar na sala
        console.log(`Solicitação para entrar na sala: ${roomId}`);
      });

      socket.on("new-request", (newRequest) => {
        console.log("Nova requisição recebida no frontend:", newRequest);

        // Atualizar lista de solicitações no RequestList
        if (requestListRef.current?.handleUpdateRequest) {
          requestListRef.current.handleUpdateRequest(newRequest);
        }

        // Gerar uma chave única com base no ID da requisição
        const toastKey = `request-toast-${newRequest.requisicaoId}`;

        // Evitar duplicidade de Toasts
        if (!toast.isActive(toastKey)) {
          toast.info(`Nova solicitação: ${newRequest.clienteNome}`, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            toastId: toastKey, // Passa uma chave única para evitar duplicidade
          });
        }

      });

      socket.on("disconnect", () => {
        console.log("Desconectado do servidor:");
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          console.log("Socket desconectado ao desmontar componente.");
        }
      };
    }
  }, [userId]);

  // Função para filtrar as requisições com base no nome do cliente
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="Requests">
      <div className="search-bar-container">
        {/* Barra de pesquisa para o nome do cliente */}
        <input
          type="text"
          placeholder="Pesquisar por nome do cliente..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="search-bar"
        />
        <button
          className="playlist-icon"
          onClick={() => navigate("/playlist")}
        >
          <img
            src={require("../../assets/playlist.png")}
            alt="Playlist Icon"
            style={{ width: "24px", height: "24px" }}
          />
        </button>
      </div>
      {/* Passa o filtro de pesquisa para a lista de requisições */}
      <RequestList ref={requestListRef} userId={userId} searchTerm={searchTerm} />
      <Footer />
      <ToastContainer />
    </div>
  );
}

export default RequestManager;
