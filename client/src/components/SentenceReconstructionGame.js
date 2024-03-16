import React, { useState, useEffect, useContext } from "react";
import styles from "./SentenceReconstructionGame.module.css"; 
import { DeckContext } from "./DeckContext";
const SentenceReconstructionGame = ({ username }) => {
  const [scrambledSentence, setScrambledSentence] = useState([]);
  const [originalSentence, setOriginalSentence] = useState("");
  const [userAnswer, setUserAnswer] = useState([]);
  const [userId, setUserId] = useState(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const { selectedDeckId } = useContext(DeckContext);

  useEffect(() => {
    
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/leaderboard/sentence-game"
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
    const fetchUserId = async () => {
      try {
        const username = localStorage.getItem("username");
        const response = await fetch(
          `http://localhost:5000/api/userid?username=${username}`
        );
        const data = await response.json();
        setUserId(data.userId);
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    fetchUserId();
  }, [username]);

  useEffect(() => {
    const fetchBestScore = async () => {
      try {
        const username = localStorage.getItem("username");
        const response = await fetch(
          `http://localhost:5000/api/high-score?username=${username}`
        );
        const data = await response.json();

        if (data.length > 0) {
          setBestScore(data[0].sentence_score); 
        }
      } catch (error) {
        console.error("Error fetching high score:", error);
      }
    };

    if (userId) {
      fetchBestScore();
    }
  }, [userId, username]);

  useEffect(() => {
    if (userId) {
      const deckId = selectedDeckId;
      fetch(`http://localhost:5000/api/flashcards-new?userId=${userId}&deckId=${deckId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            const sentence = data[0].example_sentence;
            setOriginalSentence(sentence);
            setScrambledSentence(
              sentence.split(" ").sort(() => Math.random() - 0.5)
            );
          }
        })
        .catch((error) => console.error("Error fetching flashcards:", error));
    }
  }, [userId]);

  const moveWord = (word, index) => {
    setUserAnswer([...userAnswer, word]);
    setScrambledSentence(scrambledSentence.filter((_, idx) => idx !== index));
  };

  const refreshWordOrder = () => {
    setUserAnswer([]);
    setScrambledSentence([]);
    setCorrectAnswer("");
    setMessage("");

    
    fetchNewSentence();
  };

  const checkAnswer = () => {
    const userSentence = userAnswer.join(" ");

    if (userSentence === originalSentence) {
      const newScore = score + 1;
      setScore(newScore);
      setMessage("Correct!");

      if (newScore > bestScore) {
        setBestScore(newScore);
        updateHighScore(newScore); 
      }
    } else {
      setCorrectAnswer(originalSentence);
      setMessage("Incorrect. Try again!");
    }
  };

  const tryAgain = () => {
    setScore(0); 
    setUserAnswer([]);
    setCorrectAnswer("");
    setMessage("");
    fetchNewSentence(); 
  };

  const nextSentence = () => {
    setUserAnswer([]);
    setCorrectAnswer("");
    setMessage("");
    fetchNewSentence(); 
  };

  const refreshWords = () => {
    setScrambledSentence([...scrambledSentence, ...userAnswer]);
    setUserAnswer([]);
  };

  const fetchNewSentence = () => {
    if (userId) {
      const deckId = selectedDeckId;
      fetch(`http://localhost:5000/api/flashcards-new?userId=${userId}&deckId=${deckId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            const sentence = data[0].example_sentence;
            setOriginalSentence(sentence);
            setScrambledSentence(
              sentence.split(" ").sort(() => Math.random() - 0.5)
            );
          }
        })
        .catch((error) => console.error("Error fetching flashcards:", error));
    }
  };

  const updateHighScore = (newScore) => {
    const username = localStorage.getItem("username");
    fetch("http://localhost:5000/api/update-high-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        scoreType: "sentence_score",
        scoreValue: newScore,
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log(data.message))
      .catch((error) => console.error("Error updating high score:", error));
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.sentenceGameContainer}>
        <h2 className={styles.gameTitle}>Sentence Reconstruction Game</h2>
        <div className={styles.scoreContainer}>
          <p className="mb-0">Score: {score}</p>
          <p className="mb-0">Best Score: {bestScore}</p>
        </div>
        <div className={styles.gameArea}>
          <div className={styles.scrambledContainer}>
            {scrambledSentence.map((word, index) => (
              <button
                key={word + index} 
                className={styles.wordButton}
                onClick={() => moveWord(word, index)}
              >
                {word}
              </button>
            ))}
          </div>
          <div className={styles.userContainer}>
            {userAnswer.map((word, index) => (
              <span key={index} className={styles.userWord}>
                {word}{" "}
              </span>
            ))}
          </div>
        </div>
        <div className={styles.interactionContainer}>
          {correctAnswer && (
            <div className={styles.correctAnswerContainer}>
              Correct Answer: {correctAnswer}
            </div>
          )}
          {message && <div className={styles.messageContainer}>{message}</div>}

          <div className={styles.buttonContainer}>
            {message && message === "Correct!" && (
              <button className={styles.nextButton} onClick={nextSentence}>
                Next Sentence
              </button>
            )}
            {message && message.includes("Incorrect") && (
              <button className={styles.tryAgainButton} onClick={tryAgain}>
                Try Again
              </button>
            )}
            {!message && (
              <>
                <button className={styles.checkButton} onClick={checkAnswer}>
                  Check Answer
                </button>
                <button className={styles.refreshButton} onClick={refreshWords}>
                  Refresh Words
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={styles.leaderboardContainer}>
        <h3>Leaderboard</h3>
        <table className={styles.leaderboardTable}>
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
                <td>{entry.sentence_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SentenceReconstructionGame;
