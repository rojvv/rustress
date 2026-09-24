import { assertEquals } from "@std/assert";
import { markStresses } from "./mod.ts";

Deno.test("nbsp", async () => {
  const text = "он\u00a0увидел";
  const marked = "о́н\u00a0уви́дел";
  assertEquals(await markStresses(text), marked);
});

Deno.test("oversized model inputs preserve tokens and surrounding predictions", async () => {
  for (const length of [40, 41, 100, 20000]) {
    const word = "а".repeat(length);
    assertEquals(await markStresses(word), word);
    assertEquals(
      await markStresses(`молоко,${word}\n\tмолоко ${word.toUpperCase()}!`),
      `молоко́,${word}\n\tмолоко́ ${word.toUpperCase()}!`,
    );
  }
});

Deno.test("model input limit includes the actual preceding context", async () => {
  for (const [prefix, length] of [["", 39], ["молоко ", 36]] as const) {
    const word = "а".repeat(length);
    const result = await markStresses(prefix + word, { accuracyThreshold: 0 });
    const markedWord = result.split(" ").at(-1)!;
    assertEquals(markedWord.replaceAll("\u0301", ""), word);
    assertEquals(markedWord.length, word.length + 1);
  }
  const word = "а".repeat(37);
  assertEquals(
    await markStresses(`молоко ${word} молоко`, { accuracyThreshold: 0 }),
    `молоко́ ${word} молоко́`,
  );
});

Deno.test("long supplied accents and Latin tokens remain intact", async () => {
  const marked = "А́" + "а".repeat(100);
  const latin = "a".repeat(100);
  assertEquals(
    await markStresses(`${marked} ${latin} молоко`),
    `${marked} ${latin} молоко́`,
  );
});
