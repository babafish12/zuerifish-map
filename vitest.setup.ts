import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

if (typeof SVGSVGElement !== "undefined" && !("createSVGRect" in SVGSVGElement.prototype)) {
  Object.defineProperty(SVGSVGElement.prototype, "createSVGRect", {
    configurable: true,
    value: () => ({})
  });
}

afterEach(() => {
  cleanup();
});
