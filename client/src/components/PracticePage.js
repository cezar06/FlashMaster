import React, { useState, useEffect, useContext } from "react"; 
import { Link } from "react-router-dom";
import "./PracticePage.css";
import { DeckContext } from "./DeckContext";

function PracticePage() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setSelectedDeckId } = useContext(DeckContext);

  const handleDeckChange = (e) => {
    setSelectedDeckId(e.target.value);
    console.log(e.target.value);
  };

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const username = localStorage.getItem("username");
        const response = await fetch(
          `http://localhost:5000/api/user-decks/${username}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setDecks(data);
        setLoading(false);
        if (data && data.length > 0) {
          setDecks(data);
          setSelectedDeckId(data[0].id); 
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  if (loading) return <p>Loading decks...</p>;
  if (error) return <p>Error loading decks: {error}</p>;

  return (
    <div className="container mt-0 mb-5">
      <h2 className="text-center mb-4">Practice Activities</h2>
      <div className="alert alert-info">
        <h4>Activity Disclaimers</h4>
        <p>
          <strong>Multiple Choice Quiz:</strong> Have at least 5 flashcards in
          your deck that include example sentences. The word in the target
          language should be found in the example sentence.
        </p>
        <p>
          <strong>Verb Practice:</strong> Make sure you have at least a few verb
          flashcards. This feature only supports the English language currently.
        </p>
        <p>
          <strong>Word Match Game:</strong> For the best experience, have at
          least 5 flashcards in your deck.
        </p>
        <p>
          <strong>Sentence Reconstruction:</strong> Have at least a few
          flashcards with example sentences.
        </p>
      </div>
      <div className="mb-4">
        <select
          id="deck-selector"
          className="form-select"
          onChange={handleDeckChange}
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.deck_name}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Multiple Choice Quiz</h5>
              <p className="card-text">Test your knowledge with a fun quiz!</p>
              <Link to="/quiz" className="btn btn-primary">
                Go to Quiz
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Verb Practice</h5>
              <p className="card-text">Improve your verb conjugations.</p>
              <Link to="/verb-practice" className="btn btn-primary">
                Practice Verbs
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Word Match Game</h5>
              <p className="card-text">
                Enhance your vocabulary with a matching game.
              </p>
              <Link to="/word-match-game" className="btn btn-primary">
                Play Game
              </Link>
            </div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Sentence Reconstruction</h5>
              <p className="card-text">
                Practice your sentence construction skills.
              </p>
              <Link to="/sentence-reconstruction" className="btn btn-primary">
                Practice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PracticePage;
