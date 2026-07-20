import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "../store/themeStore";

describe("themeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "dark" });
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts in dark mode", () => {
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggleTheme switches from dark to light", () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("light");
  });

  it("toggleTheme switches from light to dark", () => {
    useThemeStore.setState({ theme: "light" });
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe("dark");
  });

  it("toggleTheme sets data-theme on html element", () => {
    useThemeStore.getState().toggleTheme();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});