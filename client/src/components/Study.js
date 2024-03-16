import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Table from "react-bootstrap/Table";
import "./Study.css";

function Study() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [showImageButton, setShowImageButton] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [flashcard, setFlashcard] = useState(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    const storedUsername = localStorage.getItem("username");
    try {
      const response = await fetch(
        `http://localhost:5000/api/your_decks/${storedUsername}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setDecks(data);
    } catch (error) {
      console.error("Error fetching decks:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashcard = async (deckId) => {
    if (!deckId) return;

    setLoading(true);
    setError(null);
    setImage(null);
    setShowImageButton(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/next_custom_flashcard/${deckId}`
      );

      if (response.status === 204) {
        setMessage("You have reviewed all flashcards in this deck.");
        setFlashcard(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setFlashcard(data);
    } catch (error) {
      console.error("Error fetching flashcard:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeckSelection = (deckId) => {
    console.log("Deck Selected:", deckId);
    setSelectedDeck(deckId);
    fetchFlashcard(deckId);
  };

  const updateStatistics = async (flashcardId, difficulty, rating) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/custom_flashcards/statistics_update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            flashcardId: flashcardId,
            difficulty: difficulty,
            rating: rating,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Statistics update failed");
      }
    } catch (error) {
      console.error("Error updating flashcard statistics:", error);
    }
  };

  const handleToggleTranslation = async () => {
    if (!showTranslation) {
      const translatedText = await translateSentence(
        flashcard?.example_sentence
      );
      setFlashcard({ ...flashcard, translated_text: translatedText });
    }
    setShowTranslation(!showTranslation);
  };

  const renderExampleSentence = (sentence, boldedWords) => {
    if (!sentence || !boldedWords) return "";

    const spacedBoldedWords = ` ${boldedWords.trim()} `;

    const parts = sentence.split(new RegExp(`(${spacedBoldedWords})`, "i"));
    return parts.map((part, index) =>
      part.toLowerCase() === spacedBoldedWords.trim().toLowerCase() ? (
        <strong key={index}>{` ${part} `}</strong>
      ) : (
        part
      )
    );
  };

  const getLanguageCode = (language) => {
    const languageMap = {
      English: "EN",
      Spanish: "ES",
      French: "FR",
      Romanian: "RO",
    };
    return languageMap[language] || "en-US";
  };

  const speak = async (text, language) => {
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
    const url =
      "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;

    const requestData = {
      input: { text: text },
      voice: {
        languageCode: getLanguageCode(language || flashcard?.target_language),
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      playAudio(data.audioContent);
    } catch (error) {
      console.error("Error in text-to-speech:", error);
    }
  };

  const playAudio = (base64Audio) => {
    const audio = new Audio("data:audio/mp3;base64," + base64Audio);
    audio.play();
  };

  const fetchImage = async (word) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${word}&client_id=NOKuwnFTTLGHM62omPLe5zLVIcf9xbEfujJiuZZYuXQ`
      );
      if (!response.ok) {
        throw new Error("Image fetch failed");
      }
      const data = await response.json();
      if (data.results.length > 0) {
        setImage(data.results[0].urls.small);
      } else {
        setImage(null);
      }
    } catch (error) {
      console.error("Failed to fetch image:", error);
    }
  };

  const translateSentence = async (sentence) => {
    const sourceLang = getLanguageCode(flashcard?.target_language);
    const targetLang = getLanguageCode(flashcard?.source_language);
    try {
      const response = await fetch("https://api-free.deepl.com/v2/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `auth_key=2352096d-566c-ba42-5de2-5e9842a25a9f:fx&text=${encodeURIComponent(
          sentence
        )}&source_lang=${sourceLang}&target_lang=${targetLang}`,
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

  useEffect(() => {
    if (selectedDeck === null) {
      fetchDecks();
    }
  }, [selectedDeck]);

  const handleResetProgress = async () => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      alert("Username not found");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/flashcards/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: storedUsername }),
        }
      );

      if (response.ok) {
        alert("Progress reset successfully");
        fetchFlashcard();
      } else {
        alert("Failed to reset progress");
      }
    } catch (error) {
      console.error("Error resetting progress:", error);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSubmit = async (difficulty) => {
    const storedUsername = localStorage.getItem("username");
    setMessage(`Marked "${flashcard?.front_text}" as ${difficulty}`);
    setTimeout(() => setMessage(""), 3000);

    try {
      const rating = calculateRating(difficulty);

      const response = await fetch(
        "http://localhost:5000/api/custom_flashcards/user_update",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: storedUsername,
            flashcardId: flashcard.id,
            difficulty: difficulty,
            rating: rating,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update flashcard");
      }

      await updateStatistics(flashcard.id, difficulty, rating);

      fetchFlashcard(selectedDeck);
      setIsFlipped(false);
    } catch (error) {
      console.error("Error updating flashcard:", error);
    }
  };

  const calculateRating = (difficulty) => {
    switch (difficulty) {
      case "Wrong":
        return 1;
      case "Easy":
        return 4;
      case "Correct":
        return 3;
      case "Hard":
        return 2;
      default:
        return 0;
    }
  };

  const handleShowImage = () => {
    if (flashcard?.front_text) {
      fetchImage(flashcard.front_text);
      setShowImageButton(false);
    }
  };

  useEffect(() => {
    console.log("Decks State:", decks);
  }, [decks]);

  useEffect(() => {
    console.log("Selected Deck State:", selectedDeck);
  }, [selectedDeck]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        {!selectedDeck && (
          <div className="col-lg-8">
            <Table className="table-no-outline">
              <thead>
                <tr>
                  <th>Deck</th>
                  <th>New</th>
                  <th>To Review</th>
                </tr>
              </thead>
              <tbody>
                {decks.map((deck) => (
                  <tr
                    key={deck.id}
                    onClick={() => handleDeckSelection(deck.id)}
                  >
                    <td>{deck.deck_name}</td>
                    <td className="text-new">
                      {deck.remaining_new_flashcards}
                    </td>{" "}
                    <td className="text-to-review">{deck.review_count}</td>{" "}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        <div className="col-md-8">
          {selectedDeck &&
            (flashcard ? (
              <div
                className={`card text-white bg-dark ${
                  isFlipped ? "flipped" : ""
                }`}
              >
                {!isFlipped ? (
                  <div
                    className="card-body d-flex flex-column justify-content-between"
                    style={{ height: "100%" }}
                  >
                    <div className="d-flex justify-content-center align-items-center">
                      <h2 className="card-title text-dark me-2">
                        {flashcard?.front_text}
                      </h2>
                      <button
                        className="btn btn-link text-dark p-0"
                        onClick={() => speak(flashcard?.front_text)}
                      >
                        <i className="fas fa-play"></i>
                      </button>
                    </div>
                    {image && (
                      <div className="text-center" style={{ flex: 1 }}>
                        <img
                          src={image}
                          alt="Visual representation"
                          className="img-fluid rounded mb-3"
                        />
                      </div>
                    )}
                    <div className="mt-3 d-flex justify-content-center">
                      {showImageButton && (
                        <button
                          className="btn btn-dark mx-2"
                          onClick={handleShowImage}
                        >
                          Show Image
                        </button>
                      )}
                      <button
                        className="btn btn-dark mx-2"
                        onClick={handleFlip}
                      >
                        Flip
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="card-body">
                    <h2
                      className="card-title text-dark text-center"
                      style={{ flex: 1 }}
                    >
                      {flashcard?.front_text}
                    </h2>
                    <hr className="my-2" />
                    <h2 className="card-title text-dark ">
                      {flashcard?.back_text}
                    </h2>

                    <p className="card-text d-flex align-items-center">
                      {renderExampleSentence(
                        flashcard?.example_sentence,
                        flashcard?.bolded_text
                      )}
                      <button
                        className="btn btn-link text-dark"
                        onClick={() => speak(flashcard?.example_sentence)}
                      >
                        <i className="fas fa-play"></i>
                      </button>
                    </p>
                    <div className="mb-3">
                      {!showTranslation ? (
                        <button
                          className="btn btn-link text-primary"
                          onClick={handleToggleTranslation}
                        >
                          Translate via DeepL
                        </button>
                      ) : (
                        <p className="text-dark">
                          {flashcard?.translated_text}
                        </p>
                      )}
                    </div>
                    <div className="d-flex justify-content-around">
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleSubmit("Wrong")}
                      >
                        Wrong
                      </button>
                      <button
                        className="btn btn-outline-success"
                        onClick={() => handleSubmit("Easy")}
                      >
                        Easy
                      </button>
                      <button
                        className="btn btn-outline-success"
                        onClick={() => handleSubmit("Correct")}
                      >
                        Correct
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => handleSubmit("Hard")}
                      >
                        Hard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : message ? (
              <div className="text-center py-5">
                <h2>{message}</h2>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => setSelectedDeck(null)}
                >
                  Go Back to Deck Selection
                </button>
              </div>
            ) : (
              <div className="text-center py-5">
                <h2>Loading flashcards...</h2>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Study;
