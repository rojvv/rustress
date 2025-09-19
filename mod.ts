// Authors: Roj S., Klim V. O., MashaPo
import {
  CHAR_COUNT,
  CHAR_INDICES,
  MAX_INPUT_LEN,
  SEARCH_TWO_VOWELS_RE,
  VOWELS,
} from "./constants.ts";
import { isInDict, putDictStress } from "./exception_dictionary_wrapper.ts";
import {
  addEndings,
  countNumberOfVowels,
  delEndings,
  findVowelIndices,
  prepareText,
  tokenize,
} from "./utils.ts";
import { InferenceSession, Tensor } from "onnxruntime-web";
import { decodeBase64 } from "@std/encoding/base64";
import { model } from "./model.ts";

const session = await InferenceSession.create(decodeBase64(model), {
  executionMode: "sequential",
  interOpNumThreads: 1,
  intraOpNumThreads: 1,
  executionProviders: ["cpu"],
});

async function predictWrapper(tensor: Tensor) {
  const output = await session.run(
    Object.fromEntries(
      session.inputNames.map((v): [string, Tensor] => [v, tensor]),
    ),
  );
  const array = output[session.outputNames[0]].data as Float32Array;
  const predictions = new Array<number[]>();
  for (const item of array) {
    if (
      !predictions.length ||
      predictions[predictions.length - 1].length === MAX_INPUT_LEN
    ) {
      predictions.push([]);
    }
    predictions[predictions.length - 1].push(item);
  }
  return predictions;
}

async function predict(wordsWithEnding: string | string[], marker: string) {
  if (!wordsWithEnding.length) {
    return [];
  }
  wordsWithEnding = Array.isArray(wordsWithEnding)
    ? wordsWithEnding
    : [wordsWithEnding];

  const [X, Y, Z] = [wordsWithEnding.length, MAX_INPUT_LEN, CHAR_COUNT];
  const array = Array.from(
    { length: wordsWithEnding.length },
    () =>
      Array.from({ length: MAX_INPUT_LEN }, () => Array(CHAR_COUNT).fill(0)),
  );

  for (const [i, wordWithEnding] of wordsWithEnding.entries()) {
    let j = -1;
    for (const symbol of wordWithEnding) {
      ++j;
      const pos = MAX_INPUT_LEN - wordWithEnding.length + j;
      array[i][pos][CHAR_INDICES[symbol]] = 1;
    }
  }

  const fArray = new Float32Array(array.flat(2));
  const predictions = await predictWrapper(
    new Tensor("float32", fArray, [X, Y, Z]),
  );
  const accuracies = predictions.map((v) => Math.max(...v));
  let stressIndexes = predictions.map((prediction, i) => {
    const accuracy = accuracies[i];
    return prediction.indexOf(accuracy);
  });

  const words = delEndings(wordsWithEnding);
  stressIndexes = words.map((word, i) => {
    const stressIndex = stressIndexes[i];
    return word.length - MAX_INPUT_LEN + stressIndex;
  });

  for (const [i, word] of words.entries()) {
    const stressIndex = stressIndexes[i];
    if (stressIndex > word.length - 1) {
      accuracies[i] = 0;
    }
  }

  const stressedWords = new Array<[string, number]>();
  for (const [i, word] of words.entries()) {
    let stressIndex = stressIndexes[i];
    const accuracy = accuracies[i];
    if (!VOWELS.includes(word[stressIndex])) {
      const vowelIndices = findVowelIndices(word);
      for (const vowelIndex of vowelIndices) {
        if (stressIndex < vowelIndex) {
          stressIndex = vowelIndex;
          break;
        }
      }
      if (!VOWELS.includes(word[stressIndex])) {
        for (const vowelIndex of vowelIndices.toReversed()) {
          if (stressIndex > vowelIndex) {
            stressIndex = vowelIndex;
            break;
          }
        }
      }
    }

    stressedWords.push([
      word.slice(0, stressIndex + 1) + marker +
      word.slice(stressIndex + 1),
      accuracy,
    ]);
  }

  return stressedWords;
}

