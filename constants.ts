// Authors: Roj S., Klim V. O., MashaPo

export const DEF_STRESS_SYMBOL = "'";

export const VOWELS = "аеиоуэюяыёАЕИОУЭЮЯЫЁ";

export const SEARCH_TWO_VOWELS_RE = new RegExp(`[${VOWELS}].*[${VOWELS}]`);

export const MARKING_TEXT_RE = /[…\:,\.\?!\-\n]/g;
export const CLEANING_TEXT_RE = /[^а-яё'_\+\s\-]/g;

export const DEFAULT_TOKENIZER_CATEGORIES = [
  "0123456789",
  " ",
  ',.;:!?()"[]@#$%^&*_-=«»',
  "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ+'",
];

export const MAX_INPUT_LEN = 40;

const CHARS = [
  DEF_STRESS_SYMBOL,
  "-",
  "_",
  "а",
  "б",
  "в",
  "г",
  "д",
  "е",
  "ж",
  "з",
  "и",
  "й",
  "к",
  "л",
  "м",
  "н",
  "о",
  "п",
  "р",
  "с",
  "т",
  "у",
  "ф",
  "х",
  "ц",
  "ч",
  "ш",
  "щ",
  "ъ",
  "ы",
  "ь",
  "э",
  "ю",
  "я",
  "ё",
];

export const CHAR_INDICES = Object.fromEntries(CHARS.map((k, i) => [k, i]));

export const CHAR_COUNT = CHARS.length;
