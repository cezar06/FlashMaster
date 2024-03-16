import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import "./CreateFlashcard.css";

const CreateFlashcard = () => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [example_sentence, setExampleSentence] = useState("");
  const [deck_name, setSelectedDeck] = useState("");
  const [userDecks, setUserDecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  const wordCategories = [
    { value: "noun", label: "Noun" },
    { value: "adjective", label: "Adjective" },
    { value: "verb", label: "Verb" },
    { value: "adverb", label: "Adverb" },
    { value: "pronoun", label: "Pronoun" },
    { value: "conjunction", label: "Conjunction" },
    { value: "preposition", label: "Preposition" },
    { value: "other", label: "Other" },
  ];

  const [wordCategory, setWordCategory] = useState(wordCategories[0].value);

  const handleSubmit = async (event, forceAdd = false) => {
    event.preventDefault();

    const flashcardData = {
      username: localStorage.getItem("username"),
      front: front,
      back: back,
      example_sentence: example_sentence,
      word_category: wordCategory,
      deck_id: deck_name,
      forceInsert: forceAdd,
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/create-flashcard",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(flashcardData),
        }
      );

      if (!response.ok) {
        if (response.status === 409 && !forceAdd) {
          setDuplicateAlert(true);
          setAlertMessage(
            "Flashcard with the same front text already exists. Add anyway?"
          );
          setShowAlert(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setAlertMessage("Flashcard created successfully!");
      setShowAlert(true);
      setDuplicateAlert(false);

      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (error) {
      console.error("Error creating flashcard:", error);
      setAlertMessage("Error creating flashcard. Please try again.");
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const fetchUserDecks = async () => {
      try {
        const username = localStorage.getItem("username");
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:5000/api/users/${username}/decks`
        );
        const responseData = await response.json();
        setUserDecks(responseData.decks);
        setIsLoading(false);

        if (responseData.decks.length > 0) {
          setSelectedDeck(responseData.decks[0].id);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchUserDecks();
  }, []);

  return (
    <div>
      <Form onSubmit={(e) => handleSubmit(e)}>
        <h2>Create Flashcard</h2>
        <Form.Group controlId="formWord">
          <Form.Label>Word in target language:</Form.Label>
          <Form.Control
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formTranslation">
          <Form.Label>Word in source language:</Form.Label>
          <Form.Control
            type="text"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group controlId="formExampleSentence">
          <Form.Label>Example sentence:</Form.Label>
          <Form.Control
            type="text"
            value={example_sentence}
            onChange={(e) => setExampleSentence(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="formDeckSelect" className="dropdown-with-icon">
          <Form.Label>Deck</Form.Label>
          <div className="custom-dropdown">
            <Form.Control
              as="select"
              value={deck_name}
              onChange={(e) => setSelectedDeck(e.target.value)}
            >
              {isLoading ? (
                <option>Loading...</option>
              ) : (
                userDecks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.deck_name}
                  </option>
                ))
              )}
            </Form.Control>
            <i className="fas fa-chevron-down"></i>
          </div>
        </Form.Group>

        <Form.Group controlId="formWordCategory" className="dropdown-with-icon">
          <Form.Label>Word Category</Form.Label>
          <div className="custom-dropdown">
            <Form.Control
              as="select"
              value={wordCategory}
              onChange={(e) => setWordCategory(e.target.value)}
              required
            >
              {wordCategories.map((category, index) => (
                <option key={index} value={category.value}>
                  {category.label}
                </option>
              ))}
            </Form.Control>
            <i className="fas fa-chevron-down"></i>
          </div>
        </Form.Group>

        <Button variant="primary" type="submit" style={{ marginTop: "10px" }}>
          Create Flashcard
        </Button>
      </Form>

      {showAlert && (
        <div
          className={`alert alert-with-margin ${
            alertMessage.startsWith("Error") ? "alert-danger" : "alert-success"
          }`}
          role="alert"
        >
          {alertMessage}
        </div>
      )}

      {duplicateAlert && (
        <div className="alert alert-warning alert-with-margin" role="alert">
          {alertMessage}
          <Button
            variant="outline-success"
            onClick={(e) => handleSubmit(e, true)}
            style={{ marginLeft: "10px" }}
          >
            Add Anyway
          </Button>
        </div>
      )}
    </div>
  );
};

export default CreateFlashcard;
