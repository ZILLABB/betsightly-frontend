import React from "react";
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, waitFor } from "@testing-library/react";
import ThemeProvider from "./ThemeProvider";
import { usePreferences } from "../../hooks/usePreferences";
import { defaultPreferences } from "../../contexts/PreferencesTypes";

jest.mock("../../hooks/usePreferences", () => ({ usePreferences: jest.fn() }));

const mockedUsePreferences = usePreferences as jest.MockedFunction<typeof usePreferences>;

afterEach(() => {
  document.documentElement.classList.remove("light", "dark");
  document.body.style.backgroundColor = "";
  document.body.style.color = "";
});

test("applies the selected light theme class to the root element", async () => {
  mockedUsePreferences.mockReturnValue({
    preferences: { ...defaultPreferences, theme: "light" },
    updatePreference: jest.fn(),
    toggleTheme: jest.fn(),
    resetPreferences: jest.fn(),
    addSavedGameCode: jest.fn(),
    removeSavedGameCode: jest.fn(),
    addFavoriteTeam: jest.fn(),
    removeFavoriteTeam: jest.fn(),
  });

  render(<ThemeProvider><p>Theme content</p></ThemeProvider>);

  await waitFor(() => expect(document.documentElement).toHaveClass("light"));
  expect(document.documentElement).not.toHaveClass("dark");
});

test("keeps critical light-theme text and status tokens at AA contrast", () => {
  const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
  const lightTheme = css.match(/\.light\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
  const token = (name: string) => lightTheme.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1].trim() ?? "";

  const rgba = (value: string): [number, number, number, number] => {
    if (value.startsWith("#")) {
      const hex = value.slice(1);
      return [Number.parseInt(hex.slice(0, 2), 16), Number.parseInt(hex.slice(2, 4), 16), Number.parseInt(hex.slice(4, 6), 16), 1];
    }
    const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
    return [parts[0], parts[1], parts[2], parts[3] ?? 1];
  };
  const luminance = ([red, green, blue]: number[]) => [red, green, blue]
    .map(channel => channel / 255)
    .map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const contrastOnWhite = (value: string) => {
    const [red, green, blue, alpha] = rgba(value);
    const foreground = [red, green, blue].map(channel => channel * alpha + 255 * (1 - alpha));
    return (1.05) / (luminance(foreground) + 0.05);
  };

  ["--text-2", "--text-3", "--brand", "--green", "--blue", "--red", "--gold"].forEach(name => {
    expect(contrastOnWhite(token(name))).toBeGreaterThanOrEqual(4.5);
  });
});
