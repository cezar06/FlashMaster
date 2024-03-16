import React, { useState, useEffect } from "react";
import { Form, Button, Table, Pagination } from "react-bootstrap";
import "./CustomFlashcardsViewer.css";

const CustsomFlashcardsViewer = () => {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
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

  const [editableFlashcard, setEditableFlashcard] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 5;
  const lastEntryIndex = currentPage * entriesPerPage;
  const firstEntryIndex = lastEntryIndex - entriesPerPage;
  const currentEntries = flashcards.slice(firstEntryIndex, lastEntryIndex);

  useEffect(() => {
    const fetchDecks = async () => {
      setIsLoading(true);
      try {
        const username = localStorage.getItem("username");
        const response = await fetch(
          `http://localhost:5000/api/users/${username}/decks`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch decks");
        }

        const data = await response.json();
        setDecks(data.decks);

        if (data.decks.length > 0) {
          setSelectedDeck(data.decks[0].id);
        }
      } catch (error) {
        console.error("Error fetching decks:", error);
      }
      setIsLoading(false);
    };

    fetchDecks();
  }, []);

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (selectedDeck) {
        setIsLoading(true);
        try {
          const username = localStorage.getItem("username");
          const response = await fetch(
            `http://localhost:5000/api/${username}/decks/${selectedDeck}/flashcards`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch flashcards");
          }

          const data = await response.json();
          setFlashcards(data.flashcards);
        } catch (error) {
          console.error("Error fetching flashcards:", error);
        }
        setIsLoading(false);
      }
    };

    fetchFlashcards();
  }, [selectedDeck]);

  const handleEdit = (flashcard) => {
    setEditingId(flashcard.id);
    setEditableFlashcard({
      front_text: flashcard.front_text,
      back_text: flashcard.back_text,
      example_sentence: flashcard.example_sentence,
      word_category: flashcard.word_category,
    });
  };

  const totalPages = Math.ceil(flashcards.length / entriesPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleDelete = async (flashcardId) => {
    const username = localStorage.getItem("username");
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this flashcard?"
    );
    if (confirmDelete) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/flashcards/${flashcardId}?username=${encodeURIComponent(
            username
          )}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Could not delete flashcard");
        }

        setFlashcards((prevFlashcards) =>
          prevFlashcards.filter((fc) => fc.id !== flashcardId)
        );
      } catch (error) {
        console.error("Error deleting flashcard:", error);
      }
    }
  };

  const handleSave = async (flashcardId) => {
    const deck_id = flashcards.find((fc) => fc.id === flashcardId)?.deck_id;
    console.log("Saving flashcard with data:", editableFlashcard);

    const flashcardData = {
      ...editableFlashcard,
      username: localStorage.getItem("username"),
      deck_id: deck_id,
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/edit_flashcard/${flashcardId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(flashcardData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedFlashcard = await response.json();
      setFlashcards((prev) =>
        prev.map((fc) => (fc.id === flashcardId ? updatedFlashcard : fc))
      );
      setEditingId(null);
    } catch (error) {
      console.error("Error saving flashcard:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleFieldChange = (field, value) => {
    setEditableFlashcard((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mt-4">
      <Form.Group controlId="deckSelect" className="mb-3">
        <Form.Control
          as="select"
          className="form-select"
          onChange={(e) => setSelectedDeck(e.target.value)}
        >
          {decks.map((deck) => (
            <option key={deck.id} value={deck.id}>
              {deck.deck_name}
            </option>
          ))}
        </Form.Control>
      </Form.Group>

      <div className="table-responsive">
        <Table striped bordered hover className="text-center">
          <thead className="thead-dark">
            <tr>
              <th className="w-25">Target</th>
              <th className="w-25">Source</th>
              <th className="w-25">Example Sentence</th>
              <th className="w-25">Word Category</th>
              <th className="w-auto">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentEntries.map((flashcard) => {
              const isEditing = editingId === flashcard.id;
              return (
                <tr key={flashcard.id}>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        value={editableFlashcard.front_text || ""}
                        onChange={(e) =>
                          handleFieldChange("front_text", e.target.value)
                        }
                      />
                    ) : (
                      flashcard.front_text
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        value={editableFlashcard.back_text || ""}
                        onChange={(e) =>
                          handleFieldChange("back_text", e.target.value)
                        }
                      />
                    ) : (
                      flashcard.back_text
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        type="text"
                        value={editableFlashcard.example_sentence || ""}
                        onChange={(e) =>
                          handleFieldChange("example_sentence", e.target.value)
                        }
                      />
                    ) : (
                      flashcard.example_sentence
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <Form.Control
                        as="select"
                        value={editableFlashcard.word_category || ""}
                        onChange={(e) =>
                          handleFieldChange("word_category", e.target.value)
                        }
                      >
                        {wordCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </Form.Control>
                    ) : (
                      flashcard.word_category
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <Button
                          variant="success"
                          className="mr-2"
                          onClick={() => handleSave(flashcard.id)}
                        >
                          Save
                        </Button>
                        <Button variant="secondary" onClick={handleCancel}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline-warning"
                          onClick={() => handleEdit(flashcard)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={() => handleDelete(flashcard.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <Pagination className="justify-content-center">
        <Pagination.First
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {[...Array(totalPages).keys()].map((page) => (
          <Pagination.Item
            key={page + 1}
            active={page + 1 === currentPage}
            onClick={() => handlePageChange(page + 1)}
          >
            {page + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
};

export default CustsomFlashcardsViewer;
