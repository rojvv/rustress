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

const HEAD_COUNT_COMPOUND_RE =
  /^(?:одно|дву|двух|трех|четырех|пяти|шести|семи|восьми|девяти|десяти|сто|много)(?:голов|глав)(ый|ая|ое|ые|ого|ой|ому|ым|ом|ую|ою|ых|ыми)$/;

function getStressIndex(word: string): number | undefined {
  const lowerWord = word.toLowerCase();
  const normalizedWord = lowerWord.replaceAll("ё", "е");
  const dictionaryIndex = exceptionDict[lowerWord] ??
    exceptionDict[normalizedWord];
  if (dictionaryIndex !== undefined) {
    return dictionaryIndex;
  }

  const compound = normalizedWord.match(HEAD_COUNT_COMPOUND_RE);
  if (compound) {
    // The stressed vowel immediately precedes the stem's final в.
    return normalizedWord.length - compound[1].length - 1;
  }
}

export function isInDict(word: string) {
  return getStressIndex(word) !== undefined;
}

export function putDictStress(word: string, marker: string) {
  const stressIndex = getStressIndex(word);
  if (stressIndex === undefined) {
    return word;
  }
  return word.slice(0, stressIndex) + marker +
    word.slice(stressIndex);
}
