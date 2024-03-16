import React, { useState, useEffect, useCallback } from "react";
import { Form, Card, ListGroup, Button } from "react-bootstrap";
import _ from "lodash";
import { useNavigate } from "react-router-dom";

const BrowseDecks = () => {
  const [decks, setDecks] = useState([]);
  const [searchParams, setSearchParams] = useState({
    deckName: "",
    sourceLanguage: "",
    targetLanguage: "",
    tags: "",
  });
  const navigate = useNavigate();

  const fetchDecks = useCallback(async () => {
    try {
      const queryParams = Object.entries(searchParams).reduce(
        (acc, [key, value]) => {
          if (value) {
            acc.append(key, value);
          }
          return acc;
        },
        new URLSearchParams()
      );

      const response = await fetch(
        `http://localhost:5000/api/browse_decks?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch decks");
      }

      const data = await response.json();
      setDecks(data);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [searchParams]);

  const debouncedFetchDecks = useCallback(_.debounce(fetchDecks, 500), [
    fetchDecks,
  ]);

  useEffect(() => {
    debouncedFetchDecks();
  }, [debouncedFetchDecks]);

  const handleSearchChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  };

  const resetFilters = () => {
    setSearchParams({
      deckName: "",
      sourceLanguage: "",
      targetLanguage: "",
      tags: "",
    });
    debouncedFetchDecks();
  };

  const handleViewDeck = (deckId) => {
    navigate(`/deck/${deckId}`);
  };

  return (
    <div>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Deck Name</Form.Label>
          <Form.Control
            type="text"
            value={searchParams.deckName}
            onChange={(e) => handleSearchChange("deckName", e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Source Language</Form.Label>
          <Form.Control
            type="text"
            value={searchParams.sourceLanguage}
            onChange={(e) =>
              handleSearchChange("sourceLanguage", e.target.value)
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Target Language</Form.Label>
          <Form.Control
            type="text"
            value={searchParams.targetLanguage}
            onChange={(e) =>
              handleSearchChange("targetLanguage", e.target.value)
            }
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Tags</Form.Label>
          <Form.Control
            type="text"
            value={searchParams.tags}
            onChange={(e) => handleSearchChange("tags", e.target.value)}
          />
        </Form.Group>
        <Button
          variant="secondary"
          onClick={resetFilters}
          className="mr-2"
          style={{ marginBottom: "20px" }}
        >
          Reset Filters
        </Button>
      </Form>

      <div>
        {decks.map((deck) => (
          <Card key={deck.id} className="mb-3 position-relative">
            <Button
              variant="primary"
              onClick={() => handleViewDeck(deck.id)}
              className="position-absolute top-0 end-0 mt-2 me-2"
            >
              View
            </Button>
            <Card.Body>
              <Card.Title>{deck.deck_name}</Card.Title>
              <Card.Text>{deck.deck_description}</Card.Text>
              <ListGroup variant="flush">
                <ListGroup.Item>Author: {deck.author}</ListGroup.Item>
                <ListGroup.Item>
                  Source Language: {deck.source_language}
                </ListGroup.Item>
                <ListGroup.Item>
                  Target Language: {deck.target_language}
                </ListGroup.Item>
                <ListGroup.Item>Tags: {deck.tags.join(", ")}</ListGroup.Item>
                <ListGroup.Item>
                  Flashcards: {deck.flashcards_count}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BrowseDecks;
