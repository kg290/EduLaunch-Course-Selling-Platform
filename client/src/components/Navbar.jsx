import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        EduLaunch
      </Link>
      <nav className="nav-links">
        <NavLink to="/courses">Courses</NavLink>
        {isAuthenticated && user?.role === "student" && (
          <>
            <NavLink to="/my-learning">My Learning</NavLink>
            <NavLink to="/wishlist">Wishlist</NavLink>
            <NavLink to="/profile">Profile</NavLink>
          </>
        )}
        {isAuthenticated && user?.role === "educator" && (
          <NavLink to="/educator">Dashboard</NavLink>
        )}
        {isAuthenticated && user?.role === "admin" && (
          <NavLink to="/admin">Admin Panel</NavLink>
        )}
      </nav>
      <div className="actions">
        {isAuthenticated ? (
          <>
            <span className="user-chip">
              {user?.name}
              <span className="role-badge">{user?.role}</span>
            </span>
            <button onClick={onLogout} className="btn btn-ghost btn-sm" type="button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
