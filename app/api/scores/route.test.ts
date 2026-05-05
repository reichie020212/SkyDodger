import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitForTests } from "@/lib/rate-limit";
import { MIN_MS_PER_PIPE } from "@/lib/engine-config";

// Mock the I/O dependencies up front so the route handler picks them up.
const mockAuth = vi.fn();
const mockScoreCreate = vi.fn();
const mockCheckAndAwardBadges = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    score: {
      create: (args: unknown) => mockScoreCreate(args),
    },
  },
}));

vi.mock("@/lib/badges", () => ({
  checkAndAwardBadges: (userId: string) => mockCheckAndAwardBadges(userId),
}));

// Import the route AFTER the mocks are registered.
const { POST } = await import("@/app/api/scores/route");

const VALID_BODY = {
  score: 10,
  difficulty: "easy" as const,
  durationMs: Math.ceil(MIN_MS_PER_PIPE.EASY * 10), // exactly the theoretical min
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/scores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  _resetRateLimitForTests();
  mockAuth.mockReset();
  mockScoreCreate.mockReset();
  mockCheckAndAwardBadges.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /api/scores", () => {
  it("returns 401 when there is no session", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(401);
    expect(mockScoreCreate).not.toHaveBeenCalled();
  });

  it("returns 422 when the body fails Zod validation", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });

    const res = await POST(
      makeRequest({ score: "ten", difficulty: "easy", durationMs: 1000 }),
    );

    expect(res.status).toBe(422);
    expect(mockScoreCreate).not.toHaveBeenCalled();
  });

  it("rejects unknown difficulty strings (uppercase difficulty is not API shape)", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });

    const res = await POST(
      makeRequest({ score: 10, difficulty: "EASY", durationMs: 30_000 }),
    );

    expect(res.status).toBe(422);
  });

  it("returns 422 when the duration is implausibly short for the score", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });

    const res = await POST(
      makeRequest({ score: 50, difficulty: "easy", durationMs: 100 }),
    );

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.reason).toBe("duration_too_short");
    expect(mockScoreCreate).not.toHaveBeenCalled();
  });

  it("returns 201 with the created score and any newly earned badges", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockScoreCreate.mockResolvedValue({
      id: "s1",
      score: 10,
      difficulty: "EASY",
      durationMs: VALID_BODY.durationMs,
      createdAt: new Date("2026-05-15T10:00:00Z"),
    });
    mockCheckAndAwardBadges.mockResolvedValue([
      { id: "first_flight", name: "First Flight", description: "...", glyph: "✦" },
    ]);

    const res = await POST(makeRequest(VALID_BODY));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.score.id).toBe("s1");
    expect(body.score.difficulty).toBe("easy"); // converted back to lowercase API shape
    expect(body.newBadges).toHaveLength(1);
    expect(body.newBadges[0].id).toBe("first_flight");

    // Verify Prisma got the uppercase enum value
    expect(mockScoreCreate).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        score: 10,
        difficulty: "EASY",
        durationMs: VALID_BODY.durationMs,
      },
    });
  });

  it("returns 429 when the same user posts twice within the cooldown", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    mockScoreCreate.mockResolvedValue({
      id: "s1",
      score: 10,
      difficulty: "EASY",
      durationMs: VALID_BODY.durationMs,
      createdAt: new Date(),
    });
    mockCheckAndAwardBadges.mockResolvedValue([]);

    const first = await POST(makeRequest(VALID_BODY));
    expect(first.status).toBe(201);

    const second = await POST(makeRequest(VALID_BODY));
    expect(second.status).toBe(429);
    const headers = Object.fromEntries(second.headers.entries());
    expect(headers["retry-after"]).toBeDefined();
  });

  it("rate-limits per-user, not globally", async () => {
    mockScoreCreate.mockResolvedValue({
      id: "s1",
      score: 10,
      difficulty: "EASY",
      durationMs: VALID_BODY.durationMs,
      createdAt: new Date(),
    });
    mockCheckAndAwardBadges.mockResolvedValue([]);

    mockAuth.mockResolvedValue({ user: { id: "alice" } });
    expect((await POST(makeRequest(VALID_BODY))).status).toBe(201);

    mockAuth.mockResolvedValue({ user: { id: "bob" } });
    expect((await POST(makeRequest(VALID_BODY))).status).toBe(201);
  });
});
