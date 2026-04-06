"use client";

import { useState, useEffect } from "react";
import { type MealsLang, getMealsLang, setMealsLang, LANG_EVENT } from "./mealsLang";

export function useMealsLang(): [MealsLang, (l: MealsLang) => void] {
  const [lang, setLangState] = useState<MealsLang>("te");

  useEffect(() => {
    setLangState(getMealsLang());
    const handler = () => setLangState(getMealsLang());
    window.addEventListener(LANG_EVENT, handler);
    return () => window.removeEventListener(LANG_EVENT, handler);
  }, []);

  const setLang = (l: MealsLang) => {
    setMealsLang(l);
    setLangState(l);
  };

  return [lang, setLang];
}
