// Authors: Roj S., Klim V. O., MashaPo
import {
  CLEANING_TEXT_RE,
  DEFAULT_TOKENIZER_CATEGORIES,
  MARKING_TEXT_RE,
  SEARCH_TWO_VOWELS_RE,
  VOWELS,
} from "./constants.ts";

export function prepareText(text: string) {
  text = text.replaceAll(MARKING_TEXT_RE, " _ ").toLowerCase();
  text = text.replaceAll(CLEANING_TEXT_RE, " ");
  const words = text.split(" ");
  return words;
}

export function tokenize(
  text: string,
  categories: string[] = DEFAULT_TOKENIZER_CATEGORIES,
) {
  let token = "";
  const tokens = new Array<string>();
  let category: string | undefined;
  for (const symbol of text) {
    if (token) {
      if (category && category.includes(symbol)) {
        token += symbol;
      } else {
        tokens.push(token);
        token = symbol;
        category = undefined;
        for (const cat of categories) {
          if (cat.includes(symbol)) {
            category = cat;
            break;
          }
        }
      }
    } else {
      category = undefined;
      for (const cat of categories) {
        if (cat.includes(symbol)) {
          category = cat;
        }
      }
      token += symbol;
    }
  }
  if (token) {
    tokens.push(token);
  }
  return tokens;
}

export function addEndings(words: string[], marker: string) {
  const wordsWithEndings = new Array<string>();
  for (const [i, word] of words.entries()) {
    if (!SEARCH_TWO_VOWELS_RE.test(word)) {
      wordsWithEndings.push(word);
    } else if (i === 0 || words[i - 1] === "_") {
      wordsWithEndings.push("_" + word);
    } else {
      const context = words[i - 1].replaceAll(marker, "");
      let ending: string;
      if (context.length < 3) {
        ending = context;
      } else {
        ending = context.slice(-3);
      }
      wordsWithEndings.push(ending + "_" + word);
    }
  }
  return wordsWithEndings;
}

export function countNumberOfVowels(word: string) {
  let numberOfVowels = 0;
  for (const symbol of word) {
    if (VOWELS.includes(symbol)) {
      ++numberOfVowels;
    }
  }
  return numberOfVowels;
}

export function findVowelIndices(word: string) {
  const vowelIndices = new Array<number>();
  let i = -1;
  for (const symbol of word) {
    ++i;
    if (VOWELS.includes(symbol)) {
      vowelIndices.push(i);
    }
  }
  return vowelIndices;
}

export function delEndings(words: string[]) {
  return words.map((word) => {
    if (word.indexOf("_") !== -1) {
      return word.slice(word.indexOf("_") + 1);
    } else {
      return word;
    }
  });
}
