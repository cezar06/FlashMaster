import React from 'react';
import './MiniFlashcardStats.css';

function MiniFlashcardStats({ data }) {
  const formatDate = (dateString) => {
    if (!dateString) return ''; 
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }

  const difficultyLabel = (averageDifficulty) => {
    if (averageDifficulty <= 1.25) return 'Easy';
    if (averageDifficulty <= 2.5) return 'Normal';
    if (averageDifficulty <= 3.75) return 'Hard';
    return 'Very Hard'; 
  }

  return (
    <div className="mini-flashcard">
      <h3>{data.front_text} / {data.back_text}</h3>
      <ul>
        <li>Times Reviewed: {data.times_reviewed}</li>
        <li>Times Recalled Successfully: {data.times_recalled_successfully}</li>
        <li>Average Difficulty: {difficultyLabel(Number(data.average_difficulty))}</li>
        <li>Next Review: {formatDate(data.next_review_date)}</li>
        <li>Last Review: {formatDate(data.last_review_date)}</li>
      </ul>
    </div>
  );
}

export default MiniFlashcardStats;
