import React, { useState, useEffect } from "react";
import { Form, Button, Alert } from "react-bootstrap";

const Settings = () => {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchDecksAndSettings = async () => {
      setIsLoading(true);
      try {
        const username = localStorage.getItem("username");
        const response = await fetch(
          `http://localhost:5000/api/users/${username}/decks_settings`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch decks and settings");
        }

        const decksWithSettings = await response.json();

        setDecks(decksWithSettings);

          
          
        const newSettings = {};
        decksWithSettings.forEach((deck) => {
          newSettings[deck.id] = deck.flashcards_per_day || 0;
        });

        setSettings(newSettings);
      } catch (error) {
        console.error("Error fetching decks and settings:", error);
      }
      setIsLoading(false);
    };

    fetchDecksAndSettings();
  }, []);

  const handleDeckChange = (deckId) => {
    setSelectedDeck(deckId);
  };

  const handleSettingChange = (value) => {
    setSettings((prev) => ({ ...prev, [selectedDeck]: value }));
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setSaveSuccess(false);   
    try {
      const username = localStorage.getItem("username");
      const response = await fetch(
        `http://localhost:5000/api/users/${username}/save_deck_settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deck_id: selectedDeck,
            flashcards_per_day: parseInt(settings[selectedDeck], 10),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

        
      setSaveSuccess(true);   

        
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
        
    }
    setIsLoading(false);
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Control
          as="select"
          value={selectedDeck}
          onChange={(e) => handleDeckChange(e.target.value)}
          className="custom-select"
        >
          <option value="">Select Deck</option>
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.deck_name}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      {selectedDeck && (
        <Form.Group className="mb-3">
          <Form.Label>
            {decks.find((deck) => deck.id === selectedDeck)?.deck_name}New
            flashcards per day:
          </Form.Label>
          <Form.Control
            type="number"
            value={settings[selectedDeck]}
            onChange={(e) => handleSettingChange(e.target.value)}
            className="w-auto"
            style={{ maxWidth: "100px" }}
          />
        </Form.Group>
      )}

      <Button
        variant="primary"
        onClick={saveSettings}
        disabled={isLoading || !selectedDeck}
      >
        Save Settings
      </Button>

      {saveSuccess && (
        <Alert variant="success" className="mt-3">
          Settings saved successfully!
        </Alert>
      )}


      {isLoading && <p>Loading...</p>}
    </div>
  );
};

export default Settings;
