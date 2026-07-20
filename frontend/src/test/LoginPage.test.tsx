import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

// Mock the api module
vi.mock("../api", () => ({
  login: vi.fn(),
  getMyProfile: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock auth store
const mockSetAuth = vi.fn();
vi.mock("../store/authStore", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      token: null,
      player: null,
      setAuth: mockSetAuth,
      logout: vi.fn(),
      updatePlayer: vi.fn(),
    })
  ),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the ASCENSION title", () => {
    renderLogin();
    expect(screen.getByText("ASCENSION")).toBeInTheDocument();
  });

  it("renders username and password inputs", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("> ENTER_CODENAME")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("> ************")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    renderLogin();
    expect(screen.getByText("INITIALIZE AUTHENTICATION")).toBeInTheDocument();
  });

  it("renders the register link", () => {
    renderLogin();
    expect(screen.getByText("Register Here")).toBeInTheDocument();
  });

  it("shows error message on failed login", async () => {
    const { login } = await import("../api");
    vi.mocked(login).mockRejectedValueOnce(new Error("Invalid credentials"));

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText("> ENTER_CODENAME"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("> ************"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByText("INITIALIZE AUTHENTICATION"));

    await waitFor(() => {
      expect(
        screen.getByText(/AUTHENTICATION FAILED/i)
      ).toBeInTheDocument();
    });
  });
});