import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "react-bootstrap";

function YourDecks() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDecks() {
      try {
        
        const username = localStorage.getItem("username");
        const response = await fetch(`http://localhost:5000/api/your_decks/${username}`, {
          headers: {
            
            "Content-Type": "application/json",
            username: username,
          },
        });

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const decks = await response.json();
        setDecks(decks);
      } catch (error) {
        console.error("Error fetching decks:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDecks();
  }, []);

  const handleDelete = async (deckId) => {
    try {
      
      const username = localStorage.getItem("username");
      const response = await fetch(
        `http://localhost:5000/api/delete_deck/${deckId}`,
        {
          method: "DELETE",
          headers: {
            
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete deck");
      }

      
      setDecks(decks.filter((deck) => deck.id !== deckId));
    } catch (error) {
      console.error("Error deleting deck:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mt-3">
      <h2>Your Decks</h2>
      <ul className="list-unstyled">
        {decks.map((deck) => (
          <li key={deck.id} className="border p-3 mb-2 bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <span>{deck.deck_name}</span>
              <div>
                <Link to={`/edit_deck/${deck.id}`}>
                  <Button variant="primary" className="mr-2">
                    Edit
                  </Button>
                </Link>
                <Button variant="danger" onClick={() => handleDelete(deck.id)}>
                  Delete
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default YourDecks;
