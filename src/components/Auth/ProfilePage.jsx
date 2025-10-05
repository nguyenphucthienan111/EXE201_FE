import { useEffect, useState } from "react";
import { getMyProfile, updateMyProfile, deleteMyAccount, getMyStats } from "../../services/userService";
import "../style/AuthPage.css"; // tái dùng style đẹp sẵn

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState(""); 
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await getMyProfile();
        setProfile(me);
        setName(me?.name || "");
        const s = await getMyStats();
        setStats(s);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message);
      }
    })();
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    try {
      setLoading(true);
      await updateMyProfile({ name });
      const me = await getMyProfile(); // refresh view
      setProfile(me);
      setMsg("Profile updated.");
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("This will delete your account and ALL data. Continue?")) return;
    try {
      await deleteMyAccount();
      window.location.href = "/login";
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  };

  return (
    <div className="auth-root">
      <div className="auth-card" style={{maxWidth: 560}}>
        <h1>My Profile</h1>

        {profile && (
          <div style={{textAlign:"left", marginBottom: 16}}>
            <div><b>Email:</b> {profile.email}</div>
            <div><b>Plan:</b> {profile.plan || "free"}</div>
          </div>
        )}

        <form onSubmit={onSave} style={{marginBottom: 12}}>
          <input
            className="auth-input"
            placeholder="Your name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />
          <button className="auth-btn" disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </button>
        </form>

        {stats && (
          <div className="auth-notice success" style={{textAlign:"left"}}>
            <div><b>Stats</b></div>
            <pre style={{whiteSpace:"pre-wrap", margin:0}}>{JSON.stringify(stats, null, 2)}</pre>
          </div>
        )}

        {err && <div className="auth-notice error">{err}</div>}
        {msg && <div className="auth-notice success">{msg}</div>}

        <div className="auth-link" style={{marginTop:16}}>
          <button className="auth-btn" style={{background:"#d9534f"}} onClick={onDelete}>
            Delete my account
          </button>
        </div>
      </div>
    </div>
  );
}
