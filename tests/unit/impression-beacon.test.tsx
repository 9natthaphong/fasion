// @vitest-environment jsdom

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImpressionBeacon } from "@/components/impression-beacon";

describe("ImpressionBeacon", () => {
  let observerCallback: IntersectionObserverCallback;
  const disconnect = vi.fn();
  const sendBeacon = vi.fn(() => true);

  beforeEach(() => {
    vi.useFakeTimers();
    disconnect.mockClear();
    sendBeacon.mockClear();
    Object.defineProperty(window.navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
        observe() {}
        unobserve() {}
        disconnect = disconnect;
        root = null;
        rootMargin = "0px";
        thresholds = [0.5];
        takeRecords() {
          return [];
        }
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("waits for 50% visibility for one second and sends only once", () => {
    const view = render(
      <ImpressionBeacon
        adId="00000000-0000-4000-8000-000000000001"
        pageContext="test"
      />,
    );

    act(() => {
      observerCallback(
        [{ isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
      vi.advanceTimersByTime(999);
    });
    expect(sendBeacon).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);

    view.rerender(
      <ImpressionBeacon
        adId="00000000-0000-4000-8000-000000000001"
        pageContext="test"
      />,
    );
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});
