import React, { createContext, useState, useEffect } from 'react';

export const DeckContext = createContext();

export const DeckProvider = ({ children }) => {
  const [selectedDeckId, setSelectedDeckId] = useState(() => {
    const storedDeckId = localStorage.getItem('selectedDeckId');
    return storedDeckId ? storedDeckId : null;
  });

  useEffect(() => {
    if (selectedDeckId) {
      localStorage.setItem('selectedDeckId', selectedDeckId);
    }
  }, [selectedDeckId]);

  return (
    <DeckContext.Provider value={{ selectedDeckId, setSelectedDeckId }}>
      {children}
    </DeckContext.Provider>
  );
};
