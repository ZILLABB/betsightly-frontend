import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

export function formatTime(date: Date | string | undefined): string {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid Time";
  }
}

export function formatOdds(odds: number | undefined): string {
  if (odds === undefined || odds === null) return "0.00";
  return odds.toFixed(2);
}

export function getOddsClass(odds: number | undefined): string {
  if (odds === undefined || odds === null) return "odds-low";
  if (odds < 2.0) return "odds-low";
  if (odds < 5.0) return "odds-medium";
  return "odds-high";
}

export function getStatusClass(status: "won" | "lost" | "pending" | undefined): string {
  if (!status) return "status-pending";

  switch (status) {
    case "won":
      return "status-won";
    case "lost":
      return "status-lost";
    case "pending":
    default:
      return "status-pending";
  }
}

export function calculateSuccessRate(
  predictions: { status: "won" | "lost" | "pending" }[]
): number {
  const completedPredictions = predictions.filter(
    (p) => p.status === "won" || p.status === "lost"
  );

  if (completedPredictions.length === 0) return 0;

  const wonPredictions = completedPredictions.filter(
    (p) => p.status === "won"
  );

  return (wonPredictions.length / completedPredictions.length) * 100;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function generateTimeSlots(): string[] {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const time = new Date();
      time.setHours(hour, minute, 0, 0);
      slots.push(formatTime(time));
    }
  }
  return slots;
}

export function getDaysArray(days: number): Date[] {
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push(date);
  }
  return result;
}

export function getNextDaysArray(days: number): Date[] {
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    result.push(date);
  }
  return result;
}
