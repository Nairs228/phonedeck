import React, { createContext, useState, useContext } from "react";

// Create Context
const BonusContext = createContext();

// Bonus Provider Component
export const BonusProvider = ({ children }) => {
  const [userBonuses, setUserBonuses] = useState(999); // Initial bonuses
  const [history, setHistory] = useState([]); // History of spent bonuses

  return (
    <BonusContext.Provider
      value={{ userBonuses, setUserBonuses, history, setHistory }}
    >
      {children}
    </BonusContext.Provider>
  );
};

// Custom hook for using the BonusContext
export const useBonus = () => useContext(BonusContext);
