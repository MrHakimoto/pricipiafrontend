// src/hooks/useDocumentTitle.ts
"use client";

import { useEffect } from "react";

const APP_NAME = "Principia Matemática";

export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    if (!title || !title.trim()) {
      document.title = APP_NAME;
      return;
    }

    document.title = `${title.trim()} | ${APP_NAME}`;
  }, [title]);
}