import { describe, expect, it } from "vitest";
import { hasAdminAccess, hasMasterAccess, type UserRole } from "./supabase";

describe("hasAdminAccess", () => {
  it("returns true for master", () => {
    expect(hasAdminAccess("master")).toBe(true);
  });

  it("returns true for operator", () => {
    expect(hasAdminAccess("operator")).toBe(true);
  });

  it("returns false for member", () => {
    expect(hasAdminAccess("member")).toBe(false);
  });

  it("returns false for guest", () => {
    expect(hasAdminAccess("guest")).toBe(false);
  });
});

describe("hasMasterAccess", () => {
  it("returns true for master", () => {
    expect(hasMasterAccess("master")).toBe(true);
  });

  it("returns false for operator", () => {
    expect(hasMasterAccess("operator")).toBe(false);
  });

  it("returns false for member", () => {
    expect(hasMasterAccess("member")).toBe(false);
  });

  it("returns false for guest", () => {
    expect(hasMasterAccess("guest")).toBe(false);
  });
});
