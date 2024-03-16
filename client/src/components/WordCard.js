import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const WordCard = ({ word, index }) => {
  return (
    <Draggable draggableId={word} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="word-card">
          {word}
        </div>
      )}
    </Draggable>
  );
};

export default WordCard;
