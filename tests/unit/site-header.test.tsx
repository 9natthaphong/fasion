// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SiteHeader } from "@/components/site-header";
import type { CurrentUser } from "@/lib/auth";

describe("SiteHeader Auth & Role Navigation", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders logged-out header with login CTA", () => {
    render(<SiteHeader user={null} />);

    expect(screen.getByText("เข้าสู่ระบบ")).toBeInTheDocument();
    expect(screen.getAllByText("สำหรับร้านค้า")[0]).toBeInTheDocument();
    expect(screen.getByText("เลือกชุดวันนี้")).toBeInTheDocument();
  });

  it("renders logged-in customer state and hides login CTA", () => {
    const customerUser: CurrentUser = {
      id: "cust-1",
      email: "customer@example.com",
      role: "customer",
      displayName: "Jane Customer",
      avatarUrl: null,
    };

    render(<SiteHeader user={customerUser} />);

    expect(screen.queryByText("เข้าสู่ระบบ")).toBeNull();
    expect(screen.getAllByText("Jane Customer")[0]).toBeInTheDocument();
  });

  it("renders logged-in merchant state with Merchant Studio menu", () => {
    const merchantUser: CurrentUser = {
      id: "merch-1",
      email: "merchant@example.com",
      role: "merchant",
      displayName: "Studio Owner",
      avatarUrl: null,
    };

    render(<SiteHeader user={merchantUser} />);

    expect(screen.queryByText("เข้าสู่ระบบ")).toBeNull();
    expect(screen.getAllByText("Studio Owner")[0]).toBeInTheDocument();
  });

  it("renders logged-in admin state with Admin Console menu", () => {
    const adminUser: CurrentUser = {
      id: "admin-1",
      email: "admin@fittoday.demo",
      role: "admin",
      displayName: "Admin Operator",
      avatarUrl: null,
    };

    render(<SiteHeader user={adminUser} />);

    expect(screen.queryByText("เข้าสู่ระบบ")).toBeNull();
    expect(screen.getAllByText("Admin Operator")[0]).toBeInTheDocument();
  });
});
