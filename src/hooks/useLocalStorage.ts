"use client";

import { useState, useEffect, type Dispatch, type SetStateAction, useCallback } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Initialize state from localStorage only on the client
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}” during initializaion:`, error);
      return initialValue;
    }
  });

  // Effect to update localStorage when storedValue changes (e.g. from another tab via 'storage' event)
  // This effect now also handles the initial read, simplifying the initial state logic.
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        const parsedItem = JSON.parse(item) as T;
        // Only update if the parsed item is different from current state to avoid loops
        if (JSON.stringify(parsedItem) !== JSON.stringify(storedValue)) {
           setStoredValue(parsedItem);
        }
      } else {
         // If item is not in localStorage (e.g. cleared), set it to initialValue
         // and update state if it's not already initialValue.
         window.localStorage.setItem(key, JSON.stringify(initialValue));
         if (JSON.stringify(initialValue) !== JSON.stringify(storedValue)) {
            setStoredValue(initialValue);
         }
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}” in effect:`, error);
      // Fallback to initialValue if error
      setStoredValue(initialValue);
      try {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      } catch (lsError) {
        console.warn(`Error setting localStorage key “${key}” after read error:`, lsError);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Rerun if key changes. storedValue removed to prevent re-setting localStorage unecessarily.

  const setValue: SetValue<T> = useCallback(
    (valueOrFn: T | ((prevState: T) => T)) => {
      setStoredValue(prevState => {
        const newValue = valueOrFn instanceof Function ? valueOrFn(prevState) : valueOrFn;
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(key, JSON.stringify(newValue));
          } catch (error) {
            console.warn(`Error setting localStorage key “${key}”:`, error);
          }
        }
        return newValue;
      });
    },
    [key] // setValue's reference is stable, only depending on `key`.
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue !== null) {
          try {
            setStoredValue(JSON.parse(event.newValue) as T);
          } catch (error) {
            console.warn(`Error parsing storage change for key “${key}”:`, error);
            // If parsing fails, reset to initialValue.
            // Avoid direct call to setValue here to prevent potential loops if initialValue itself causes issues.
            setStoredValue(initialValue); 
            window.localStorage.setItem(key, JSON.stringify(initialValue));
          }
        } else { 
          // Item was removed from localStorage
          setStoredValue(initialValue);
          window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]); // initialValue is needed here if state resets to it.

  return [storedValue, setValue];
}

export default useLocalStorage;