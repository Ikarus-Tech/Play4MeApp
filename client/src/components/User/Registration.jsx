//import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../../assets/logo.png";
import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import { gapi } from "gapi-script";

export default function App() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const GOOGLE_CLIENT_ID= "95123885049-gssvaue3rorebrdfcobfc47oeu8pv8is.apps.googleusercontent.com"
  // Inicialização do GAPI
  useEffect(() => {
    const initClient = () => {
      gapi.load("client:auth2", () => {
        gapi.client.init({
          clientId: GOOGLE_CLIENT_ID,
          scope: "email profile",
        });
      });
    };
    initClient();

    // Limpa a última sessão ao carregar a página de login
    localStorage.removeItem("token");
  }, []);


  function handleSubmit(event) {
    event.preventDefault();
    
    axios.post('http://localhost:8081/register', { username, email, password })
      .then(res => {
        navigate('/login');
      })
      .catch(err => {
        // Define a mensagem de erro do backend no estado `message` se disponível
        if (err.response) {
          setMessage(err.response.data);
        } else {
          setMessage("Erro ao se conectar ao servidor");
        }
      });
  }

  // SignUp com Google
  const loginWithGoogle = () => {
    const auth2 = gapi.auth2.getAuthInstance();

    auth2.signIn().then(async (googleUser) => {
      const idToken = googleUser.getAuthResponse().id_token; // Obtém o ID Token

      try {
        const res = await axios.post("http://localhost:8081/google-login", {
          token: idToken, // Envia o ID Token para o backend
        });

        const { token } = res.data; // Token JWT gerado pelo backend
        const decodedToken = jwtDecode(token);
        const { userId, username } = decodedToken;

        localStorage.setItem("token", token);
        navigate("/home", { state: { username, userId } });
      } catch (error) {
        console.error("Erro ao autenticar com Google:", error);
        setMessage("Erro no login com o Google. Tente novamente.");
      }
    }).catch(error => {
      console.error("Erro ao fazer login com Google:", error);
      setMessage("Erro ao fazer login. Tente novamente.");
    });
  };

  return (
    <div className="auth-container">
      <img src={logo} alt="Play 4 Me Logo" />
      <h2>Get Started</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <i className="bi bi-person"></i>
          <input type="text" placeholder="Create your username" required
            onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="input-group">
          <i className="bi bi-envelope"></i>
          <input
            type="email"
            placeholder="Your email or phone number"
            required
            onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="input-group">
          <i className="bi bi-lock"></i>
          <input type="password" placeholder="Create your password" required
            onChange={e => setPassword(e.target.value)} />
        </div>

        <button type="submit" className="btn">
          Create Account
        </button>

        <p>{message}</p> {/* Mensagem de resposta do backend */}

        <p>Or using other method</p>

        <button
          type="button"
          className="btn btn-alt social-btns"
          onClick={() => loginWithGoogle()}
        >
          <i className="bi bi-google"></i> Sign Up with Google
        </button>

        <button type="button" className="btn btn-alt social-btns">
          <i className="bi bi-instagram"></i> Sign Up with Instagram
        </button>

        <p>
          Have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
