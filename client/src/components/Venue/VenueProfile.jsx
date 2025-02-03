import logo from "../../assets/logo.png";
import profileIcon from "../../assets/profileIcon.png";
import havingFunImage from "../../assets/havingFunImage.webp";
import "boxicons/css/boxicons.min.css";
import styles from "../../styles/VenueProfile.module.css";

export default function VenueProfile() {
  return (
    <main>
      <img src={logo} alt="Play 4 me Logo" id={styles.logo} />
      <header>
        <div className={styles.searchContainer}>
          <i className={`bx bx-search-alt-2 ${styles.searchIcon}`}></i>
          <input
            type="text"
            placeholder="Encontre o melhor local"
            className={styles.searchInput}
          />
        </div>
        <div className={styles.iconsContainer}>
          <i className={`bx bx-bell ${styles.icon}`}></i>
          <img
            src={profileIcon}
            id={styles.profileIcon}
            alt="Profile Icon"
          ></img>
        </div>
      </header>

      <section className={styles.heroSection}></section>
      <div className={styles.profileDescription}>
        <div>
          <img src={havingFunImage} alt="..." id={styles.havingFunImage} />
          <div className={styles.followBtn}>
            <button>Follow</button>
          </div>
        </div>
        <div className={styles.venueProfileDescription}>
          <h1>DJ Plutônio</h1>
          <div className={styles.flAndRq}>
            <div className={styles.followers}>
              <h3>Followers</h3>
              <h1>50K</h1>
            </div>
            <div className={styles.requests}>
              <h3>Requests</h3>
              <h1>100</h1>
            </div>
          </div>
          <div className = {styles.paragraph}>
            <p>
              Lorem, ipsum dolor sit amet consectetur adipisicing elit.
              Voluptatibus reiciendis beatae laudantium, ab itaque quaerat
              obcaecati tenetur earum debitis unde distinctio iusto voluptatem
              fuga quos praesentium molestiae! Veniam, ex facere.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
