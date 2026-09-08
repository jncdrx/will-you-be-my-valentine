import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FolioExperience } from "../FolioExperience";

describe("FolioExperience", () => {
  it("renders top bar with brand, title, and iframe", () => {
    const handleBack = vi.fn();
    render(<FolioExperience onBackToHub={handleBack} />);

    // Brand and titles
    expect(screen.getByText("folio.")).toBeInTheDocument();
    expect(screen.getByText("Handwritten Pharmacology Notebook")).toBeInTheDocument();
    expect(screen.getByText("121 Entries")).toBeInTheDocument();

    // Standalone link
    const standaloneLink = screen.getByTitle("Open in Full Standalone Window");
    expect(standaloneLink).toBeInTheDocument();
    expect(standaloneLink).toHaveAttribute("href", "./folio/index.html");
    expect(standaloneLink).toHaveAttribute("target", "_blank");

    // Iframe
    const iframe = screen.getByTitle("Folio — Complete Handwritten Pharmacology Notebook");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "./folio/index.html");
  });

  it("calls onBackToHub when Back to Hub button is clicked", () => {
    const handleBack = vi.fn();
    render(<FolioExperience onBackToHub={handleBack} />);

    const backButton = screen.getByLabelText("Back to Experience Hub");
    fireEvent.click(backButton);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("toggles print tips banner on click", () => {
    render(<FolioExperience onBackToHub={vi.fn()} />);

    const printTipsBtn = screen.getByTitle("A5 Printing Tips");
    fireEvent.click(printTipsBtn);
    expect(screen.getByText(/Printing on A5 Refill Paper/i)).toBeInTheDocument();

    const closeBtn = screen.getByText("✕");
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/Printing on A5 Refill Paper/i)).not.toBeInTheDocument();
  });
});
