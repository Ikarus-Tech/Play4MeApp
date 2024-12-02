import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import bin from "../../assets/bin.png";
import astroThunder from "../../assets/astroThunder.jpeg";
import "boxicons/css/boxicons.min.css";
import "../../styles/HomeRequest.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState([]);
  const [selected, setSelected] = useState([]);
  const [serverResponse, setServerResponse] = useState(null);
  const navigate = useNavigate();
  const storedToken = localStorage.getItem("token");
  const [isSearching, setIsSearching] = useState(false);
  const [showAside, setShowAside] = useState(false);

  // Handle token expiration and user data
  useEffect(() => {
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setUsername(decodedToken.username);
          setUserId(decodedToken.userId); // Store userId from token
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

  // Toggle aside visibility
  const handleToggeAside = () => {
    setShowAside(!showAside);
  };

  // Handle music search
  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await axios.post("http://localhost:8081/search", {
        query: searchQuery,
      });
      setSongs(response.data);
      setServerResponse(null);
    } catch (error) {
      console.error("Erro ao buscar músicas:", error);
      toast.error("Erro ao buscar músicas. Tente novamente.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Enter key to search
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle song selection
  const handleSelectSong = (song) => {
    if (!selected.some((s) => s.id === song.id)) {
      setSelected([...selected, song]);
      setServerResponse(null);
    }
  };

  // Handle server request to send selected songs
  const handleRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      const venueId = 1; // Example venueId, can be dynamic
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

      setServerResponse(response.data);
      setSelected([]);
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
        <div className="search-container">
          <i
            className="bx bx-search-alt-2 search-icon"
            onClick={handleSearch}
          ></i>
          <input
            type="text"
            name="searchInput"
            id="searchInput"
            className="searchInput"
            placeholder="Pesquise uma música"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
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

      <aside className={`aside ${showAside ? "visible" : ""}`}>
        <button
          className="close-aside-button"
          onClick={() => setShowAside(false)}
        >
          ✖
        </button>
        <h3>
          {serverResponse ? "Resposta do Servidor" : "Músicas escolhidas"}
        </h3>
        {serverResponse ? (
          <div className="server-response">
            <p>
              {serverResponse.message || "Requisição processada com sucesso!"}
            </p>
          </div>
        ) : (
          selected.map((song, index) => (
            <div className="selected-song-item" key={index}>
              <img
                src={song.album.images[0]?.url || astroThunder}
                alt="Song"
                className="selectedSongImg"
              />
              <h4>{song.name}</h4>
              <div className="icon">
                <img src={bin} alt="Bin Icon" className="bin-icon" />
              </div>
            </div>
          ))
        )}
        <div id="request-button">
          <button onClick={handleRequest} disabled={selected.length === 0}>
            Requisitar
          </button>
        </div>
      </aside>

      {!showAside && (
        <button className="bottom-sheet-toggle" onClick={handleToggeAside}>
          Requisições
        </button>
      )}
    </div>
  );
}
