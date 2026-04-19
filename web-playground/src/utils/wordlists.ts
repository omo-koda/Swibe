/**
 * CloakSeed: Preloaded word themes for custom ciphers
 * 5 theme categories x 2048 words each
 */

export interface Theme {
  name: string
  icon: string
  words: string[]
}

export const THEMES: Record<string, Theme> = {
  animals: {
    name: "Animals",
    icon: "🦁",
    words: [
      "aardvark", "albatross", "alligator", "alpaca", "ant", "antelope", "ape", "aphid",
      "arctic", "armadillo", "asp", "ass", "aster", "atlas", "badger", "bagworm",
      "bald", "ball", "balsam", "bamboo", "banana", "bandicoot", "bantam", "barb",
      "barbel", "bard", "bare", "bark", "barking", "barn", "barracuda", "barrel",
      "barren", "barret", "barrier", "barring", "barrow", "basal", "basalt", "base",
      "based", "baseless", "baseline", "basement", "bases", "basic", "basil", "basin",
      "bask", "basket", "bass", "bassoon", "bastard", "baste", "bastion", "bat",
      "batch", "bate", "bated", "bath", "bathe", "bathos", "batik", "bating",
      // NOTE: This is a truncated placeholder. In production, each theme must have
      // exactly 2048 unique words. The full wordlists should be loaded from a
      // separate data file or generated programmatically.
    ],
  },
  colors: {
    name: "Colors",
    icon: "🎨",
    words: [
      "amber", "amethyst", "apricot", "aqua", "aquamarine", "ash", "ashen", "aubergine",
      "auburn", "azure", "azurite", "baby", "babyblue", "babypink", "babypurple", "babyyellow",
    ],
  },
  food: {
    name: "Food",
    icon: "🍕",
    words: [
      "apple", "apricot", "artichoke", "asparagus", "avocado", "banana", "basil", "bean",
      "beans", "beet", "beets", "bell", "bellpepper", "berry", "beverages", "bibb",
    ],
  },
  fantasy: {
    name: "Fantasy",
    icon: "⚔️",
    words: [
      "abyss", "acheron", "acorn", "acrylon", "adder", "addle", "adept", "adit",
      "aeons", "aero", "aeromancy", "aesir", "aether", "affray", "afraid", "afrit",
    ],
  },
  nonsense: {
    name: "Nonsense",
    icon: "🎪",
    words: [
      "blorb", "glork", "snizzle", "flurp", "whizzle", "blart", "zibber", "floozit",
      "krazzle", "snazzle", "glibberish", "zozzle", "spazzle", "whizzlebop", "glorble", "snozzwanger",
    ],
  },
}

export const allWords: string[] = Object.values(THEMES).flatMap(theme => theme.words)

export function getThemeByName(name: string): Theme {
  return THEMES[name.toLowerCase()] || THEMES.animals
}

export function getThemeNames(): string[] {
  return Object.keys(THEMES)
}
