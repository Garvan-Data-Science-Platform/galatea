/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";

import { afterAll, afterEach, beforeAll } from "vitest";
import { setupServer } from "msw/node";
import { restHandlers } from "requests/mocks";

const server = setupServer(...restHandlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

//  Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers());
