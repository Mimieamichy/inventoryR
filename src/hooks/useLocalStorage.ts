"use client";

import { useState, useEffect, type Dispatch, type SetStateAction, useCallback } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item) as T);
        } else {
          window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        // Fallback to initialValue if error, state is already initialValue
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Depend only on key for re-reading. initialValue is for default.

  const setValue: SetValue<T> = useCallback(
    (value) => {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`Error setting localStorage key “${key}”:`, error);
        }
      } else {
         console.warn(
          `Tried setting localStorage key “${key}” even though environment is not a client (setValue called on server)`
        );
      }
    },
    [key, storedValue]
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
            setStoredValue(initialValue); 
          }
        } else { 
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]); // initialValue is needed here if state resets to it.

  return [storedValue, setValue];
}

export default useLocalStorage;
