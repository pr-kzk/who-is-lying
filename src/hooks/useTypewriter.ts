import { useCallback, useEffect, useRef, useState } from "react";

export function useTypewriter(text: string, speed = 30) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const skipRef = useRef(false);

  const skip = useCallback(() => {
    skipRef.current = true;
    setDisplayedText(text);
    setIsComplete(true);
  }, [text]);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);
    indexRef.current = 0;
    skipRef.current = false;

    if (text.length === 0) {
      setIsComplete(true);
      return;
    }

    const intervalId = setInterval(() => {
      if (skipRef.current) {
        clearInterval(intervalId);
        return;
      }

      indexRef.current += 1;

      if (indexRef.current >= text.length) {
        setDisplayedText(text);
        setIsComplete(true);
        clearInterval(intervalId);
      } else {
        setDisplayedText(text.slice(0, indexRef.current));
      }
    }, speed);

    return () => {
      clearInterval(intervalId);
    };
  }, [text, speed]);

  return { displayedText, isComplete, skip };
}
