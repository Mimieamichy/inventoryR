
"use client";

import { useState, useEffect, type Dispatch, type SetStateAction, useCallback } from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  // State to store our value. Initialize with initialValue to ensure server and client match initially.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Effect to read from localStorage on the client after mounting
  useEffect(() => {
    // This check ensures it only runs on the client
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item) as T);
        } else {
          // If item is not in localStorage, set it with initialValue.
          // React state is already initialValue due to useState(initialValue).
          window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      } catch (error) {
        console.warn(`Error reading localStorage key “${key}”:`, error);
        setStoredValue(initialValue); // Fallback to initialValue on error
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]); // key and initialValue: if they change, re-evaluate.

  const setValue: SetValue<T> = useCallback(
    (value) => {
      // The 'value' can be a new value or a function `(prevState) => newState`.
      // We resolve it first based on the current 'storedValue'.
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Update React state. This will be used for the current render pass if possible,
      // and schedule a re-render.
      setStoredValue(valueToStore);

      // Then, try to update localStorage if on the client.
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
    [key, storedValue] // `storedValue` is needed for the `value(storedValue)` case.
                       // `setStoredValue` (from useState) is stable and not needed in deps.
  );
  
  // Effect for handling storage events from other tabs
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
            setStoredValue(initialValue); // Fallback to initialValue
          }
        } else { 
          // Item was removed from localStorage in another tab, reset to initialValue.
          setStoredValue(initialValue);
          // Optionally, re-populate localStorage with initialValue here if desired behavior
          // window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]); // initialValue is needed if we reset to it.

  return [storedValue, setValue];
}

export default useLocalStorage;
