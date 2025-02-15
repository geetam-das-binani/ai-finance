import { useState, useCallback } from "react";


export const useFetch = (cb) => {
  const [data, setData] = useState(undefined);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fn = useCallback(async(...args) => {
   
      try {
        setLoading(true);
        setError(null);
      
        const response = await cb(...args);
        
        setData(response.data  || response.success);
      } catch (error) {
        
        const errorMessage = error?.message || "Something went wrong";
        setError(errorMessage);
        
      } finally {
        setLoading(false);
      }
    },
    [cb]
  );

  return { data, loading, error, fn, setData };
};
