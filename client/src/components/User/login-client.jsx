//import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Corrigindo a importação do jwtDecode
import logo from "../../assets/logo.png";
import "bootstrap-icons/font/bootstrap-icons.css";
import { gapi } from "gapi-script";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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

  // Login tradicional
  const handleSubmit = (event) => {
    event.preventDefault();
    axios
      .post("http://localhost:8081/login", { email, password })
      .then((res) => {
        const { token } = res.data;
        const decodedToken = jwtDecode(token);
        const { userId, username } = decodedToken;

        localStorage.setItem("token", token);
        navigate("/home", { state: { username, userId } });
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          setMessage("Email ou senha incorretos");
        } else {
          setMessage("Erro ao tentar fazer login. Tente novamente.");
        }
      });
  };

  // Função para login com Google
  const loginWithGoogle = () => {
    const auth2 = gapi.auth2.getAuthInstance();
  
    auth2.signIn({ prompt: "select_account" }).then(async (googleUser) => {  
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
    <div className="auth">
      <div className="auth-container">
        <img src={logo} alt="Play 4 Me Logo" />
        <h2>Welcome Back</h2>
        <p>Please login with registered account</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <i className="bi bi-envelope"></i>
            <input
              type="email"
              placeholder="Email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <i className="bi bi-lock"></i>
            <input
              type="password"
              placeholder="Password"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Login</button>
          {message && <p className="message">{message}</p>}
          <p>Or using other method</p>
          <button
            type="button"
            className="btn btn-alt social-btns"
            onClick={() => loginWithGoogle()}
          >
            <i className="bi bi-google"></i> Sign Up with Google
          </button>
          <p>
            Don&apos;t have an account? <Link to="/regist">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
