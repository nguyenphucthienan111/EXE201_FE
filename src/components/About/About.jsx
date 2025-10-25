import "../style/About.css";

export default function About() {
  return (
    <main className="about">
      {/* Our Mission */}
      <section className="about-hero">
        <h1>Our Mission</h1>
        <p>
          Our mission is to help students and individuals develop emotional
          awareness through daily journaling.
        </p>
        <button className="start-btn">Start Journaling</button>
      </section>

      <hr className="about-rule" />

      {/* Why We Built This */}
      <section className="about-built">
        <h2>Why We Built This</h2>
        <p>
          This project is student-led and inspired by growing mental health
          awareness. We believe a calmer, more reflective mind starts with a
          daily journal.
        </p>

        <div className="card-container">
          <div className="card">
            <img src="/empathy.png" alt="Empathy" className="card-img" />
            <div className="card-content">
              <h3>Empathy</h3>
              <p>
                We understand the pressures faced by students and wanted to
                create a supportive environment.
              </p>
            </div>
          </div>

          <div className="card">
            <img src="/privacy.png" alt="Privacy" className="card-img" />
            <div className="card-content">
              <h3>Privacy</h3>
              <p>
                We guaranteed by securing journals and AI analyses with
                encryption, ensuring that users feel safe to express their
                emotions honestly.
              </p>
            </div>
          </div>

          <div className="card">
            <img
              src="/transparency.png"
              alt="Transparency"
              className="card-img"
            />
            <div className="card-content">
              <h3>Transparency</h3>
              <p>
                We prevent misunderstandings and ensure users have realistic
                expectations of the technology.
              </p>
            </div>
          </div>
        </div>
      </section>
      <hr className="about-rule" />

      {/* Our Team */}
      <section className="about-team about-team-plain">
        <div className="team-avatar"></div>
        <div className="team-info">
          <h3>Our Team</h3>
          <p>
            Meet the passionate individuals dedicated to guiding you on this
            journey.
          </p>
        </div>
        <button className="team-btn">Learn More</button>
      </section>
    </main>
  );
}
