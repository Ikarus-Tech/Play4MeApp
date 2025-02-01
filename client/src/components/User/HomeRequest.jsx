import { jwtDecode } from "jwt-decode";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRequest } from "../../context/RequestContext"; // Importando o hook do contexto
import axios from "axios";
import { io } from "socket.io-client";
import bin from "../../assets/bin.png";
import astroThunder from "../../assets/astroThunder.jpeg";
import "boxicons/css/boxicons.min.css";
import "../../styles/HomeRequest.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:8081";

export default function HomeRequest() {
  const { state, dispatch } = useRequest(); // Acessando o estado global do contexto
  const { searchQuery, songs, selected, serverResponse } = state;
  const navigate = useNavigate();
  const storedToken = localStorage.getItem("token");
  const [isSearching, setIsSearching] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const socketRef = useRef(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setUserId(decodedToken.userId);
        }
      } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [storedToken, navigate]);

  useEffect(() => {
    if (userId) {
      const socket = io(SOCKET_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        const roomId = `user-${userId}`;
        socket.emit("join-room", roomId);
      });

      socket.on("music-action-response", (response) => {
        toast.success(response.message, { position: "top-right", autoClose: 5000 });
      });

      socket.on("disconnect", () => {
        console.log("Desconectado do servidor");
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [userId]);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const deleteSelectedSong = (id) => {
    dispatch({ type: "REMOVE_SONG", payload: id });
    toast.info("Música removida da lista!");
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await axios.post("http://localhost:8081/search", {
        query: searchQuery,
      });
      dispatch({ type: "SET_SONGS", payload: response.data });
    } catch (error) {
      console.error("Erro ao buscar músicas:", error);
      toast.error("Erro ao buscar músicas. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelectSong = (song) => {
    dispatch({ type: "ADD_SONG", payload: song });
    toast.success(`"${song.name}" adicionada à lista de requisições!`);
  };

  const handleRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      const venueId = 1;
      console.log(selected)
      const response = await axios.post(
        "http://localhost:8081/request",
        {
          cliente_id: userId,
          venue_id: venueId,
          musicas: selected,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      dispatch({ type: "SET_SERVER_RESPONSE", payload: response.data });
      dispatch({ type: "RESET_SELECTED" });
      toast.success(response.data.message || "Requisição enviada!");
    } catch (error) {
      console.error("Erro ao enviar músicas:", error);
      toast.error("Erro ao enviar requisição. Tente novamente.");
    }
  };

  return (
    <div className="app-container">
      <ToastContainer />
      <main className="main-content">
        <div className="app-nav">
          <div className="search-container">
            <i
              className="bx bx-search-alt-2 search-icon"
              onClick={handleSearch}
            ></i>
            <input
              type="text"
              className="searchInput"
              placeholder="Pesquise uma música"
              value={searchQuery}
              onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="requests">
            <button
              className="playlist-icon"
              onClick={() => navigate("/my-requests")}
            >
              <img
                src={require("../../assets/playlist.png")}
                alt="Playlist Icon"
                style={{ width: "24px", height: "24px" }}
              />
            </button>
            <i
              className="bx bx-menu menu-icon"
              onClick={toggleSidebar}
              style={{ cursor: "pointer" }}
            ></i>
          </div>
        </div>

        <ul className="musicList">
          {isSearching ? (
            <span>Pesquisando...</span>
          ) : songs.length > 0 ? (
            songs.map((song, index) => (
              <li
                key={index}
                onClick={() => handleSelectSong(song)}
                className="music-cover"
              >
                <img
                  src={song.album.images[0]?.url}
                  alt="Song Cover"
                  className="cover-image"
                />
                <h3>{song.name}</h3>
                <p>{song.artists.map((artist) => artist.name).join(", ")}</p>
              </li>
            ))
          ) : (
            <span></span>
          )}
        </ul>
      </main>

      <div className={`sidebar ${showSidebar ? "show" : ""}`}>
        <div className="sidebar-header">
          <h3>Músicas escolhidas</h3>
          <button className="close-sidebar" onClick={toggleSidebar}>
            ✖
          </button>
        </div>
        <div className="sidebar-content">
          {selected.length > 0 ? (
            selected.map((song, index) => (
              <div className="selected-song-item" key={index}>
                <img
                  src={song.album.images[0]?.url || astroThunder}
                  alt="Song"
                  className="selectedSongImg"
                />
                <h4>{song.name}</h4>
                <button
                  className="delete-button"
                  onClick={() => deleteSelectedSong(song.id)}
                >
                  <img className="bin-icon" src={bin} alt="Excluir" />
                </button>
              </div>
            ))
          ) : (
            <p>Nenhuma música selecionada</p>
          )}
        </div>
        <button
          onClick={handleRequest}
          disabled={selected.length === 0}
          className="request-button"
        >
          Requisitar
        </button>
      </div>
    </div>
  );
}
