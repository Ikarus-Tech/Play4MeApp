import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import play4meLogo from "../../assets/logo.png";
import "boxicons/css/boxicons.min.css";
import styles from "../../styles/VenueProfile.module.css";

export default function VenueProfile() {
  const navigate = useNavigate();

  const handleRequestSong = () => {
    navigate("/home");
  };

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        
        {/*<div className={styles.searchContainer}>
          <i className={`bx bx-search-alt-2 ${styles.searchIcon}`}></i>
          <input
            type="text"
            placeholder="Encontre o melhor local"
            className={styles.searchInput}
          />
        </div>*/}
      </header>

      <section className={styles.heroSection}>
        <div className={styles.profileDescription}>
          <img src={play4meLogo} alt="Cais 66" id={styles.cais66Image} />
          
          <div className={styles.venueProfileDescription}>
            <h1>Play 4 Me</h1>
            
            <div className={styles.paragraph}>
              <p>
                Bem vindo a conta oficial da Play4Me. Aqui você pode requisitar músicas e nos tocamos para você. Divirta-se!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.requestAndTipWrapper}>
        <button onClick={handleRequestSong}>Request a song</button>
        {/* <button>Send a "Thank You" tip</button> */}
      </section>

      {/*<section className={styles.livePlace}>
        <h1 className={styles.pin}>Cais 66 está em live agora</h1>
      </section>

      <div className={styles.liveDescription}>
        <div className={styles.liveDescriptionContent}>
          <img src={cais66Image} alt="Cais 66" />
          <h2>Descrição da live/Sessão</h2>
          <h3>Género &gt; Afro</h3>
          <h3>Tocando &gt; Nome da música </h3>
        </div>
      </div>*/}

      <footer>
        <p>Termos & Condições</p>
        <p>Todos os direitos reservados a Play 4 Me</p>
      </footer>
    </main>
  );
}