import React, { useState, useEffect } from "react";
import MiniFlashcardStats from "./MiniFlashcardStats";

import { Button, Form } from "react-bootstrap";
import {
  FaArrowUp,
  FaArrowDown,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa"; 
import "./Collection.css";

function Collection() {
  const [flashcardStats, setFlashcardStats] = useState([]);
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null); // Initialize to null
  const [filteredFlashcardStats, setFilteredFlashcardStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ field: null, order: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const totalPages = Math.ceil(filteredFlashcardStats.length / itemsPerPage);

  useEffect(() => {
    fetchDecks();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedDeck]);

  async function fetchDecks() {
    const username = localStorage.getItem("username");
    try {
      const response = await fetch(
        `http://localhost:5000/api/your_decks/${username}`
      );
      if (!response.ok) throw new Error("Failed to fetch decks.");
      const decksData = await response.json();
      setDecks(decksData);

      
      if (decksData.length > 0) {
        setSelectedDeck(decksData[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  }

  async function fetchStats() {
    if (!selectedDeck) {
      setLoading(false); 
      return;
    }
    try {
      const username = localStorage.getItem("username");
      const url = `http://localhost:5000/api/user/${username}/flashcard-stats?deckId=${selectedDeck}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch statistics.");

      const data = await response.json();
      setFlashcardStats(data);
      setFilteredFlashcardStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  }

  const difficultyToNumber = (difficultyLabel) => {
    switch (difficultyLabel) {
      case "Easy":
        return 1;
      case "Normal":
        return 2;
      case "Hard":
        return 3;
      case "Very Hard":
        return 4;
      default:
        return 0; 
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDeck]);

  const handleDeckChange = (event) => {
    setSelectedDeck(event.target.value);
  };

  const handlePrevPage = () => {
    setCurrentPage(currentPage > 1 ? currentPage - 1 : 1);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages);
  };

  const indexOfLastFlashcard = currentPage * itemsPerPage;
  const indexOfFirstFlashcard = indexOfLastFlashcard - itemsPerPage;
  const currentFlashcards = filteredFlashcardStats.slice(
    indexOfFirstFlashcard,
    indexOfLastFlashcard
  );

  useEffect(() => {
    sortFlashcards();
  }, [flashcardStats, searchTerm, sortConfig]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const toggleSort = (field) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.field === field && prevConfig.order === "desc") {
        return { field: null, order: null };
      } else if (prevConfig.field === field) {
        return {
          field,
          order: prevConfig.order === "asc" ? "desc" : "asc",
        };
      } else {
        return { field, order: "asc" };
      }
    });
  };

  function sortFlashcards() {
    let sorted = [...flashcardStats];

    if (sortConfig.field) {
      sorted.sort((a, b) => {
        let fieldA = a[sortConfig.field];
        let fieldB = b[sortConfig.field];

        if (
          sortConfig.field === "next_review_date" ||
          sortConfig.field === "last_review_date"
        ) {
          fieldA = fieldA ? new Date(fieldA) : new Date(0);
          fieldB = fieldB ? new Date(fieldB) : new Date(0);
        } else if (typeof fieldA === "string") {
          fieldA = fieldA.toLowerCase();
          fieldB = fieldB.toLowerCase();
        }

        if (fieldA < fieldB) {
          return sortConfig.order === "asc" ? -1 : 1;
        }
        if (fieldA > fieldB) {
          return sortConfig.order === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

   
    sorted = sorted.filter(
      (flashcard) =>
        flashcard.front_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flashcard.back_text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredFlashcardStats(sorted);
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Your Flashcards</h2>
      <div>
        <Form.Control
          as="select"
          value={selectedDeck || ""} 
          onChange={handleDeckChange}
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.deck_name}
            </option>
          ))}
        </Form.Control>
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search flashcards..."
        className="search-input"
      />
      <div className="sorting-buttons-container">
        <button
          onClick={() => toggleSort("front_text")}
          className="sort-button"
        >
          A-Z (Front)
          {sortConfig.field === "front_text" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button onClick={() => toggleSort("back_text")} className="sort-button">
          A-Z (Back)
          {sortConfig.field === "back_text" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          onClick={() => toggleSort("times_reviewed")}
          className="sort-button"
        >
          Times Reviewed
          {sortConfig.field === "times_reviewed" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          onClick={() => toggleSort("times_recalled_successfully")}
          className="sort-button"
        >
          Times Recalled Successfully
          {sortConfig.field === "times_recalled_successfully" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          onClick={() => toggleSort("average_difficulty")}
          className="sort-button"
        >
          Average Difficulty
          {sortConfig.field === "average_difficulty" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          onClick={() => toggleSort("next_review_date")}
          className="sort-button"
        >
          Next Review
          {sortConfig.field === "next_review_date" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
        <button
          onClick={() => toggleSort("last_review_date")}
          className="sort-button"
        >
          Last Review
          {sortConfig.field === "last_review_date" &&
            (sortConfig.order === "asc" ? <FaArrowUp /> : <FaArrowDown />)}
        </button>
      </div>
      <div>
        <Button onClick={handlePrevPage} disabled={currentPage === 1}>
          <FaChevronLeft /> Previous
        </Button>
        <span className="mx-3 align-self-center">
          Page {currentPage} of {totalPages}
        </span>
        <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next <FaChevronRight />
        </Button>
      </div>
      <div className="flashcard-stats-grid">
        {currentFlashcards.map((flashcard) => (
          <MiniFlashcardStats key={flashcard.flashcard_id} data={flashcard} />
        ))}
      </div>
    </div>
  );
}

export default Collection;
