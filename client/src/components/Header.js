import React from "react";
import { Link, useLocation } from "react-router-dom";
import RegistrationButton from "./RegistrationButton";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

function Header({ isLoggedIn, setIsLoggedIn }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <header>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            FlashMaster
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              {isLoggedIn && (
                <>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/collection")}`}
                      to="/collection"
                    >
                      Collection
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/create-deck")}`}
                      to="/create-deck"
                    >
                      Create Deck
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/your-decks">
                      Your Decks
                    </Link>{" "}
                    
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/study">
                      Study
                    </Link>{" "}
                    
                  </li>

                  <li className="nav-item">
                    <Link className="nav-link" to="/create-flashcard">
                      Create Flashcards
                    </Link>{" "}
                    
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/edit-flashcards">
                      Edit Flashcards
                    </Link>{" "}
                    
                  </li>
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${isActive("/practice")}`}
                      to="/practice"
                    >
                      Practice
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/settings">
                      Settings
                    </Link>{" "}
                    
                  </li>
                </>
              )}
            </ul>
            <div className="d-flex">
              {isLoggedIn ? (
                <LogoutButton setIsLoggedIn={setIsLoggedIn} />
              ) : (
                <>
                  <RegistrationButton />
                  <div style={{ width: "10px" }} />
                  <LoginButton />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
