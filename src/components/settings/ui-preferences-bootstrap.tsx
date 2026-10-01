"use client";
import { useLayoutEffect } from "react";
import { applyUiPreferences, loadUiPreferences } from "@/lib/ui-preferences";

export function UiPreferencesBootstrap() {
  useLayoutEffect(() => {
    const apply = () => applyUiPreferences(loadUiPreferences());
    apply();
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    query.addEventListener?.("change", apply);
    return () => query.removeEventListener?.("change", apply);
  }, []);
  return null;
}
