import "../style/Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="ft-top">
        {/* Left: big brand */}
        <div className="ft-brand">
          <img src="/logo-feather.png" alt="" className="ft-logo" />
          <span className="ft-name">Everquill</span>
        </div>

        {/* Right: link columns */}
        <div className="ft-columns">
          <div className="ft-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Contact</a>
            <a href="#">Careers</a>
            <a href="#">Blog</a>
            <a href="#">Press</a>
          </div>
          <div className="ft-col">
            <h4>Resources</h4>
            <a href="#">Help Center</a>
            <a href="#">Pricing</a>
            <a href="#">Blog</a>
            <a href="#">Community</a>
            <a href="#">Integrations</a>
          </div>
        </div>
      </div>

      <hr className="ft-divider" />

      <div className="ft-bottom">
        <span>© {new Date().getFullYear()} Everquill. All rights reserved.</span>
        <nav className="ft-legal">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </nav>
      </div>
    </footer>
  );
}
