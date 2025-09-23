import "../style/Header.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // map đường dẫn -> chữ ở cạnh logo
  const titles = {
    "/": "Everquill",
    "/features": "Features",
    "/about": "About",
    "/contact": "Contact",
    "/premium": "Premium",
    "/login": "Log in",
  };

  // xử lý cả trường hợp có dấu / ở cuối
  const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
  const currentTitle = titles[cleanPath] ?? "Everquill";

  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo + tiêu đề theo route */}
        <NavLink className="logo" to="/" end>
          <img src="/src/assets/logo-feather.png" alt="Everquill logo" className="logo__img" />
          <span className="logo__text">{currentTitle}</span>
        </NavLink>

        {/* Nav */}
        <nav className="nav" aria-label="Main">
          <ul className="nav-links">
            <li><NavLink to="/" end>Home</NavLink></li>
            <li><NavLink to="/features">Features</NavLink></li>
            <li><NavLink to="/about">About</NavLink></li>
            <li><NavLink to="/contact">Contact</NavLink></li>
            <li><NavLink to="/premium">Premium</NavLink></li>
            <li><NavLink to="/login">Log in</NavLink></li>
          </ul>
        </nav>

        {/* Search */}
        <form className="search" role="search" onSubmit={onSearch}>
          <input name="q" type="search" placeholder="Search in site" aria-label="Search in site" />
          <button className="search__btn" aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </form>
      </div>
    </header>
  );
}

export default Header;
