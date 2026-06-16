import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, Theme } from '../context/ThemeContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate('/login');
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };

  if (!user) return null;

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-logo" onClick={closeMenu} aria-label="EcoTrack Pro Home">
          <span role="img" aria-hidden="true">🌱</span>
          <span className="logo-text">EcoTrack <span className="logo-sub">Pro</span></span>
        </NavLink>

        {/* Mobile menu toggle */}
        <button
          className="navbar-toggle"
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          aria-label="Toggle navigation menu"
          onClick={toggleMenu}
        >
          <span className={`hamburger ${isOpen ? 'active' : ''}`} aria-hidden="true"></span>
        </button>

        {/* Navigation links */}
        <nav
          id="primary-navigation"
          className={`navbar-nav ${isOpen ? 'open' : ''}`}
          aria-label="Main Navigation"
        >
          <ul className="nav-list">
            <li className="nav-item">
              <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/calculator" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Calculator
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/recommendations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                AI Tips
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/gamification" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Eco Points
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/marketplace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Marketplace
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/community" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Community
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
                Profile
              </NavLink>
            </li>
          </ul>

          <div className="navbar-toolbar">
            {/* Theme Selector */}
            <div className="theme-select-container">
              <label htmlFor="theme-select" className="screen-reader-only">Select display theme</label>
              <select
                id="theme-select"
                value={theme}
                onChange={handleThemeChange}
                className="theme-select"
                aria-label="Switch display theme"
              >
                <option value="dark">🌑 Dark</option>
                <option value="light">☀️ Light</option>
                <option value="high-contrast">👁️ Contrast</option>
              </select>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm navbar-logout"
              aria-label="Log out from EcoTrack Pro"
            >
              Logout
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
