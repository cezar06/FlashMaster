import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, FormControl, Alert } from "react-bootstrap";
import "./EditDeck.css";

function EditDeck() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deckDetails, setDeckDetails] = useState({
    deck_name: "",
    source_language: "",
    target_language: "",
    custom_source_language: "",
    custom_target_language: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState("success");

  const availableLanguages = ["English", "Romanian", "Spanish", "French", "Italian", "Portuguese", "Other"];

  useEffect(() => {
    const fetchDeckDetails = async () => {
      try {
        const username = localStorage.getItem("username");
        const response = await fetch(`http://localhost:5000/api/deck_details/?deckId=${deckId}&username=${username}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setDeckDetails({
          ...data,
          custom_source_language: data.source_language,
          custom_target_language: data.target_language
        });
      } catch (error) {
        console.error("Error fetching deck details:", error);
      }
    };

    fetchDeckDetails();
  }, [deckId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeckDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalSourceLanguage = deckDetails.source_language === "Other" ? deckDetails.custom_source_language : deckDetails.source_language;
    const finalTargetLanguage = deckDetails.target_language === "Other" ? deckDetails.custom_target_language : deckDetails.target_language;

    try {
      const response = await fetch(`http://localhost:5000/api/edit_deck/${deckId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deck_name: deckDetails.deck_name,
          source_language: finalSourceLanguage,
          target_language: finalTargetLanguage,
          username: localStorage.getItem("username"),
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const result = await response.json();
      setAlertVariant("success");
      setAlertMessage("Deck edited successfully!");
      setShowAlert(true);
    } catch (error) {
      console.error("Error editing deck:", error);
      setAlertVariant("danger");
      setAlertMessage("Failed to edit deck. Please try again.");
      setShowAlert(true);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Form onSubmit={handleSubmit} className="edit-deck-form">
      <h1>Editing Deck</h1>

      <Form.Group className="mb-3">
        <Form.Label>Deck Name</Form.Label>
        <Form.Control
          type="text"
          name="deck_name"
          value={deckDetails.deck_name}
          onChange={handleInputChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Source Language</Form.Label>
        <Form.Select
          name="source_language"
          value={deckDetails.source_language}
          onChange={handleInputChange}
          required
        >
          {availableLanguages.map((language, index) => (
            <option key={index} value={language}>
              {language}
            </option>
          ))}
        </Form.Select>
        {deckDetails.source_language === "Other" && (
          <FormControl
            type="text"
            placeholder="Enter custom source language..."
            value={deckDetails.custom_source_language}
            onChange={(e) => handleInputChange({ target: { name: "custom_source_language", value: e.target.value }})}
            required
          />
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Target Language</Form.Label>
        <Form.Select
          name="target_language"
          value={deckDetails.target_language}
          onChange={handleInputChange}
          required
        >
          {availableLanguages.map((language, index) => (
            <option key={index} value={language}>
              {language}
            </option>
          ))}
        </Form.Select>
        {deckDetails.target_language === "Other" && (
          <FormControl
            type="text"
            placeholder="Enter custom target language..."
            value={deckDetails.custom_target_language}
            onChange={(e) => handleInputChange({ target: { name: "custom_target_language", value: e.target.value }})}
            required
          />
        )}
      </Form.Group>

      <Button variant="primary" type="submit">
        Save Changes
      </Button>
      <Button variant="secondary" onClick={handleCancel}>
        Cancel
      </Button>
      {showAlert && (
        <Alert
          variant={alertVariant}
          show={showAlert}
          onClose={() => setShowAlert(false)}
          dismissible
          style={{ marginTop: "1rem" }}
        >
          {alertMessage}
        </Alert>
      )}
    </Form>
  );
}

export default EditDeck;
