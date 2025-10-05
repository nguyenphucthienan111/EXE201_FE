import { useNavigate } from "react-router-dom";
import diaryImg from "../../assets/diary.png";
import "../style/Hero.css";

function Hero() {
  const navigate = useNavigate();

  const handleStart = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // đã login → sang trang journal
      navigate("/journal");
    } else {
      // chưa login → sang trang login
      navigate("/login");
    }
  };

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero-text">
          <h1>Track Your Mind, One Entry at a Time</h1>
          <p>AI-powered daily mood tracking and insights</p>
          <button onClick={handleStart}>Start Journaling</button>
        </div>
        <div className="hero-img">
          <img src={diaryImg} alt="Diary illustration" />
        </div>
      </div>
    </section>
  );
}

export default Hero;
