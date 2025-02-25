import "bootstrap-icons/font/bootstrap-icons.css";
import logo from "../../assets/logo.png";
import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // Certifique-se de que este pacote está instalado
import { BiArrowBack } from "react-icons/bi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Limpa a última sessão ao carregar a página de login
  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    axios
      .post(`${process.env.REACT_APP_BACKEND_URL}/login-venue`, {
        email,
        password,
      })
      .then((res) => {
        const { token } = res.data; // Recebe o token do servidor
        localStorage.setItem("token", token); // Armazena o token no localStorage

        // Decodifica o token para extrair os dados
        const decoded = jwtDecode(token);

        // Redireciona para o request manager com as informações do usuário no estado
        navigate("/request-manager");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          setMessage("Email ou senha incorretos");
        } else {
          setMessage("Erro ao tentar fazer login. Tente novamente.");
        }
      });
  }

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
          <button type="submit" className="btn">
            Login
          </button>
          {message && <p className="message">{message}</p>}
          <button className="back-button" onClick={() => navigate("/")}>
            <BiArrowBack size={24} /> Back
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
