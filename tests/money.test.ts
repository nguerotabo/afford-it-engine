import { expect, test, describe } from "vitest";
import { convertToCents, convertToDollars } from "../src/core/money";

describe("convertToCents", () => {
  test("whole dollars", () => {
    expect(convertToCents(10)).toBe(1000);
  });

  test("cents", () => {
    expect(convertToCents(19.99)).toBe(1999);
  });

  test("rounds half-up via Math.round", () => {
    expect(convertToCents(10.005)).toBe(1001);
  });

  test("zero", () => {
    expect(convertToCents(0)).toBe(0);
  });

  test("negative", () => {
    expect(convertToCents(-12.34)).toBe(-1234);
  });
});

describe("convertToDollars", () => {
  test("whole cents", () => {
    expect(convertToDollars(1000)).toBe(10);
  });

  test("fractional dollars", () => {
    expect(convertToDollars(1999)).toBe(19.99);
  });

  test("zero", () => {
    expect(convertToDollars(0)).toBe(0);
  });
});

describe("money round-trip", () => {
  test.each([0, 1, 19.99, 500, 1234.56, 0.01])(
    "dollars → cents → dollars for %s",
    (amount) => {
      expect(convertToDollars(convertToCents(amount))).toBeCloseTo(amount, 2);
    },
  );
});
