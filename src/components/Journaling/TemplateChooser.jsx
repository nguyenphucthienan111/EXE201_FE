import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../style/TemplateChooser.css";

const classicTemplates = [
  {
    id: "classic-1",
    name: "Classic",
    desc: "A clean, timeless journaling style.",
    cover: "https://marketplace.canva.com/EAGtUFqJe6Q/1/0/1131w/canva-beige-brown-vintage-blank-notes-border-a4-document-9UK8wnBq8HQ.jpg",
  },
  {
    id: "classic-2",
    name: "Classic",
    desc: "A clean, timeless journaling style.",
    cover: "https://i.pinimg.com/736x/e6/a3/dc/e6a3dc100799f4bee37b0e1fda4d4a24.jpg",
  },
  {
    id: "classic-3",
    name: "Classic",
    desc: "A clean, timeless journaling style.",
    cover: "https://i.pinimg.com/474x/32/75/e2/3275e21bd1f675c975a7ed00fdfcd4d6.jpg",
  },
];

export default function TemplateChooser() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);

  const handleStart = () => {
    if (selected) {
      navigate(`/journal/create?template=${selected}`);
    } else {
      alert("Please select a template first!");
    }
  };

  return (
    <div className="tpl-root">
      <div className="tpl-hero">
        <h1>Choose Your Journal Template</h1>
        <p>Select your favorite journal style and start your creative journey.</p>
        <button className="tpl-btn" onClick={handleStart}>
          Get Started
        </button>
      </div>
      

      {/* Title Badge */}
      <div className="tpl-titleBadge">Classic</div>

      <div className="tpl-grid">
        {classicTemplates.map((t) => (
          <article
            key={t.id}
            className={`tpl-card ${selected === t.id ? "is-selected" : ""}`}
            onClick={() => setSelected(t.id)}
          >
            <div className="tpl-img">
              <img src={t.cover} alt={`${t.name} cover`} />
            </div>
            <div className="tpl-caption">
              <span className="tpl-label">{t.name}</span>
              <h4 className="tpl-desc">{t.desc}</h4>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
