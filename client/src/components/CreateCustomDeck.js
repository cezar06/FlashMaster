import React, { useState } from "react";
import { Button, Form, FormControl, Alert } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CreateCustomDeck.css";

function CreateCustomDeck() {
  const [deckName, setDeckName] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("Romanian");
  const [customSourceLanguage, setCustomSourceLanguage] = useState("");
  const [customTargetLanguage, setCustomTargetLanguage] = useState("");
  const [responseMessage, setResponseMessage] = useState({ type: "", message: "" });

  const languages = ["English", "Romanian", "Spanish", "French", "Italian", "Portuguese", "Other"];

  const handleCreateDeck = async (event) => {
    event.preventDefault();
    const finalSourceLanguage = sourceLanguage === "Other" ? customSourceLanguage : sourceLanguage;
    const finalTargetLanguage = targetLanguage === "Other" ? customTargetLanguage : targetLanguage;

    const deckData = {
      username: localStorage.getItem("username"), 
      deck_name: deckName,
      source_language: finalSourceLanguage,
      target_language: finalTargetLanguage,
    };

    try {
      const response = await fetch("http://localhost:5000/api/custom_decks/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deckData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Network response was not ok.");
      }

      setResponseMessage({ type: "success", message: "Deck created successfully!" });
    } catch (error) {
      setResponseMessage({ type: "danger", message: error.message });
    }
  };

  return (
    <div className="create-custom-deck p-3">
      <Form onSubmit={handleCreateDeck}>
        <h2>Create Deck</h2>
        <Form.Group className="mb-3">
          <Form.Label>Deck Name:</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter deck name..."
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Source Language:</Form.Label>
          <Form.Select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
          >
            {languages.map((language, index) => (
              <option key={index} value={language}>{language}</option>
            ))}
          </Form.Select>
          {sourceLanguage === "Other" && (
            <FormControl
              type="text"
              placeholder="Enter custom source language..."
              value={customSourceLanguage}
              onChange={(e) => setCustomSourceLanguage(e.target.value)}
              required={sourceLanguage === "Other"}
            />
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Target Language:</Form.Label>
          <Form.Select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            {languages.map((language, index) => (
              <option key={index} value={language}>{language}</option>
            ))}
          </Form.Select>
          {targetLanguage === "Other" && (
            <FormControl
              type="text"
              placeholder="Enter custom target language..."
              value={customTargetLanguage}
              onChange={(e) => setCustomTargetLanguage(e.target.value)}
              required={targetLanguage === "Other"}
            />
          )}
        </Form.Group>

        <Button variant="primary" type="submit">
          Create Deck
        </Button>

        {responseMessage.message && (
          <Alert variant={responseMessage.type} className="mt-3">
            {responseMessage.message}
          </Alert>
        )}
      </Form>
    </div>
  );
}

export default CreateCustomDeck;