/** Additional parameters of { @link markStresses }. */
interface MarkStressesParams {
  /**
   * A value between 0 and 1. The higher, the more accurate the results will be, but at the same time less words will be marked. Defaults to 0.75.
   */
  accuracyThreshold?: number;
  /**
   * Whether isolated vowels (one-vowel words) should be marked. Defaults to false.
   */
  markIsolatedVowels?: boolean;
  /**
   * Whether single vowels (words including constants and a single vowel) should be marked. Defaults to true.
   */
  markSingleVowels?: boolean;
  /**
   * Whether the letter «Ё / ё» should be marked. Defaults to false.
   */
  markYo?: boolean;
  /**
   * The character to use as a stress marker. Defaults to "\u0301".
   */
  marker?: string;
}

/**
 * Mark stresses in a text.
 *
 * @params params Additional parameters.
 */
export async function markStresses(
  text: string,
  params?: MarkStressesParams,
): Promise<string> {
  const accuracyThreshold = params?.accuracyThreshold ?? 0.75;
  const markIsolatedVowels = params?.markIsolatedVowels ?? false;
  const markSingleVowels = params?.markSingleVowels ?? true;
  const markYo = params?.markYo ?? false;
  const marker = params?.marker ?? "\u0301";

  const words = prepareText(text);
  const tokens = tokenize(text);
  const wordsWithEndings = addEndings(words, marker);

  let stressedWords = new Array<string>();
  const batchForPredict = new Array<string>();
  for (let word of wordsWithEndings) {
    const match = word.match(new RegExp(marker, "g"));
    if (match !== null && match.length > 2) {
      word = word.replaceAll(marker, "");
    }

    const index = word.indexOf(marker);
    if (index !== -1 && VOWELS.includes(word[index - 1])) {
      continue;
    } else if (countNumberOfVowels(word) == 1) {
      const lastVowelIndex = findVowelIndices(word).slice(-1)[0];
      if (lastVowelIndex === 0 && !markIsolatedVowels) {
        stressedWords.push(word);
        continue;
      }
      const stressedWord = word.slice(0, lastVowelIndex + 1) +
        marker + word.slice(lastVowelIndex + 1);
      stressedWords.push(stressedWord);
    } else if (SEARCH_TWO_VOWELS_RE.test(word)) {
      const withoutEndings = delEndings([word])[0];
      if (isInDict(withoutEndings)) {
        stressedWords.push(putDictStress(withoutEndings, marker));
      } else {
        batchForPredict.push(word);
        stressedWords.push(word);
      }
    }
  }

  const batchWithStressedWords = await predict(batchForPredict, marker);
  if (batchForPredict.length > 0) {
    const updatedStressedWords = new Array<string>();
    let idxInBatch = 0;
    for (const stressedWord of stressedWords) {
      if (
        idxInBatch < batchForPredict.length &&
        stressedWord === batchForPredict[idxInBatch] &&
        batchWithStressedWords[idxInBatch][1] >= accuracyThreshold
      ) {
        updatedStressedWords.push(batchWithStressedWords[idxInBatch][0]);
        ++idxInBatch;
      } else if (
        idxInBatch < batchForPredict.length &&
        stressedWord === batchForPredict[idxInBatch]
      ) {
        ++idxInBatch;
      } else {
        updatedStressedWords.push(stressedWord);
      }
    }
    stressedWords = updatedStressedWords;
  }

  const stressedText = new Array<string>();
  for (const token of tokens) {
    const vowelCount = countNumberOfVowels(token);
    if (vowelCount === 0) {
      stressedText.push(token);
    } else {
      const unstressedWord = stressedWords[0]?.replaceAll(
        marker,
        "",
      );
      if (unstressedWord === token.toLowerCase()) {
        if (token.length === 1 && !markIsolatedVowels) {
          stressedText.push(token);
        } else if (vowelCount === 1 && !markSingleVowels) {
          stressedText.push(token);
        } else {
          const stressPosition = stressedWords[0].indexOf(marker);
          if (
            !markYo &&
            stressedWords[0][stressPosition - 1].toLowerCase() === "ё"
          ) {
            stressedText.push(token);
          } else {
            const stressedToken = token.slice(0, stressPosition) +
              marker + token.slice(stressPosition);
            stressedText.push(stressedToken);
          }
        }
        stressedWords = stressedWords.slice(1);
      } else {
        stressedText.push(token);
      }
    }
  }

  return stressedText.join("");
}
