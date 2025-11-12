'use client';
import { createContext, useContext, useState } from 'react';
import ProProgressBar from '../Motions/ProProgressiveBar';

const ProgressBarContext = createContext({
  start: () => {},
  done: () => {},
});

export const useProgressBar = () => useContext(ProgressBarContext);

export const ProgressBarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isActive, setIsActive] = useState(false);

  const start = () => setIsActive(true);
  const done = () => setIsActive(false);

  return (
    <ProgressBarContext.Provider value={{ start, done }}>
      <>{children}</>
      <ProProgressBar isActive={isActive} />
    </ProgressBarContext.Provider>
  );
};