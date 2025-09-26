import { assertEquals } from "@std/assert";
import { markStresses } from "./mod.ts";

Deno.test("nbsp", async () => {
  const text = "он\u00a0увидел";
  const marked = "о́н\u00a0уви́дел";
  assertEquals(await markStresses(text), marked);
});
