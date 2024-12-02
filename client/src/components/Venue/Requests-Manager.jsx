import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";
import "react-toastify/dist/ReactToastify.css";
import SearchBar from "./SearchBar.jsx";
import RequestList from "./RequestList.jsx";
import Footer from "./Footer.jsx";
import "../../styles/RequestManager.css";
import { ToastContainer, toast } from "react-toastify";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8081";

function RequestManager() {
  const [userId, setUserId] = useState(null);
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

  return (
    <div className="Requests">
      <div className="search-bar-container">
        <SearchBar userId={userId} />
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
      <RequestList ref={requestListRef} userId={userId} />
      <Footer />
      <ToastContainer />
    </div>
    
  );
}

export default RequestManager;
