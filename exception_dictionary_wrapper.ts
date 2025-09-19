// Authors: Roj S., Klim V. O., MashaPo

import { exceptionDictionary } from "./exception_dictionary.ts";
import { DEF_STRESS_SYMBOL } from "./constants.ts";

const exceptionDict: Record<string, number> = {};

for (const word of exceptionDictionary.split("\n")) {
  if (word.includes(DEF_STRESS_SYMBOL)) {
    const unstressedWord = word.replaceAll(DEF_STRESS_SYMBOL, "");
    exceptionDict[unstressedWord] = word.indexOf(DEF_STRESS_SYMBOL);
  }
}

export function isInDict(word: string) {
  word = word.toLowerCase();
  if (word in exceptionDict) {
    return true;
  } else if (word.replaceAll("ё", "е") in exceptionDict) {
    return true;
  } else {
    return false;
  }
}

export function putDictStress(word: string, marker: string) {
  let preparedWord = word.toLowerCase();
  if (!(preparedWord in exceptionDict)) {
    preparedWord = word.replaceAll("ё", "е");
  }
  if (!(preparedWord in exceptionDict)) {
    return word;
  }
  const stressIndex = exceptionDict[preparedWord];
  return word.slice(0, stressIndex) + marker +
    word.slice(stressIndex);
}
