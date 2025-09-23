import diaryImg from "../../assets/diary.png";
import "../style/Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero-text">
          <h1>Track Your Mind, One Entry at a Time</h1>
          <p>AI-powered daily mood tracking and insights</p>
          <button>Start Journaling</button>
        </div>
        <div className="hero-img">
          <img src={diaryImg} alt="Diary illustration" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
