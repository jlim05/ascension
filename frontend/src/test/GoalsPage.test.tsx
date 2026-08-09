import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GoalsPage from "../pages/GoalsPage";

// The page is the only place the CRUD endpoints are called from, so mocking the
// api module lets each test assert which verb the UI actually reached for.
vi.mock("../api", () => ({
  getGoal: vi.fn(),
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

vi.mock("../store/themeStore", () => ({
  useThemeStore: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

const existingGoal = {
  id: "goal-1",
  focus: "Cutting" as const,
  daysPerWeek: 5,
  equipment: "home gym",
};

describe("GoalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── READ ────────────────────────────────────────────────
  it("renders the existing goal returned by the API", async () => {
    const { getGoal } = await import("../api");
    vi.mocked(getGoal).mockResolvedValueOnce({ data: existingGoal } as never);

    render(<GoalsPage />);

    expect(await screen.findByText("Cutting")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("home gym")).toBeInTheDocument();
  });

  // ── CREATE ──────────────────────────────────────────────
  it("drops straight into the create form when no goal exists", async () => {
    const { getGoal } = await import("../api");
    vi.mocked(getGoal).mockRejectedValueOnce({ response: { status: 404 } });

    render(<GoalsPage />);

    expect(await screen.findByText("Register New Directive")).toBeInTheDocument();
    expect(screen.getByText("Register Directive")).toBeInTheDocument();
  });

  it("calls createGoal with the selected focus when no goal exists", async () => {
    const { getGoal, createGoal } = await import("../api");
    vi.mocked(getGoal).mockRejectedValueOnce({ response: { status: 404 } });
    vi.mocked(createGoal).mockResolvedValueOnce({
      data: { ...existingGoal, focus: "MainGain" },
    } as never);

    render(<GoalsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /MainGain/i }));
    fireEvent.click(screen.getByText("Register Directive"));

    await waitFor(() => {
      expect(createGoal).toHaveBeenCalledWith(
        expect.objectContaining({ focus: "MainGain" })
      );
    });
  });

  // ── UPDATE ──────────────────────────────────────────────
  it("calls updateGoal rather than createGoal when amending an existing goal", async () => {
    const { getGoal, updateGoal, createGoal } = await import("../api");
    vi.mocked(getGoal).mockResolvedValueOnce({ data: existingGoal } as never);
    vi.mocked(updateGoal).mockResolvedValueOnce({
      data: { ...existingGoal, daysPerWeek: 6 },
    } as never);

    render(<GoalsPage />);

    fireEvent.click(await screen.findByText("Amend Directive"));
    fireEvent.change(screen.getByLabelText(/Training Days Per Week/i), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByText("Save Directive"));

    await waitFor(() => {
      expect(updateGoal).toHaveBeenCalledWith(
        expect.objectContaining({ daysPerWeek: 6 })
      );
    });
    expect(createGoal).not.toHaveBeenCalled();
  });

  // ── DELETE ──────────────────────────────────────────────
  it("requires confirmation before deleting, then calls deleteGoal", async () => {
    const { getGoal, deleteGoal } = await import("../api");
    vi.mocked(getGoal).mockResolvedValueOnce({ data: existingGoal } as never);
    vi.mocked(deleteGoal).mockResolvedValueOnce({} as never);

    render(<GoalsPage />);

    fireEvent.click(await screen.findByText("Revoke Directive"));

    // Nothing is sent until the second, explicit confirmation.
    expect(deleteGoal).not.toHaveBeenCalled();
    expect(screen.getByText("Confirm Revocation")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Yes, revoke it"));

    await waitFor(() => expect(deleteGoal).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/DIRECTIVE REVOKED/i)).toBeInTheDocument();
  });

  it("cancelling the confirmation leaves the goal untouched", async () => {
    const { getGoal, deleteGoal } = await import("../api");
    vi.mocked(getGoal).mockResolvedValueOnce({ data: existingGoal } as never);

    render(<GoalsPage />);

    fireEvent.click(await screen.findByText("Revoke Directive"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(deleteGoal).not.toHaveBeenCalled();
    expect(screen.queryByText("Confirm Revocation")).not.toBeInTheDocument();
  });

  // ── Error handling ──────────────────────────────────────
  it("surfaces a System error when the save is rejected", async () => {
    const { getGoal, updateGoal } = await import("../api");
    vi.mocked(getGoal).mockResolvedValueOnce({ data: existingGoal } as never);
    vi.mocked(updateGoal).mockRejectedValueOnce(new Error("400"));

    render(<GoalsPage />);

    fireEvent.click(await screen.findByText("Amend Directive"));
    fireEvent.click(screen.getByText("Save Directive"));

    expect(await screen.findByText(/REJECTED THIS DIRECTIVE/i)).toBeInTheDocument();
  });
});
