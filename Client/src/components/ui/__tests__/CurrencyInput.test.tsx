import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import CurrencyInput from "../CurrencyInput";

const ControlledCurrencyInput = ({
  initialValue = 0,
  onChange,
}: {
  initialValue?: number;
  onChange?: (val: number) => void;
}) => {
  const [val, setVal] = useState(initialValue);
  return (
    <CurrencyInput
      id="test-currency"
      data-testid="currency-input"
      value={val}
      onChange={(v) => {
        setVal(v);
        onChange?.(v);
      }}
    />
  );
};

describe("CurrencyInput Component", () => {
  it("renders with inputMode='numeric' and Indian prefix", () => {
    render(<CurrencyInput id="test-c" value={1500000} data-testid="c-input" />);
    const input = screen.getByTestId("c-input") as HTMLInputElement;

    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(screen.getByText("₹")).toBeInTheDocument();
    expect(input.value).toBe("15,00,000");
  });

  it("formats Indian grouping while typing: 1234567 -> 12,34,567", async () => {
    const handleChange = vi.fn();
    render(<ControlledCurrencyInput onChange={handleChange} />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    await userEvent.type(input, "1234567");

    expect(input.value).toBe("12,34,567");
    expect(handleChange).toHaveBeenLastCalledWith(1234567);
  });

  it("blocks negative signs and non-numeric characters", async () => {
    const handleChange = vi.fn();
    render(<ControlledCurrencyInput onChange={handleChange} />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    await userEvent.type(input, "-500abc");

    expect(input.value).toBe("500");
    expect(handleChange).toHaveBeenLastCalledWith(500);
  });

  it("blocks decimals for integer tax inputs", async () => {
    const handleChange = vi.fn();
    render(<ControlledCurrencyInput onChange={handleChange} />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    await userEvent.type(input, "1200.50");

    expect(input.value).toBe("1,20,050");
    expect(handleChange).toHaveBeenLastCalledWith(120050);
  });

  it("supports pasting formatted Indian currency string", () => {
    const handleChange = vi.fn();
    render(<ControlledCurrencyInput onChange={handleChange} />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    fireEvent.paste(input, {
      clipboardData: {
        getData: () => "₹ 15,00,000",
      },
    });

    expect(input.value).toBe("15,00,000");
    expect(handleChange).toHaveBeenCalledWith(1500000);
  });

  it("handles empty or backspaced input gracefully without NaN", async () => {
    const handleChange = vi.fn();
    render(<ControlledCurrencyInput initialValue={100} onChange={handleChange} />);
    const input = screen.getByTestId("currency-input") as HTMLInputElement;

    await userEvent.clear(input);

    expect(input.value).toBe("");
    expect(handleChange).toHaveBeenLastCalledWith(0);
  });
});
