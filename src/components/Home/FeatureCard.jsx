// eslint-disable-next-line react/prop-types
function FeatureCard({ icon, title, subtitle, desc }) {
  return (
    <div className="feature-card">
      {icon && <img src={icon} alt={title} className="feature-icon" />}
      <h3>{title}</h3>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      <p>{desc}</p>
    </div>
  );
}

export default FeatureCard;
