// src/components/Template/TemplateChooser.jsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getTemplates } from "../../services/templateService";
import "../style/TemplateChooser.css";

export default function TemplateChooser() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("free"); // free | premium

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      setError("");
      try {
        const res = await getTemplates();
        setTemplates(res?.data || []);
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  const handleStart = () => {
    if (selected) {
      navigate(`/journal/create?template=${selected}`);
    } else {
      alert("Please select a template first!");
    }
  };

  const filteredTemplates = templates.filter(
    (t) => t.category?.toLowerCase() === activeTab
  );

  return (
    <div className="tpl-root">
      <div className="tpl-hero">
        <h1>Choose Your Journal Template</h1>
        <p>Select your favorite journal style and start your creative journey.</p>
        <button className="tpl-btn" onClick={handleStart}>
          Get Started
        </button>
      </div>

      {/* Tabs */}
      <div className="tpl-tabs">
        <button
          className={`tpl-tab ${activeTab === "free" ? "is-active" : ""}`}
          onClick={() => setActiveTab("free")}
        >
          Free Templates
        </button>
        <button
          className={`tpl-tab ${activeTab === "premium" ? "is-active" : ""}`}
          onClick={() => setActiveTab("premium")}
        >
          Premium Templates
        </button>
      </div>

      {loading && <div className="tpl-empty">Loading templates…</div>}
      {error && <div className="tpl-empty" style={{ color: "#b33" }}>{error}</div>}

      {!loading && !error && (
        <div className="tpl-grid">
          {filteredTemplates.length === 0 ? (
            <div className="tpl-empty">No {activeTab} templates available</div>
          ) : (
            filteredTemplates.map((t) => (
              <article
                key={t.id}
                className={`tpl-card ${selected === t.id ? "is-selected" : ""}`}
                onClick={() => setSelected(t.id)}
              >
                <div className="tpl-img">
                  <img
                    src={t.cover || "https://via.placeholder.com/200x260?text=Template"}
                    alt={`${t.name} cover`}
                  />
                </div>
                <div className="tpl-caption">
                  <span className="tpl-label">{t.name}</span>
                  <h4 className="tpl-desc">{t.description}</h4>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
