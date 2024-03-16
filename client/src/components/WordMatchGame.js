import React, { useState, useEffect, useContext } from "react";
import "./WordMatchGame.css";
import { useNavigate } from "react-router-dom";
import {DeckContext} from "./DeckContext";

function WordTranslationMatch() {
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [shuffledBackTexts, setShuffledBackTexts] = useState([]);
  const [shuffledFrontTexts, setShuffledFrontTexts] = useState([]);
  const [MAX_PAIRS] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [correctPairs, setCorrectPairs] = useState([]);
  const [backTexts, setBackTexts] = useState([]); 
  const [frontTexts, setFrontTexts] = useState([]); 
  const [highScores, setHighScores] = useState([]);
  const [foundPairsCount, setFoundPairsCount] = useState(0);
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { selectedDeckId } = useContext(DeckContext);

  const handleBackButtonClick = () => {
    navigate("/practice");
  };

  
  useEffect(() => {
    
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/leaderboard/match-game"
        );
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const username = localStorage.getItem("username");
    fetchFlashcards(username, MAX_PAIRS)
      .then((cards) => {
        setIsLoading(false);
        if (cards && Array.isArray(cards)) {
          const selectedCards = selectCards(cards, MAX_PAIRS);
          setFlashcards(selectedCards);

          
          const backTexts = selectedCards.map((card, index) => ({
            text: card.back_text,
            id: index,
          }));
          const frontTexts = selectedCards.map((card, index) => ({
            text: card.front_text,
            id: index,
          }));

          setShuffledBackTexts(shuffleArray([...backTexts]));
          setShuffledFrontTexts(shuffleArray([...frontTexts]));
        } else {
          console.error("Received data is not an array:", cards);
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error fetching flashcards:", error);
      });
  }, []);

  const fetchHighScores = async (username) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/high-score?username=${username}`
      );
      if (!response.ok) {
        throw new Error("Could not fetch high scores");
      }
      const highScoresData = await response.json();
      setHighScores(highScoresData); 
    } catch (error) {
      console.error("Error fetching high scores:", error);
    }
  };

  useEffect(() => {
    const username = localStorage.getItem("username");
    fetchHighScores(username)
      .then((highScores) => {
       
      })
      .catch((error) => {
       
        console.error("Failed to fetch high scores:", error);
      });
  }, []);

  const fetchFlashcards = async (username, limit) => {
    try {
      const deckId = selectedDeckId;
      const response = await fetch(
        `http://localhost:5000/api/limited-flashcards?username=${username}&limit=${limit}&deckId=${deckId}`
      );
      if (!response.ok) {
        throw new Error("Could not fetch limited flashcards");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching limited flashcards:", error);
    }
  };

  const fetchNewFlashcards = async (username, limit) => {
    try {
      const deckId = selectedDeckId;
      const response = await fetch(
        `http://localhost:5000/api/limited-flashcards?username=${username}&limit=${limit}&deckId=${deckId}`
      );
      if (!response.ok) {
        throw new Error("Could not fetch limited flashcards");
      }
      const newCards = await response.json();
      const selectedCards = selectCards(newCards, MAX_PAIRS);

      setFlashcards(selectedCards);

      const newBackTexts = selectedCards.map((card, index) => ({
        text: card.back_text,
        id: index,
      }));
      const newFrontTexts = selectedCards.map((card, index) => ({
        text: card.front_text,
        id: index,
      }));

      setShuffledBackTexts(shuffleArray([...newBackTexts]));
      setShuffledFrontTexts(shuffleArray([...newFrontTexts]));

      console.log("New Flashcards: ", newCards); 

      shuffleArray(newCards); 
      setFlashcards(newCards);

      
      setSelectedIndices([]);
      setMatches([]);
      setCorrectPairs([]);
      setFoundPairsCount(0); 
    } catch (error) {
      console.error("Error fetching new flashcards:", error);
    }
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const selectCards = (cards, maxPairs) => {
    shuffleArray(cards);
    return cards.slice(0, maxPairs);
  };

  const handleGameOver = () => {
    setGameOver(true);
    const highestScore =
      highScores.length > 0
        ? Math.max(...highScores.map((s) => s.match_score))
        : 0;
    console.log("Highest Score: ", highestScore); 
    console.log("Score: ", score);
    if (score > highestScore) {
      updateHighScore("match_score", score);
    }
  };

  const updateHighScore = async (scoreType, scoreValue) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/update-high-score",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: localStorage.getItem("username"),
            scoreType: scoreType,
            scoreValue: scoreValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update high score");
      }

      
      await fetchHighScores(localStorage.getItem("username"));
    } catch (error) {
      console.error("Error updating high score:", error);
    }
  };

  const handleResetGame = () => {
    setGameOver(false);
    setScore(0);
    setSelectedIndices([]);
    setMatches([]);
    setCorrectPairs([]);

    fetchNewFlashcards(localStorage.getItem("username"), MAX_PAIRS)
      .then((cards) => {
        if (cards && Array.isArray(cards)) {
          setFlashcards(cards);
          
          const backTexts = cards.map((card, index) => ({
            text: card.back_text,
            id: index,
          }));
          const frontTexts = cards.map((card, index) => ({
            text: card.front_text,
            id: index,
          }));
          setShuffledBackTexts(shuffleArray([...backTexts]));
          setShuffledFrontTexts(shuffleArray([...frontTexts]));
        } else {
          console.error("Received data is not an array:", cards);
        }
      })
      .catch((error) => {
        console.error("Error fetching new flashcards:", error);
      });
  };

  const handleCardClick = (index, isFront) => {
    if (gameOver || foundPairsCount === MAX_PAIRS) {
      return;
    }

    if (
      selectedIndices.length === 1 &&
      selectedIndices[0].isFront === isFront
    ) {
      return;
    }

    if (selectedIndices.length < 2) {
      setSelectedIndices([...selectedIndices, { index, isFront }]);
    }

    if (selectedIndices.length === 1) {
      const firstCardIndex = selectedIndices[0].index;
      const secondCardIndex = index;

      const firstCard = flashcards[firstCardIndex];
      const secondCard = flashcards[secondCardIndex];

      if (firstCard.front_text === secondCard.front_text) {
        setMatches([...matches, firstCardIndex, secondCardIndex]);
        setScore(score + 1);
        setCorrectPairs([...correctPairs, firstCardIndex, secondCardIndex]); 
        setSelectedIndices([]);
      } else {
        handleGameOver();
      }
      if (foundPairsCount + 1 === MAX_PAIRS) {
        fetchNewFlashcards(localStorage.getItem("username"), MAX_PAIRS);
        setFoundPairsCount(0); 
      } else {
        setFoundPairsCount(foundPairsCount + 1);
      }
    }
  };

  return (
    <div className="container my-4">
      
      <div className="game-leaderboard-wrapper">
        {/* Game UI */}
        
        <div className="gameContainer col-lg-6 col-md-8">
        <h2 className="text-center mb-4">Word Translation Match</h2>
          {isLoading ? (
            <div className="d-flex justify-content-center">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : (
            <div>
              {gameOver ? (
                <div className="text-center">
                  <p>Game Over!</p>
                  <p>Your Score: {score}</p>
                  <button className="btn btn-primary" onClick={handleResetGame}>
                    Reset Game
                  </button>
                </div>
              ) : (
                <div className="row">
                  <div className="col-6">
                    {shuffledBackTexts.map((backText, index) => (
                      <div className="mb-2" key={`back-${index}`}>
                        <button
                          className={`btn w-100 ${
                            selectedIndices.includes(backText.id)
                              ? "btn-primary"
                              : correctPairs.includes(backText.id)
                              ? "btn-success"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => handleCardClick(backText.id, "back")}
                          disabled={matches.includes(backText.id)}
                        >
                          {backText.text}
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="col-6">
                    {shuffledFrontTexts.map((frontText, index) => (
                      <div className="mb-2" key={`front-${index}`}>
                        <button
                          className={`btn w-100 ${
                            selectedIndices.includes(frontText.id)
                              ? "btn-secondary"
                              : correctPairs.includes(frontText.id)
                              ? "btn-success"
                              : "btn-outline-secondary"
                          }`}
                          onClick={() => handleCardClick(frontText.id, "front")}
                          disabled={matches.includes(frontText.id)}
                        >
                          {frontText.text}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-center mt-4">
            <p>Score: {score}</p>
            <button
              className="btn btn-secondary"
              onClick={handleBackButtonClick}
            >
              Back
            </button>
          </div>
        </div>

        
        <div className="leaderboardContainer col-lg-6 col-md-4">
          <h3>Leaderboard</h3>
          <table className="leaderboardTable">
            <thead>
              <tr>
                <th>Username</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.username}</td>
                  <td>{entry.match_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WordTranslationMatch;
