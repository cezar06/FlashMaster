import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import RegistrationPage from "./components/RegistrationPage";
import LoginPage from "./components/LoginPage";
import Collection from "./components/Collection";
import Quiz from "./components/Quiz";
import Flashcards from "./components/Flashcards";
import CreateDeck from "./components/CreateCustomDeck";
import YourDecks from "./components/YourDecks";
import EditDeck from "./components/EditDeck";
import Study from "./components/Study";
import Settings from "./components/Settings";
import CreateFlashcard from "./components/CreateFlashcard";
import CustomFlashcardsViewer from "./components/CustomFlashcardsViewer";
import BrowseDecks from "./components/BrowseDecks";
import VerbPractice from "./components/VerbPractice";
import WordMatchGame from "./components/WordMatchGame";
import PracticePage from "./components/PracticePage";
import SentenceReconstructionGame from "./components/SentenceReconstructionGame";
import { DeckProvider } from "./components/DeckContext";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("token")) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <DeckProvider>
      <Router>
        <div>
          <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
          <div className="container">
            <Routes>
              <Route path="/register" element={<RegistrationPage />} />
              <Route
                path="/login"
                element={<LoginPage setIsLoggedIn={setIsLoggedIn} />}
              />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/create-deck" element={<CreateDeck />} />
              <Route path="/your-decks" element={<YourDecks />} />
              <Route path="/edit_deck/:deckId" element={<EditDeck />} />
              <Route path="/study" element={<Study />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/create-flashcard" element={<CreateFlashcard />} />
              <Route
                path="/edit-flashcards"
                element={<CustomFlashcardsViewer />}
              />
              <Route path="/browse-decks" element={<BrowseDecks />} />
              <Route path="/verb-practice" element={<VerbPractice />} />
              <Route path="/word-match-game" element={<WordMatchGame />} />
              <Route path="/practice" element={<PracticePage />} />
              <Route
                path="/sentence-reconstruction"
                element={<SentenceReconstructionGame />}
              />
              <Route path="/" element={<Navigate to="/study" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </DeckProvider>
  );
}

export default App;
