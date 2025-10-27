// src/components/layout/Header.jsx
import "../style/Header.css";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Link as ScrollLink, scroller } from "react-scroll";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  logout as apiLogout,
  changePassword,
} from "../../services/authService";

// Notifications
import {
  getUnreadCount,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../../services/notificationService";

// Reviews
import { getMyReview } from "../../services/reviewService";

// ========== Change Password Modal ==========
// eslint-disable-next-line react/prop-types
function ChangePasswordModal({ open, onClose }) {
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");
    try {
      setLoading(true);
      await changePassword({ currentPassword: cur, newPassword: nw });
      setMsg("Password changed 🎉");
      setCur("");
      setNw("");
    } catch (error) {
      const m = error?.response?.data?.message || error?.message || "Failed.";
      setErr(m);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="modal-title">Change password</h3>
        <form onSubmit={submit}>
          <input
            className="modal-input"
            type="password"
            placeholder="Current password"
            value={cur}
            onChange={(e) => setCur(e.target.value)}
            required
          />
          <input
            className="modal-input"
            type="password"
            placeholder="New password (6+)"
            value={nw}
            onChange={(e) => setNw(e.target.value)}
            minLength={6}
            required
          />

          {err && <div style={{ color: "#d04848", marginTop: 6 }}>{err}</div>}
          {msg && <div style={{ color: "#2f7a2f", marginTop: 6 }}>{msg}</div>}

          <div className="modal-actions">
            <button type="button" className="modal-btn ghost" onClick={onClose}>
              Close
            </button>
            <button className="modal-btn" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============== Header ==============
function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  // ---- auth state
  const safeParse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };
  const readUser = () => {
    const token = localStorage.getItem("access_token");
    const userJson = localStorage.getItem("user");
    return { token, user: userJson ? safeParse(userJson) : null };
  };
  const [{ token, user }, setAuth] = useState(readUser());

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  const refreshAuth = useCallback(() => setAuth(readUser()), []);
  useEffect(() => {
    const onStorage = (e) => {
      if (["access_token", "user"].includes(e.key)) refreshAuth();
    };
    const onFocus = () => refreshAuth();
    const onAuthChanged = () => refreshAuth();

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("auth:changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("auth:changed", onAuthChanged);
    };
  }, [refreshAuth]);

  // Route title
  const titles = {
    "/": "Everquill",
    "/about": "About",
    "/contact": "Contact",
    "/premium": "Premium",
    "/login": "Log in",
    "/profile": "Profile",
    "/journals": "Journals",
    "/reviews": "Reviews",
  };
  const cleanPath = location.pathname.replace(/\/+$/, "") || "/";
  const currentTitle = titles[cleanPath] ?? "Everquill";

  // Search
  const onSearch = (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim() ?? "";
    navigate(`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    setNotifOpen(false);
    setMenuOpen(false);
  };

  // scroll helpers
  const scrollTo = (target) =>
    scroller.scrollTo(target, { smooth: true, duration: 600, offset: -80 });
  const goToAndScroll = async (target) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => scrollTo(target), 80);
    } else {
      scrollTo(target);
    }
  };

  const displayName = user?.name || user?.email || "Me";
  const initial = (displayName?.[0] || "U").toUpperCase();
  const loggedIn = !!token;
  const userAvatar = user?.avatar;

  const handleLogout = async () => {
    try {
      await apiLogout();
    } finally {
      setMenuOpen(false);
      setAuth({ token: null, user: null });
      if (user?._id || user?.id || user?.email) {
        const uid = user._id || user.id || user.email;
        localStorage.removeItem(`has_review_${uid}`);
      }
      navigate("/login");
    }
  };

  // =======================
  // Notifications
  // =======================
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifErr, setNotifErr] = useState("");
  const [notifs, setNotifs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 20;

  const normalize = (n) => ({
    id: n?.id ?? n?._id ?? n?.notificationId ?? String(Math.random()),
    title: n?.title ?? n?.type ?? "Notification",
    body: n?.message ?? n?.content ?? n?.text ?? "",
    createdAt: n?.createdAt ?? n?.time ?? n?.date ?? null,
    read: n?.read ?? n?.isRead ?? false,
    raw: n,
  });

  const fetchUnread = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const res = await getUnreadCount();
      const count = res?.data?.unreadCount ?? 0;
      setUnreadCount(count);
    } catch {
      /* ignore */
    }
  }, [loggedIn]);

  const fetchList = useCallback(
    async ({ reset = false, nextPage = 1 } = {}) => {
      if (!loggedIn) return;
      setNotifErr("");
      setNotifLoading(true);
      try {
        const res = await getNotifications({ page: nextPage, limit: pageSize });
        const items = (res?.data?.notifications ?? []).map(normalize);
        setNotifs((prev) => (reset ? items : [...prev, ...items]));
        setHasMore(items.length === pageSize);
        setPage(nextPage);
        if (typeof res?.data?.unreadCount === "number") {
          setUnreadCount(res.data.unreadCount);
        }
      } catch (e) {
        const m =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to load notifications.";
        setNotifErr(m);
      } finally {
        setNotifLoading(false);
      }
    },
    [loggedIn]
  );

  useEffect(() => {
    let interval;
    if (loggedIn) {
      fetchUnread();
      interval = setInterval(fetchUnread, 45000);
    }
    return () => interval && clearInterval(interval);
  }, [loggedIn, fetchUnread]);

  const prevOpen = useRef(false);
  useEffect(() => {
    if (notifOpen && !prevOpen.current) {
      fetchList({ reset: true, nextPage: 1 });
    }
    prevOpen.current = notifOpen;
  }, [notifOpen, fetchList]);

  const handleItemMarkRead = async (notificationId) => {
    try {
      setNotifs((arr) =>
        arr.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationRead(notificationId);
    } catch {
      setNotifs((arr) =>
        arr.map((n) => (n.id === notificationId ? { ...n, read: false } : n))
      );
      setUnreadCount((c) => c + 1);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifs((arr) => arr.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      await markAllNotificationsRead();
    } catch {
      fetchList({ reset: true, nextPage: 1 });
      fetchUnread();
    }
  };

  const handleDeleteOne = async (notificationId) => {
    const target = notifs.find((n) => n.id === notificationId);
    setNotifs((arr) => arr.filter((n) => n.id !== notificationId));
    if (target && !target.read) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await deleteNotification(notificationId);
    } catch {
      fetchList({ reset: true, nextPage: 1 });
      fetchUnread();
    }
  };

  const handleClearAll = async () => {
    const ids = notifs.map((n) => n.id);
    if (!ids.length) return;
    setNotifs([]);
    setUnreadCount(0);
    try {
      await Promise.allSettled(ids.map((id) => deleteNotification(id)));
      fetchList({ reset: true, nextPage: 1 });
      fetchUnread();
    } catch {
      fetchList({ reset: true, nextPage: 1 });
      fetchUnread();
    }
  };

  const loadMore = () => {
    if (!notifLoading && hasMore)
      fetchList({ reset: false, nextPage: page + 1 });
  };

  // =======================
  // Rate us – chỉ 1 lần
  // =======================
  const [canRate, setCanRate] = useState(false);
  const cacheKey = user
    ? `has_review_${user._id || user.id || user.email}`
    : null;

  // Chuẩn hoá và kiểm tra chính xác “đã đánh giá chưa”
  function hasUserReviewed(res) {
    const d = res?.data ?? res;
    if (!d) return false;

    if (Array.isArray(d)) return d.length > 0; // [review]
    if (typeof d === "object") {
      if (Array.isArray(d.reviews)) return d.reviews.length > 0; // {reviews:[...]}
      if (d.review) {
        // {review:{...}}
        const r = d.review;
        return !!(r?._id || r?.id || typeof r?.rating === "number");
      }
      if (d._id || d.id || typeof d.rating === "number") return true; // trả object review
      if (typeof d.hasReviewed === "boolean") return d.hasReviewed; // {hasReviewed:true}
      if (typeof d.count === "number") return d.count > 0; // {count:n}
      return false;
    }
    return false;
  }

  const checkRateEligibility = useCallback(async () => {
    if (!loggedIn || !user) {
      setCanRate(false);
      return;
    }
    if (cacheKey && localStorage.getItem(cacheKey) === "true") {
      setCanRate(false);
      return;
    }
    try {
      const res = await getMyReview();
      const reviewed = hasUserReviewed(res);
      setCanRate(!reviewed);
      if (reviewed && cacheKey) localStorage.setItem(cacheKey, "true");
    } catch {
      // Nếu API lỗi, vẫn cho phép hiện nút để user có thể vào trang /reviews
      setCanRate(true);
    }
  }, [loggedIn, user, cacheKey]);

  useEffect(() => {
    checkRateEligibility();
  }, [checkRateEligibility]);

  // Sau khi submit review ở trang Reviews:
  // window.dispatchEvent(new CustomEvent("review:submitted"));
  useEffect(() => {
    const onSubmitted = () => {
      setCanRate(false);
      if (cacheKey) localStorage.setItem(cacheKey, "true");
    };
    window.addEventListener("review:submitted", onSubmitted);
    return () => window.removeEventListener("review:submitted", onSubmitted);
  }, [cacheKey]);

  const goRateUs = () => {
    setMenuOpen(false);
    navigate("/reviews");
  };

  return (
    <header className={`header ${loggedIn ? "header--auth" : ""}`}>
      <div className="header__container">
        {/* Logo + title */}
        <NavLink className="logo" to="/" end>
          <img
            src="/logo-feather.png"
            alt="Everquill logo"
            className="logo__img"
          />
          <span className="logo__text">{currentTitle}</span>
        </NavLink>

        {/* NAV */}
        <nav className="nav" aria-label="Main">
          <ul className="nav-links">
            <li>
              {location.pathname === "/" ? (
                <ScrollLink
                  to="hero"
                  smooth
                  duration={500}
                  offset={-80}
                  className="cursor-pointer"
                >
                  Home
                </ScrollLink>
              ) : (
                <NavLink to="/" end>
                  Home
                </NavLink>
              )}
            </li>
            <li>
              <button
                type="button"
                className="linklike"
                onClick={() => goToAndScroll("features")}
              >
                Features
              </button>
            </li>
            <li>
              <NavLink to="/about">About</NavLink>
            </li>
            <li>
              <NavLink to="/contact">Contact</NavLink>
            </li>
            <li>
              <NavLink to="/premium">Premium</NavLink>
            </li>
            {!loggedIn && (
              <li>
                <NavLink to="/login">Log in</NavLink>
              </li>
            )}
          </ul>
        </nav>

        {/* ACTIONS */}
        <div className="actions">
          <form className="search" role="search" onSubmit={onSearch}>
            <input
              name="q"
              type="search"
              placeholder="Search in site"
              aria-label="Search in site"
            />
            <button className="search__btn" aria-label="Search">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M20 20l-3.2-3.2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>

          {loggedIn && (
            <>
              {/* Bell */}
              <div className="notif">
                <button
                  className="bell-btn"
                  onClick={() => setNotifOpen((s) => !s)}
                  aria-haspopup="menu"
                  aria-expanded={notifOpen}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
                      fill="currentColor"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span
                      className="badge"
                      aria-label={`${unreadCount} unread`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="notif-panel" role="menu">
                    <div className="notif-head">
                      <div className="notif-title-head">Notifications</div>
                      <div className="notif-actions">
                        <button
                          className="mini"
                          onClick={handleMarkAllRead}
                          disabled={!notifs.length}
                        >
                          Mark read
                        </button>
                        <button
                          className="mini danger"
                          onClick={handleClearAll}
                          disabled={!notifs.length}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div className="notif-list">
                      {notifErr && (
                        <div className="notif-empty error">{notifErr}</div>
                      )}
                      {!notifErr && notifLoading && !notifs.length && (
                        <div className="notif-empty">Loading…</div>
                      )}
                      {!notifErr && !notifLoading && !notifs.length && (
                        <div className="notif-empty">No notifications yet.</div>
                      )}

                      {notifs.map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item ${n.read ? "read" : "unread"}`}
                        >
                          <div className="notif-main">
                            <div className="notif-title">{n.title}</div>
                            {n.body && (
                              <div className="notif-body">{n.body}</div>
                            )}
                            {n.createdAt && (
                              <div className="notif-meta">
                                {new Date(n.createdAt).toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div className="notif-ops">
                            {!n.read && (
                              <button
                                className="mini"
                                onClick={() => handleItemMarkRead(n.id)}
                                aria-label="Mark as read"
                              >
                                ✓
                              </button>
                            )}
                            <button
                              className="mini danger"
                              onClick={() => handleDeleteOne(n.id)}
                              aria-label="Delete"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}

                      {hasMore && (
                        <div className="notif-foot">
                          <button
                            className="mini"
                            onClick={loadMore}
                            disabled={notifLoading}
                          >
                            {notifLoading ? "Loading…" : "Load more"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User */}
              <div className="nav-user">
                <button
                  type="button"
                  className="user-btn"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="avatar" aria-hidden="true">
                    {userAvatar && userAvatar.trim() !== "" ? (
                      <img
                        src={userAvatar}
                        alt="Profile"
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      initial
                    )}
                  </span>
                  <span className="user-name">{displayName}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    className={`chev ${menuOpen ? "open" : ""}`}
                  >
                    <path
                      d="M7 10l5 5 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="user-menu" role="menu">
                    <NavLink
                      to="/profile"
                      className="user-menu__item"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </NavLink>

                    {/* Rate us – chỉ hiện khi chưa từng đánh giá */}
                    {canRate && (
                      <button className="user-menu__item" onClick={goRateUs}>
                        Rate us ⭐
                      </button>
                    )}

                    <button
                      className="user-menu__item"
                      onClick={() => {
                        setMenuOpen(false);
                        setShowChangePw(true);
                      }}
                    >
                      Change password
                    </button>
                    <button
                      className="user-menu__item danger"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Change Password */}
      <ChangePasswordModal
        open={showChangePw}
        onClose={() => setShowChangePw(false)}
      />
    </header>
  );
}

export default Header;
