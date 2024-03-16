import React, { useState, useEffect, useContext } from "react";
import {DeckContext} from './DeckContext';
import "./Quiz.css";

function Quiz() {
  const [flashcards, setFlashcards] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [score, setScore] = useState(0);
  const { selectedDeckId } = useContext(DeckContext);

  const mapLanguageToCode = (languageName) => {
    const languageMap = {
      English: "EN",
      French: "FR",
      Spanish: "ES",
      Italian: "IT",
      Portuguese: "PT",
      Romanian: "RO",
      
    };
    return languageMap[languageName] || languageName; 
  };

  const isWordAtStart = (sentence, word) => {
    const trimmedSentence = sentence.trim();
    const regex = new RegExp("^" + word, "i");
    return regex.test(trimmedSentence);
  };

  const updateScore = () => {
    let newScore = 0;
    flashcards.forEach((flashcard) => {
      if (
        userAnswers[flashcard.id] &&
        userAnswers[flashcard.id].toLowerCase() ===
          flashcard.front_text.trim().toLowerCase()
      ) {
        newScore++;
      }
    });
    setScore(newScore);
  };

  useEffect(() => {
    updateScore();
  }, [userAnswers]);


  const refreshQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizResults(null);
    const storedUsername = localStorage.getItem("username") || "";
    if (storedUsername) {
      fetchFlashcards(storedUsername);
    }
  };

  const translateSentence = async (
    sentence,
    sourceLanguageName,
    targetLanguageName
  ) => {
    const sourceLangCode = mapLanguageToCode(sourceLanguageName);
    const targetLangCode = mapLanguageToCode(targetLanguageName);

    try {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=2352096d-566c-ba42-5de2-5e9842a25a9f:fx&text=${encodeURIComponent(
          sentence
        )}&source_lang=${targetLangCode}&target_lang=${sourceLangCode}`,
      });

      const data = await response.json();

      if (data.translations && data.translations.length > 0) {
        return data.translations[0].text;
      } else {
        throw new Error("Translation failed");
      }
    } catch (error) {
      console.error("Error translating sentence:", error);
      return ""; 
    }
  };

  const replaceWordInSentence = (sentence, word) => {
   
    const regex = new RegExp(word, "i");
    let updatedSentence = sentence.replace(regex, "______");

    
    if (!updatedSentence.trim().endsWith(".")) {
      updatedSentence += ".";
    }

    return updatedSentence;
  };

  const normalizeCapitalization = (word, sentence = "") => {
    if (sentence && isWordAtStart(sentence, word)) {
      
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    } else {
     
      return word.toLowerCase();
    }
  };

  const calculateResults = () => {
    let correctCount = 0;
    flashcards.forEach((flashcard) => {
      if (
        userAnswers[flashcard.id] &&
        userAnswers[flashcard.id].toLowerCase() ===
          flashcard.front_text.trim().toLowerCase()
      ) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const fetchFlashcards = async (username) => {
    try {
      
      const response = await fetch(
        `http://localhost:5000/api/limited-flashcards?username=${username}&limit=5&includeVerbs=false&deckId=${selectedDeckId}`
      );

      if (!response.ok) {
        throw new Error("Could not fetch flashcards");
      }

      const fetchedFlashcards = await response.json();

      
      const flashcardsWithTranslations = await Promise.all(
        fetchedFlashcards.map(async (flashcard) => {
          const translatedSentence = flashcard.example_sentence
            ? await translateSentence(
                flashcard.example_sentence,
                flashcard.source_language,
                flashcard.target_language
              )
            : "";
          return {
            ...flashcard,
            translatedSentence,
          };
        })
      );

      setFlashcards(flashcardsWithTranslations);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    if (storedUsername) {
      fetchFlashcards(storedUsername);
    }
  }, []);

  const handleChange = (flashcardId, selectedOption) => {
    setUserAnswers((prevUserAnswers) => ({
      ...prevUserAnswers,
      [flashcardId]: selectedOption,
    }));
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    const correctCount = calculateResults();
    setQuizResults(
      `You got ${correctCount} out of ${flashcards.length} questions correct!`
    );
  };

  const renderQuizOptions = (
    flashcard,
    correctAnswerLower,
    userAnswerLower
  ) => {
    return flashcard.options.map((option, index) => {
      const optionId = `question-${flashcard.id}-option-${index}`;
      const normalizedOption = normalizeCapitalization(
        option.trim(),
        flashcard.example_sentence
      );
      const optionIsCorrect =
        normalizedOption.toLowerCase() === correctAnswerLower;
      const optionClass =
        quizSubmitted && optionIsCorrect ? "correct-option" : "";

      return (
        <label key={optionId} className={`custom-radio-button ${optionClass}`}>
          {normalizedOption}
          <input
            type="radio"
            id={optionId}
            name={`question-${flashcard.id}`}
            value={normalizedOption}
            onChange={(e) => handleChange(flashcard.id, e.target.value)}
            checked={userAnswers[flashcard.id] === normalizedOption}
            disabled={quizSubmitted}
          />
          <span className="checkmark"></span>
        </label>
      );
    });
  };

  const renderQuizQuestions = () => {
    return flashcards.map((flashcard) => {
      const userAnswerLower = userAnswers[flashcard.id]?.toLowerCase();
      const correctAnswerLower = flashcard.front_text.trim().toLowerCase();

      
      const isCorrect = userAnswerLower === correctAnswerLower;

      
      const questionStyle = quizSubmitted
        ? isCorrect
          ? "correct-answer"
          : "wrong-answer"
        : "";

      return (
        <div
          className={`row quiz-question ${questionStyle}`}
          key={flashcard.id}
        >
          <div className="col-12 quiz-content">
            <p>
              {replaceWordInSentence(
                flashcard.example_sentence,
                flashcard.front_text
              )}
              {flashcard.translatedSentence
                ? ` (${flashcard.translatedSentence})`
                : ""}
            </p>
            <div className="quiz-options">
              {renderQuizOptions(
                flashcard,
                correctAnswerLower,
                userAnswerLower
              )}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={`quiz-container ${quizSubmitted ? "quiz-submitted" : ""}`}>
      <div className="quiz-header">
        <h2 className="text-center">Fill in the word</h2>
        <button className="refresh-btn" onClick={refreshQuiz}>
          <i className="fa fa-refresh"></i>
        </button>
      </div>
      <form onSubmit={(e) => e.preventDefault()}>
        {renderQuizQuestions()}
        <div className="button-group">
          <button
            className="submit-btn"
            onClick={handleSubmitQuiz}
            disabled={quizSubmitted}
          >
            Submit Quiz
          </button>
        </div>
      </form>
    </div>
  );
  
}

export default Quiz;
