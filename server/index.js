const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
require("dotenv").config();


app.use(cors());
app.use(express.json());

//ROUTES//

app.get("/api/user-decks/:username", async (req, res) => {
  try {
    const username = req.params.username;
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    const decksResult = await pool.query(
      "SELECT * FROM custom_decks WHERE user_id = $1",
      [userId]
    );

    res.json(decksResult.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/leaderboard/verb-game", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT users.username, high_scores.verb_score
       FROM users
       JOIN high_scores ON users.id = high_scores.user_id
       WHERE high_scores.verb_score IS NOT NULL
       ORDER BY high_scores.verb_score DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/leaderboard/sentence-game", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT users.username, high_scores.sentence_score 
       FROM users 
       JOIN high_scores ON users.id = high_scores.user_id 
       WHERE high_scores.sentence_score IS NOT NULL
       ORDER BY high_scores.sentence_score DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/leaderboard/match-game", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT users.username, high_scores.match_score 
       FROM users 
       JOIN high_scores ON users.id = high_scores.user_id 
       WHERE high_scores.match_score IS NOT NULL
       ORDER BY high_scores.match_score DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/userid", async (req, res) => {
  const { username } = req.query;

  try {
    const result = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (result.rows.length > 0) {
      res.json({ userId: result.rows[0].id });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/flashcards-new", async (req, res) => {
  const { userId, deckId } = req.query;

  try {
    let query = "SELECT * FROM custom_flashcards WHERE user_id = $1";
    let params = [userId];

    if (deckId) {
      query += " AND deck_id = $2 ORDER BY RANDOM() LIMIT 1";
      params.push(deckId);
    } else {
      query += " ORDER BY RANDOM() LIMIT 1";
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/update-high-score", async (req, res) => {
  try {
    const { username, scoreType, scoreValue } = req.body;

    
    const validScoreTypes = [
      "match_score",
      "sentence_score",
      "verb_score",
      "other_score_type1",
      "other_score_type2",
    ];

    if (!validScoreTypes.includes(scoreType)) {
      return res.status(400).json({ message: "Invalid score type" });
    }

    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    
    const highScoresResult = await pool.query(
      `SELECT * FROM high_scores WHERE user_id = $1`,
      [userId]
    );

    if (highScoresResult.rows.length === 0) {
      
      const insertQuery = `INSERT INTO high_scores (user_id, ${scoreType}) VALUES ($1, $2)`;
      await pool.query(insertQuery, [userId, scoreValue]);
    } else {
      
      const currentScore = highScoresResult.rows[0][scoreType] || 0;
      if (scoreValue > currentScore) {
        const updateQuery = `UPDATE high_scores SET ${scoreType} = $2 WHERE user_id = $1`;
        await pool.query(updateQuery, [userId, scoreValue]);
      }
    }

    res.json({ message: "High score updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/high-score", async (req, res) => {
  

  try {
    const username = req.query.username;
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;
    const highScoresResult = await pool.query(
      "SELECT * FROM high_scores WHERE user_id = $1",
      [userId]
    );

    res.json(highScoresResult.rows);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/limited-flashcards", async (req, res) => {
  try {
    const username = req.query.username;
    const limit = parseInt(req.query.limit) || 5;
    const includeVerbs = req.query.includeVerbs === "true";
    const deckId = req.query.deckId; // Extract deckId from query

    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    let flashcardsQuery;
    if (includeVerbs) {
      // Query to fetch flashcards including verbs
      flashcardsQuery = `
        SELECT flashcards.*, decks.target_language, decks.source_language
        FROM custom_flashcards AS flashcards 
        JOIN custom_decks AS decks ON flashcards.deck_id = decks.id 
        WHERE flashcards.user_id = $1 AND flashcards.deck_id = $3
        ORDER BY RANDOM() 
        LIMIT $2`;
    } else {
      // Query to fetch flashcards excluding verbs
      flashcardsQuery = `
        SELECT flashcards.*, decks.target_language, decks.source_language
        FROM custom_flashcards AS flashcards 
        JOIN custom_decks AS decks ON flashcards.deck_id = decks.id 
        WHERE flashcards.user_id = $1 AND flashcards.word_category <> 'verb' AND flashcards.deck_id = $3
        ORDER BY RANDOM() 
        LIMIT $2`;
    }

    const flashcardsResult = await pool.query(flashcardsQuery, [
      userId,
      limit,
      deckId,
    ]);

    // Load word lists for all needed languages
    const languages = [
      ...new Set(
        flashcardsResult.rows.map((flashcard) => flashcard.target_language)
      ),
    ];
    const wordLists = {};
    for (const language of languages) {
      wordLists[language] = await readWordsFromFile(language);
    }

    // Generate options for each flashcard
    const flashcardsWithOptions = flashcardsResult.rows.map((flashcard) => {
      const distractors = selectDistractors(
        flashcard.front_text,
        wordLists[flashcard.target_language]
      );
      return {
        ...flashcard,
        options: shuffle([flashcard.front_text, ...distractors]),
      };
    });

    res.json(flashcardsWithOptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching flashcards" });
  }
});

app.get("/api/conjugate", (req, res) => {
  const verbToConjugate = req.query.verb;
  const tense = req.query.tense; 
  const language = "en";
  const pronoun = req.query.pronoun || "I";

  
  const command = `python conjugate.py ${verbToConjugate} ${tense} ${language}`;
  console.log("Executing:", command);

  const pythonProcess = spawn("python", [
    "conjugate.py",
    verbToConjugate,
    "indicative",
    language,
  ]);

  let conjugatedForms = "";

  pythonProcess.stdout.on("data", (data) => {
    conjugatedForms += data.toString();
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      res.json({ conjugatedForms });
    } else {
      res.status(500).json({ message: "Conjugation failed" });
    }
  });
});

async function readWordsFromFile(language) {
  const filePath = path.join(__dirname, `${language.toLowerCase()}_words.txt`);
  const data = await fs.readFile(filePath, "utf8");
  return data.split("\n").filter((word) => word.trim());
}

function selectDistractors(correctWord, wordList) {
  let distractors = new Set();
  while (distractors.size < 3) {
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    if (randomWord !== correctWord) {
      distractors.add(randomWord);
    }
  }
  return Array.from(distractors);
}

app.get("/api/flashcards", async (req, res) => {
  try {
    const username = req.query.username;
    const deck_id = req.query.deckId; 

   
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    
    const flashcardsResult = await pool.query(
      `SELECT flashcards.*, decks.target_language, decks.source_language
       FROM custom_flashcards AS flashcards 
       JOIN custom_decks AS decks ON flashcards.deck_id = decks.id 
       WHERE flashcards.user_id = $1 AND flashcards.deck_id = $2`, 
      [userId, deck_id]
    );

    
    const languages = [
      ...new Set(
        flashcardsResult.rows.map((flashcard) => flashcard.target_language)
      ),
    ];

    const wordLists = {};
    for (const language of languages) {
      wordLists[language] = await readWordsFromFile(language);
    }

    const flashcardsWithOptions = flashcardsResult.rows.map((flashcard) => {
      const distractors = selectDistractors(
        flashcard.front_text,
        wordLists[flashcard.target_language]
      );
      return {
        ...flashcard,
        options: shuffle([flashcard.front_text, ...distractors]),
      };
    });

    res.json(flashcardsWithOptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching flashcards" });
  }
});

const shuffle = (array) => {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;
  
  while (currentIndex !== 0) {
    
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
};

app.get("/api/next_custom_flashcard/:deckId", async (req, res) => {
  try {
    const { deckId } = req.params;

    
    let flashcardResult = await pool.query(
      `SELECT cf.*, cd.source_language, cd.target_language FROM custom_flashcards cf
      JOIN review_custom_flashcards rcf ON cf.id = rcf.flashcard_id
      JOIN custom_decks cd ON cf.deck_id = cd.id
      WHERE cf.deck_id = $1 AND rcf.times_reviewed = 0
      LIMIT 1`,
      [deckId]
    );

    
    if (flashcardResult.rows.length === 0) {
      flashcardResult = await pool.query(
        `SELECT cf.*, cd.source_language, cd.target_language FROM custom_flashcards cf
        JOIN review_custom_flashcards rcf ON cf.id = rcf.flashcard_id
        JOIN custom_decks cd ON cf.deck_id = cd.id
        WHERE cf.deck_id = $1 AND rcf.next_review_date <= CURRENT_DATE
        ORDER BY rcf.next_review_date ASC
        LIMIT 1`,
        [deckId]
      );

      if (flashcardResult.rows.length === 0) {
        return res
          .status(204)
          .json({ message: "No flashcards left to review." });
      }
    }

    res.json(flashcardResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/browse_decks", async (req, res) => {
  try {
    const { deckName, sourceLanguage, targetLanguage, tags } = req.query;

    let query = `
      SELECT cd.id, cd.deck_name, cd.deck_description, cd.source_language, cd.target_language,
             cd.tags, u.username AS author, COUNT(cf.id) AS flashcards_count
      FROM custom_decks cd
      JOIN users u ON cd.user_id = u.id
      LEFT JOIN custom_flashcards cf ON cd.id = cf.deck_id`;

    let queryParams = [];
    let conditions = [];

    if (deckName) {
      queryParams.push(`%${deckName}%`);
      conditions.push(`cd.deck_name ILIKE $${queryParams.length}`);
    }
    if (sourceLanguage) {
      queryParams.push(sourceLanguage);
      conditions.push(`cd.source_language = $${queryParams.length}`);
    }
    if (targetLanguage) {
      queryParams.push(targetLanguage);
      conditions.push(`cd.target_language = $${queryParams.length}`);
    }
    if (tags && tags.length > 0) {
      queryParams.push(`%${tags}%`);
      conditions.push(`cd.tags::text ILIKE $${queryParams.length}`);
    }

    if (conditions.length) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " GROUP BY cd.id, u.username ORDER BY cd.id";

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/:username/decks/:deckId/flashcards", async (req, res) => {
  const username = req.params.username;
  const deckId = req.params.deckId;
  try {
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const deckResult = await pool.query(
      "SELECT * FROM custom_decks WHERE id = $1 AND user_id = $2",
      [deckId, userId]
    );
    if (deckResult.rows.length === 0) {
      return res.status(404).json({ message: "Deck not found" });
    }

    const flashcardsResult = await pool.query(
      "SELECT * FROM custom_flashcards WHERE deck_id = $1 AND user_id = $2 ORDER BY created_at DESC",
      [deckId, userId]
    );
    res.json({ flashcards: flashcardsResult.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/:username/decks", async (req, res) => {
  try {
    const username = req.params.username;
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;
    const decksResult = await pool.query(
      "SELECT * FROM custom_decks WHERE user_id = $1",
      [userId]
    );
    res.json({ decks: decksResult.rows });
  } catch (error) {
    console.log(error);
  }
});

app.put("/api/edit_flashcard/:id", async (req, res) => {
  try {
    const flashcardId = req.params.id;
    const {
      front_text,
      back_text,
      example_sentence,
      word_category,
      deck_id,
      username,
    } = req.body;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const flashcardResult = await pool.query(
      "SELECT * FROM custom_flashcards WHERE id = $1 AND user_id = $2",
      [flashcardId, userId]
    );
    if (flashcardResult.rows.length === 0) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    await pool.query(
      "UPDATE custom_flashcards SET front_text = $1, back_text = $2, example_sentence = $3, word_category = $4, deck_id = $5 WHERE id = $6",
      [
        front_text,
        back_text,
        example_sentence,
        word_category,
        deck_id,
        flashcardId,
      ]
    );

    const updatedFlashcardResult = await pool.query(
      "SELECT * FROM custom_flashcards WHERE id = $1",
      [flashcardId]
    );

    if (updatedFlashcardResult.rows.length > 0) {
      res.json(updatedFlashcardResult.rows[0]);
    } else {
      res.status(404).json({ message: "Flashcard not found after update" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/flashcards/:id", async (req, res) => {
  try {
    const flashcardId = req.params.id;
    const username = req.query.username;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const flashcardResult = await pool.query(
      "SELECT * FROM custom_flashcards WHERE id = $1 AND user_id = $2",
      [flashcardId, userId]
    );
    if (flashcardResult.rows.length === 0) {
      return res.status(404).json({ message: "Flashcard not found" });
    }

    await pool.query(
      "DELETE FROM custom_flashcards WHERE id = $1 AND user_id = $2",
      [flashcardId, userId]
    );

    res.json({ message: "Flashcard deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/users/:username/decks_settings", async (req, res) => {
  try {
    const username = req.params.username;
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userResult.rows[0].id;

    const decksAndSettingsResult = await pool.query(
      "SELECT d.id, d.deck_name, ds.flashcards_per_day FROM custom_decks d LEFT JOIN deck_settings ds ON d.id = ds.deck_id WHERE d.user_id = $1",
      [userId]
    );

    res.json(decksAndSettingsResult.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching decks and settings" });
  }
});

app.put("/api/users/:username/save_deck_settings", async (req, res) => {
  try {
    const { username } = req.params;
    const { deck_id, flashcards_per_day } = req.body;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const deckResult = await pool.query(
      "SELECT * FROM custom_decks WHERE id = $1 AND user_id = $2",
      [deck_id, userId]
    );

    if (deckResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Deck not found or user does not have permission" });
    }

    await pool.query(
      "INSERT INTO deck_settings (user_id, deck_id, flashcards_per_day) VALUES ($1, $2, $3) ON CONFLICT (deck_id) DO UPDATE SET flashcards_per_day = EXCLUDED.flashcards_per_day",
      [userId, deck_id, flashcards_per_day]
    );

    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/custom_flashcards/:deckId", async (req, res) => {
  try {
    const deckId = req.params.deckId;
    const flashcardsResult = await pool.query(
      "SELECT * FROM custom_flashcards WHERE deck_id = $1",
      [deckId]
    );
    res.json(flashcardsResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/edit_deck/:id", async (req, res) => {
  try {
    const deckId = req.params.id;
    const { deck_name, source_language, target_language } = req.body;

    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [req.body.username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    
    const deckResult = await pool.query(
      "SELECT * FROM custom_decks WHERE id = $1 AND user_id = $2",
      [deckId, userId]
    );
    if (deckResult.rows.length === 0) {
      return res.status(404).json({ message: "Deck not found" });
    }

    
    const updateResult = await pool.query(
      "UPDATE custom_decks SET deck_name = $1, source_language = $2, target_language = $3 WHERE id = $4",
      [deck_name, source_language, target_language, deckId]
    );
    res.json({ message: "Deck updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/deck_details/", async (req, res) => {
  const { deckId, username } = req.query;
  try {
    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;
    
    const deckResult = await pool.query(
      "SELECT * FROM custom_decks WHERE id = $1 AND user_id = $2",
      [deckId, userId]
    );
    if (deckResult.rows.length === 0) {
      return res.status(404).json({ message: "Deck not found" });
    }
    res.json(deckResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});
app.delete("/api/delete_deck/:id", async (req, res) => {
  try {
    const deckId = req.params.id;
    const username = req.body.username;
    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;
    
    const deckResult = await pool.query(
      "SELECT * FROM custom_decks WHERE id = $1 AND user_id = $2",
      [deckId, userId]
    );
    if (deckResult.rows.length === 0) {
      return res.status(404).json({ message: "Deck not found" });
    }
    
    await pool.query("DELETE FROM custom_decks WHERE id = $1", [deckId]);
    res.json({ message: "Deck deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/your_decks/:username", async (req, res) => {
  try {
    const username = req.params.username;

    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    
    const deckResult = await pool.query(
      `
      SELECT d.*, ds.flashcards_per_day
      FROM custom_decks d
      LEFT JOIN deck_settings ds ON d.id = ds.deck_id
      WHERE d.user_id = $1
      `,
      [userId]
    );

    const today = new Date().toISOString().slice(0, 10); 

    for (let deck of deckResult.rows) {
      
      const reviewCountResult = await pool.query(
        `
        SELECT COUNT(*)
        FROM review_custom_flashcards
        WHERE deck_id = $1
          AND next_review_date <= $2
          AND times_reviewed != 0
        `,
        [deck.id, today]
      );
      deck.review_count = parseInt(reviewCountResult.rows[0].count, 10);

      
      const newCardsResult = await pool.query(
        `
        SELECT COUNT(*) as count
        FROM review_custom_flashcards
        WHERE deck_id = $1 AND times_reviewed = 0
        `,
        [deck.id]
      );
      const totalNewCards = parseInt(newCardsResult.rows[0].count, 10);

      
      const activityResult = await pool.query(
        `
        SELECT new_flashcards_count
        FROM user_daily_flashcard_activity
        WHERE user_id = $1 AND deck_id = $2 AND date = $3
        `,
        [userId, deck.id, today]
      );

      const newFlashcardsReviewedToday =
        activityResult.rows.length > 0
          ? parseInt(activityResult.rows[0].new_flashcards_count, 10)
          : 0;

      const potentialNewFlashcards =
        deck.flashcards_per_day - newFlashcardsReviewedToday;

      
      deck.remaining_new_flashcards = Math.max(
        0,
        Math.min(totalNewCards, potentialNewFlashcards)
      );
    }

    res.json(deckResult.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/create-flashcard", async (req, res) => {
  try {
    const {
      username,
      front,
      back,
      example_sentence,
      deck_id,
      word_category,
      forceInsert,
    } = req.body;

    
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    
    const deckResult = await pool.query(
      "SELECT * FROM custom_decks WHERE id = $1 AND user_id = $2",
      [deck_id, userId]
    );
    if (deckResult.rows.length === 0) {
      return res.status(404).json({ message: "Deck not found" });
    }

    
    if (!forceInsert) {
      const duplicateCheck = await pool.query(
        "SELECT * FROM custom_flashcards WHERE deck_id = $1 AND user_id = $2 AND front_text = $3",
        [deck_id, userId, front]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({
          message:
            "Flashcard with the same front text already exists in this deck.",
        });
      }
    }

    
    const flashcardResult = await pool.query(
      "INSERT INTO custom_flashcards (user_id, deck_id, front_text, back_text, example_sentence, word_category, bolded_text) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [userId, deck_id, front, back, example_sentence, word_category, front]
    );
    const newFlashcard = flashcardResult.rows[0];

    
    const userFlashcardResult = await pool.query(
      "INSERT INTO review_custom_flashcards (user_id, flashcard_id, deck_id, next_review_date, review_interval, times_reviewed, times_recalled_successfully, average_difficulty) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [userId, newFlashcard.id, deck_id, new Date(), 1, 0, 0, 0]
    );

    
    await pool.query(
      "INSERT INTO custom_flashcard_statistics (flashcard_id, times_encountered, times_failed, times_succeeded, average_rating) VALUES ($1, $2, $3, $4, $5)",
      [newFlashcard.id, 0, 0, 0, 0]
    );

    res.json({
      flashcard: newFlashcard,
      userFlashcard: userFlashcardResult.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/custom_decks/create", async (req, res) => {
  try {
    const { username, deck_name, source_language, target_language } = req.body;

   
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    
    const deckNameResult = await pool.query(
      "SELECT deck_name FROM custom_decks WHERE deck_name = $1",
      [deck_name]
    );

    if (deckNameResult.rows.length > 0) {
      return res.status(400).json({ message: "Deck name already exists" });
    }

    
    const deckResult = await pool.query(
      "INSERT INTO custom_decks (user_id, deck_name, source_language, target_language) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, deck_name, source_language, target_language]
    );

    res.json(deckResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/user/:username/flashcard-stats", async (req, res) => {
  const { username } = req.params;
  const { deckId } = req.query; 

 
  const userResult = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );
  if (userResult.rows.length === 0) {
    return res.status(404).json({ message: "User not found" });
  }
  const userId = userResult.rows[0].id;

  
  let statsQuery = `
    SELECT 
      rcf.flashcard_id,
      cf.front_text,
      cf.back_text,
      rcf.times_reviewed,
      rcf.times_recalled_successfully,
      rcf.average_difficulty,
      rcf.next_review_date,
      rcf.last_review_date
    FROM 
      review_custom_flashcards rcf
    JOIN 
      custom_flashcards cf ON rcf.flashcard_id = cf.id
    WHERE 
      rcf.user_id = $1
  `;

  let queryParams = [userId];

  
  if (deckId) {
    statsQuery += " AND cf.deck_id = $2";
    queryParams.push(deckId);
  }

  try {
    const statsResult = await pool.query(statsQuery, queryParams);
    res.json(statsResult.rows);
  } catch (err) {
    console.error("Error fetching custom flashcard statistics:", err);
    res.status(500).send("Error fetching statistics");
  }
});

app.post("/api/custom_flashcards/statistics_update", async (req, res) => {
  const { flashcardId, difficulty, rating } = req.body;

  if (!flashcardId || !difficulty || rating == null) {
    return res
      .status(400)
      .send("Flashcard ID, difficulty level, and rating are required.");
  }

  try {
    
    await pool.query("BEGIN");

    
    const statsResult = await pool.query(
      "SELECT * FROM custom_flashcard_statistics WHERE flashcard_id = $1;",
      [flashcardId]
    );

    if (statsResult.rows.length === 0) {
      return res.status(404).send("Statistics record not found.");
    }

    
    const stats = statsResult.rows[0];
    const newTimesEncountered = stats.times_encountered + 1;
    const newTimesFailed =
      stats.times_failed + (difficulty === "Wrong" ? 1 : 0);
    const newTimesSucceeded =
      stats.times_succeeded + (difficulty !== "Wrong" ? 1 : 0);
    const newAverageRating =
      stats.times_encountered === 0
        ? rating
        : (stats.average_rating * stats.times_encountered + rating) /
          newTimesEncountered;

   
    await pool.query(
      `UPDATE custom_flashcard_statistics
       SET times_encountered = $2, times_failed = $3, times_succeeded = $4, average_rating = $5
       WHERE flashcard_id = $1;`,
      [
        flashcardId,
        newTimesEncountered,
        newTimesFailed,
        newTimesSucceeded,
        newAverageRating,
      ]
    );

    
    await pool.query("COMMIT");
    res.status(200).send("Statistics updated successfully");
  } catch (err) {
    
    await pool.query("ROLLBACK");
    console.error("Error updating custom flashcard statistics:", err);
    res.status(500).send("Error updating statistics");
  }
});

app.post("/api/flashcards/reset", async (req, res) => {
  try {
    const { username } = req.body;

   
    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    
    await pool.query("DELETE FROM user_flashcards WHERE user_id = $1", [
      userId,
    ]);

    res.json({ message: "Progress reset successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/custom_flashcards/user_update", async (req, res) => {
  try {
    const { username, flashcardId, difficulty } = req.body;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    const flashcardResult = await pool.query(
      "SELECT * FROM review_custom_flashcards WHERE user_id = $1 AND flashcard_id = $2",
      [userId, flashcardId]
    );

    if (flashcardResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Flashcard review record not found" });
    }

    const reviewRecord = flashcardResult.rows[0];
    const lastReviewDate = reviewRecord.last_review_date
      ? new Date(reviewRecord.last_review_date)
      : new Date();
    const reviewInterval = reviewRecord.review_interval;
    const timesReviewed = reviewRecord.times_reviewed + 1;
    const timesRecalledSuccessfully =
      reviewRecord.times_recalled_successfully +
      (difficulty !== "Wrong" ? 1 : 0);
    const newDifficultyRating = calculateDifficultyRating(difficulty);
    const newDifficulty =
      (reviewRecord.average_difficulty * (timesReviewed - 1) +
        newDifficultyRating) /
      timesReviewed;

    
    const newReviewInterval = calculateNewReviewInterval(
      reviewInterval,
      difficulty
    );

    
    const nextReviewDate = calculateNextReviewDate(
      lastReviewDate,
      newReviewInterval
    );

    await pool.query(
      "UPDATE review_custom_flashcards SET next_review_date = $1, last_review_date = CURRENT_DATE, review_interval = $2, difficulty = $3, times_reviewed = $4, times_recalled_successfully = $5, average_difficulty = $6 WHERE user_id = $7 AND flashcard_id = $8",
      [
        nextReviewDate,
        newReviewInterval, 
        difficulty,
        timesReviewed,
        timesRecalledSuccessfully,
        newDifficulty,
        userId,
        flashcardId,
      ]
    ); 

    const isNewFlashcard = reviewRecord.times_reviewed === 0;
    const today = new Date().toISOString().slice(0, 10); 

    if (isNewFlashcard) {
      const activityResult = await pool.query(
        `
        SELECT * FROM user_daily_flashcard_activity 
        WHERE user_id = $1 AND deck_id = $2 AND date = $3
      `,
        [userId, reviewRecord.deck_id, today]
      );

      if (activityResult.rows.length > 0) {
        
        await pool.query(
          `
          UPDATE user_daily_flashcard_activity 
          SET new_flashcards_count = new_flashcards_count + 1
          WHERE user_id = $1 AND deck_id = $2 AND date = $3
        `,
          [userId, reviewRecord.deck_id, today]
        );
      } else {
        
        await pool.query(
          `
          INSERT INTO user_daily_flashcard_activity (user_id, deck_id, date, new_flashcards_count)
          VALUES ($1, $2, $3, 1)
        `,
          [userId, reviewRecord.deck_id, today]
        );
      }
    }

    res.json({ message: "Custom flashcard review updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function calculateNewReviewInterval(currentInterval, difficulty) {
  switch (difficulty) {
    case "Easy":
      return currentInterval * 2.0; 
    case "Hard":
      return Math.max(1, currentInterval * 0.75); 
    case "Wrong":
      return 1; 
    default: 
      return currentInterval * 1.4; 
  }
}


function calculateDifficultyRating(difficulty) {
  switch (difficulty) {
    case "Easy":
      return 1; 
    case "Correct":
      return 2; 
    case "Hard":
      return 3; 
    case "Wrong":
      return 4; 
    default:
      return 0; 
  }
}


function calculateNextReviewDate(lastReviewDate, newInterval) {
  const today = new Date();
  const startDate = new Date(lastReviewDate);
  const startFromTodayOrLastReview = startDate < today ? today : startDate;
  const nextReviewDate = new Date(startFromTodayOrLastReview);
  nextReviewDate.setDate(nextReviewDate.getDate() + Math.round(newInterval));
  return nextReviewDate;
} 

app.get("/api/flashcards/random", async (req, res) => {
  try {
    const username = req.query.username;

    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userResult.rows[0].id;

    
    const reviewFlashcardQuery = `
      SELECT f.id, f.english_word, f.romanian_word, f.example_sentence, f.bolded_words
      FROM flashcards f
      JOIN user_flashcards uf ON f.id = uf.flashcard_id
      WHERE uf.user_id = $1 AND uf.next_review_date <= CURRENT_DATE
      ORDER BY RANDOM()
      LIMIT 1
    `;
    const reviewFlashcardResult = await pool.query(reviewFlashcardQuery, [
      userId,
    ]);

    if (reviewFlashcardResult.rows.length > 0) {
      res.json(reviewFlashcardResult.rows[0]);
    } else {
      
      const newFlashcardQuery = `
        SELECT f.id, f.english_word, f.romanian_word, f.example_sentence, f.bolded_words
        FROM flashcards f
        WHERE NOT EXISTS (
          SELECT 1 FROM user_flashcards uf WHERE uf.flashcard_id = f.id AND uf.user_id = $1
        )
        ORDER BY RANDOM()
        LIMIT 1
      `;
      const newFlashcardResult = await pool.query(newFlashcardQuery, [userId]);

      if (newFlashcardResult.rows.length > 0) {
        res.json(newFlashcardResult.rows[0]);
      } else {
        res.status(200).json({ message: "No new flashcards available" });
      }
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post("/api/submit", async (req, res) => {
  try {
    const { username, answers } = req.body;

    if (!username || !Array.isArray(answers)) {
      return res.status(400).send("Invalid request data");
    }

    console.log("Received answers:", answers);

    const userResult = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }
    const userId = userResult.rows[0].id;

    
    const questionIds = answers.map((answer) => answer.questionId);

    
    const questionsQuery = `
      SELECT question_id, skill_name, correct_answer
      FROM multiple_choice
      WHERE question_id = ANY($1)
    `;
    const questionsResult = await pool.query(questionsQuery, [questionIds]);

    const questionsData = questionsResult.rows.reduce((acc, row) => {
      acc[row.question_id] = {
        skillName: row.skill_name,
        correctAnswer: row.correct_answer,
      };
      return acc;
    }, {});

    let correctCount = 0;
    let results = [];

    for (const answer of answers) {
      const questionInfo = questionsData[answer.questionId];
      if (!questionInfo) {
        console.log(
          `Question info not found for question ID: ${answer.questionId}`
        );
        continue; 
      }

      
      const isAnswerBlank = answer.answer.trim() === "";
      const correct =
        !isAnswerBlank && questionInfo.correctAnswer === answer.answer;
      const scoreChange = correct ? 1 : -1;

      
      if (scoreChange === -1) {
        const updateResult = await pool.query(
          `UPDATE user_skills
           SET score = score + $1
           WHERE user_id = $2 AND skill_name = $3 AND score > 0`,
          [scoreChange, userId, questionInfo.skillName]
        );

        console.log(
          `Updated skill score for user ${userId}, skill ${questionInfo.skillName}, rows affected: ${updateResult.rowCount}`
        );
      }

      correctCount += correct ? 1 : 0;
      results.push({
        questionId: answer.questionId,
        correct: correct,
        correctAnswer: questionInfo.correctAnswer || "N/A", 
      });
    }

    console.log(`Number of correct answers: ${correctCount}`);
    res
      .status(200)
      .json({ message: "Your skills have been updated accordingly.", results });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/api/questions/weak-skills", async (req, res) => {
  const { username } = req.query;

  try {
    const randomQuestionsQuery = `
      SELECT mc.question_id, mc.skill_name, mc.difficulty_level, mc.translation, mc.choices, mc.correct_answer, mc.sentence
      FROM multiple_choice mc
      ORDER BY RANDOM()
      LIMIT 10
    `;
    const randomQuestionsResult = await pool.query(randomQuestionsQuery);
    const questions = randomQuestionsResult.rows;

    if (!questions || questions.length === 0) {
      return res.status(404).send("No questions found");
    }

    res.json(questions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.get("/api/skills", async (req, res) => {
  try {
    const { username } = req.query;
    const userQuery = {
      text: "SELECT id FROM users WHERE username = $1",
      values: [username],
    };
    const userResult = await pool.query(userQuery);

    if (userResult.rows.length === 0) {
      return res.status(404).send("User not found");
    }

    const userId = userResult.rows[0].id;

    const skillsQuery = {
      text: `SELECT skill_name, score
             FROM user_skills
             WHERE user_id = $1
             ORDER BY score DESC`, 
      values: [userId],
    };
    const skillsResult = await pool.query(skillsQuery);
    const skillScores = skillsResult.rows.map((row) => ({
      skill: row.skill_name,
      score: row.score,
    }));

    res.json(skillScores);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const checkQuery = {
    text: "SELECT * FROM users WHERE username = $1 OR email = $2",
    values: [username, email],
  };
  try {
    const checkResult = await pool.query(checkQuery);
    if (checkResult.rows.length > 0) {
      res.status(400).send("Username or email already exists");
    } else {
      const insertUserQuery = {
        text: "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id",
        values: [username, email, password],
      };
      const userResult = await pool.query(insertUserQuery);
      const userId = userResult.rows[0].id;

      const insertSkillsQuery = {
        text: "INSERT INTO user_skills (user_id) VALUES ($1)",
        values: [userId],
      };
      await pool.query(insertSkillsQuery);

      
      const insertHighScoresQuery = {
        text: "INSERT INTO high_scores (user_id, match_score, sentence_score, verb_score) VALUES ($1, 0, 0, 0)",
        values: [userId],
      };
      await pool.query(insertHighScoresQuery);

      res.status(201).json(userResult.rows[0]);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const query = {
    text: "SELECT * FROM users WHERE username = $1 AND password = $2",
    values: [username, password],
  };
  try {
    const result = await pool.query(query);
    if (result.rows.length > 0) {
      const token = jwt.sign({ username }, process.env.JWT_SECRET);
      res.cookie("session", token, { httpOnly: true });
      res.sendStatus(200);
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("session");
  res.send({ message: "Logout successful" });
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
