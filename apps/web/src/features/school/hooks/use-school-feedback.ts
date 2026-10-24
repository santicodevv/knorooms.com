"use client";
import { useEffect } from "react";
import toast from "react-hot-toast";
export function useSchoolFeedback(
  feedback: { tone: "success" | "error"; title: string; detail?: string } | null,
) {
  useEffect(() => {
    if (feedback) {
      if (feedback.tone === "success") toast.success(feedback.title);
      else toast.error(feedback.title);
    }
  }, [feedback]);
}
