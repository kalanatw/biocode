import { NavLink, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <NavLink to="/" className="logo"><span className="heart" aria-hidden="true">♥</span> BIOCODE</NavLink>
          <nav className="nav" aria-label="Main">
            <NavLink to="/" end>Guide</NavLink>
            <NavLink to="/library">Library</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
        </div>
      </header>
      <main id="main"><Outlet /></main>
      <footer className="footer wrap">
        <p className="script">Made with love for curious minds.</p>
        <p>Every video, paper and link is machine-checked before the site builds. Explanations are original — always cross-check with your own notes.</p>
      </footer>
    </>
  );
}
