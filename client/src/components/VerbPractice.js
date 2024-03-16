import React, { useState, useEffect, useContext } from "react";
import {DeckContext} from './DeckContext';
import "./Spinner.css";
import "./VerbPractice.css";

function VerbPractice() {
  const [verbs, setVerbs] = useState([]);
  const [currentVerb, setCurrentVerb] = useState(null);
  const [currentPronoun, setCurrentPronoun] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [currentTense, setCurrentTense] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [score, setScore] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [highestScore, setHighestScore] = useState(0);
  const { selectedDeckId } = useContext(DeckContext);

  const languageTenses = {
    English: [
      "Present Simple",
      "Past Simple",
      "Present Continuous",
      "Present Perfect",
    ],
    French: [
      "Présent",
      "Passé Composé",
      "Imparfait",
      "Futur Simple",
    ],
    Spanish: [
      "Presente",
      "Pretérito",
      "Imperfecto",
      "Futuro Simple",
    ],
    Italian: [
      "Presente",
      "Passato Prossimo",
      "Imperfetto",
      "Futuro Semplice",
    ],
    Portuguese: [
      "Presente",
      "Pretérito Perfeito",
      "Pretérito Imperfeito",
      "Futuro do Presente",
    ],
    Romanian: [
      "Prezent",
      "Perfect Compus",
      "Imperfect",
      "Viitor",
    ],
    
  };
  
  const pronouns = {
    English: ["I", "you", "he/she/it", "we", "they"],
    French: ["je", "tu", "il/elle", "nous", "vous", "ils/elles"],
    Spanish: ["yo", "tú", "él/ella", "nosotros", "vosotros", "ellos/ellas"],
    Italian: ["io", "tu", "lui/lei", "noi", "voi", "loro"],
    Portuguese: ["eu", "tu", "ele/ela", "nós", "vós", "eles/elas"],
    Romanian: ["eu", "tu", "el/ea", "noi", "voi", "ei/ele"],
    
  };
  const tenseMapping = {
    "Present Simple": "indicative present",
    "Past Simple": "indicative past tense",
    "Present Continuous": "indicative present continuous",
    "Present Perfect": "indicative present perfect",
  };

  useEffect(() => {
    
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/leaderboard/verb-game"
        );
        const data = await response.json();
        setLeaderboardData(data);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
  }, []);

  const updateHighScore = async (newHighScore) => {
    const username = localStorage.getItem("username"); 
    if (!username) return; 

    try {
      const response = await fetch(
        "http://localhost:5000/api/update-high-score",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            scoreType: "verb_score", 
            scoreValue: newHighScore,
          }),
        }
      );

      const result = await response.json();
      console.log(result.message);
    } catch (error) {
      console.error("Error updating high score:", error);
    }
  };

  useEffect(() => {
    fetchVerbs().then((data) => {
      const verbCards = data.filter(
        (card) => card.word_category.toLowerCase() === "verb"
      );
      setVerbs(verbCards);

     
      if (verbCards.length > 0) {
        const randomVerb =
          verbCards[Math.floor(Math.random() * verbCards.length)];
        const targetLanguage = randomVerb.target_language;
        const languageSpecificTenses =
          languageTenses[targetLanguage] || languageTenses.English;
        const randomTense =
          languageSpecificTenses[
            Math.floor(Math.random() * languageSpecificTenses.length)
          ];
        const randomPronoun =
          pronouns[targetLanguage][
            Math.floor(Math.random() * pronouns[targetLanguage].length)
          ];

        setCurrentVerb(randomVerb.front_text);
        setCurrentTense(randomTense);
        setCurrentPronoun(randomPronoun);
      }
    });
    
  }, []);

  const fetchVerbs = async () => {
    const storedDeckId = localStorage.getItem('selectedDeckId');
    console.log("deckId", storedDeckId);
    const storedUsername = localStorage.getItem("username") || "";
    const response = await fetch(
      `http://localhost:5000/api/flashcards?username=${storedUsername}&deckId=${storedDeckId}`
    );
    if (!response.ok) {
      throw new Error("Could not fetch flashcards");
    }
    return response.json();
  };

  const nextChallenge = () => {
    if (verbs.length > 0) {
      const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];
      const targetLanguage = randomVerb.target_language;
      const languageSpecificTenses = languageTenses[targetLanguage];
      const randomTense =
        languageSpecificTenses[
          Math.floor(Math.random() * languageSpecificTenses.length)
        ];

      let selectedPronouns = pronouns[targetLanguage];
      if (randomTense !== "Present Simple") {
        selectedPronouns = ["I"]; 
      }
      const randomPronoun =
        selectedPronouns[Math.floor(Math.random() * selectedPronouns.length)];

      setCurrentVerb(randomVerb.front_text);
      setCurrentTense(randomTense);
      setCurrentPronoun(randomPronoun);
      setUserAnswer("");
      setFeedback("");
      setHasChecked(false);
    }
  };

  const checkAnswer = async () => {
    try {
      setIsLoading(true);
      const cleanedVerb = currentVerb.replace(/^to\s+/i, "");
      const apiTense = tenseMapping[currentTense] || currentTense;
  
      const url = `http://localhost:5000/api/conjugate?verb=${cleanedVerb}&tense=${apiTense}&pronoun=${currentPronoun}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      const responseData = await response.json();
      const conjugatedFormsString = responseData.conjugatedForms.trim();
      const conjugationData = JSON.parse(conjugatedFormsString);
  
      let updatedScore = score; 
  
      if (conjugationData[apiTense]) {
        const correctAnswer = conjugationData[apiTense][currentPronoun];
        if (correctAnswer) {
          if (userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase()) {
            setFeedback("Correct! Well done.");
            updatedScore += 1; 
          } else {
            setFeedback(`Incorrect. The correct answer is: ${correctAnswer}`);
            updatedScore = 0; 
          }
        } else {
          setFeedback(
            `Pronoun '${currentPronoun}' not found in the tense '${apiTense}'.`
          );
        }
      } else {
        setFeedback(`Tense '${apiTense}' not found in the conjugations.`);
      }
  
      setScore(updatedScore); 
      setHasChecked(true);
      setIsLoading(false);
  
      
      if (updatedScore > highestScore) {
        setHighestScore(updatedScore); 
        updateHighScore(updatedScore); 
      }
    } catch (error) {
      console.error("Failed to check answer:", error);
      setFeedback("Error checking answer. Please try again.");
      setIsLoading(false);
    }
  };
  

  return (
    <div className="container my-4">
      <div className="row">
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="text-center">Verb Practice</h2>
              {currentVerb && (
                <div className="mb-3">
                  <p>
                    Conjugate "<strong>{currentVerb}</strong>"
                    {currentTense === "Present Simple" && (
                      <>
                        {" "}
                        for "<strong>{currentPronoun}</strong>"
                      </>
                    )}{" "}
                    in <strong>{currentTense}</strong>:
                  </p>
                  <input
                    type="text"
                    className="form-control"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type here..."
                  />
                </div>
              )}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button
                  className="btn btn-primary"
                  onClick={checkAnswer}
                  disabled={hasChecked} 
                >
                  Check
                </button>
                <div className="score-display">
                  <h3>Score: {score}</h3>
                </div>
                {isLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <div className="feedback-message">{feedback}</div>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={nextChallenge}
                  disabled={!hasChecked} 
                >
                  Next Verb
                </button>
              </div>
            </div>
          </div>
        </div>
  
       
        <div className="col-md-6">
          <div className="leaderboardContainer">
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
                    <td>{entry.verb_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
  
}

export default VerbPractice;
