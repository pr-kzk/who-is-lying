import { describe, expect, it } from "vite-plus/test";

import { defaultScenario, scenarios } from "./scenarios";

describe("scenarios", () => {
  it("is a non-empty array", () => {
    expect(scenarios.length).toBeGreaterThan(0);
  });

  it.each(scenarios)("scenario '$id' has required fields", (scenario) => {
    expect(scenario.id).toBeTruthy();
    expect(scenario.title).toBeTruthy();
    expect(scenario.crimeType).toBeTruthy();
    expect(scenario.setting).toBeTruthy();
    expect(scenario.crimeTime).toBeTruthy();
    expect(scenario.introParagraphs.length).toBeGreaterThan(0);
    expect(scenario.contradictionExplanation).toBeTruthy();
    expect(scenario.hintText).toBeTruthy();
  });

  it.each(scenarios)("scenario '$id' has exactly 3 characters", (scenario) => {
    expect(scenario.characters).toHaveLength(3);
  });

  it.each(scenarios)("scenario '$id' has exactly one guilty character", (scenario) => {
    const guiltyCount = scenario.characters.filter((c) => c.guilty).length;
    expect(guiltyCount).toBe(1);
  });

  it.each(scenarios)(
    "scenario '$id' guiltyCharacterId matches the guilty character",
    (scenario) => {
      const guiltyChar = scenario.characters.find((c) => c.guilty);
      expect(guiltyChar).toBeDefined();
      expect(guiltyChar!.id).toBe(scenario.guiltyCharacterId);
    },
  );

  it.each(scenarios)(
    "scenario '$id' guilty character has alibiLie, contradiction, crimeDetail",
    (scenario) => {
      const guiltyChar = scenario.characters.find((c) => c.guilty);
      expect(guiltyChar).toBeDefined();
      if (guiltyChar?.guilty) {
        expect(guiltyChar.alibiLie).toBeTruthy();
        expect(guiltyChar.contradiction).toBeTruthy();
        expect(guiltyChar.crimeDetail).toBeTruthy();
      }
    },
  );

  it.each(scenarios)("scenario '$id' innocent characters have alibiTruth", (scenario) => {
    const innocentChars = scenario.characters.filter((c) => !c.guilty);
    expect(innocentChars).toHaveLength(2);
    for (const char of innocentChars) {
      if (!char.guilty) {
        expect(char.alibiTruth).toBeTruthy();
      }
    }
  });

  it.each(scenarios)("scenario '$id' has unique character IDs", (scenario) => {
    const ids = scenario.characters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(scenarios)("scenario '$id' characters have required base fields", (scenario) => {
    for (const char of scenario.characters) {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.job).toBeTruthy();
      expect(char.age).toBeTruthy();
      expect(char.personality).toBeTruthy();
      expect(char.emoji).toBeTruthy();
      expect(char.color).toBeTruthy();
    }
  });
});

describe("defaultScenario", () => {
  it("is the first scenario", () => {
    expect(defaultScenario).toBe(scenarios[0]);
  });
});
