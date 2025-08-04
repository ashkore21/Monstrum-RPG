
export const PERSONALITY_EFFECTS: { [key: string]: string } = {
  // Gameplay effect personalities
  Brave: "Boosts Attack when HP is below 25%.",
  Timid: "Slightly lower Attack, but has a 25% chance to dodge attacks.",
  Sturdy: "Passively increases Defense by 15%.",
  Grumpy: "Is naturally more resistant to being captured.",
  Jolly: "Gains 15% more experience points from battles.",
  
  // Flavor-only personalities
  Curious: "Always investigating its surroundings.",
  Lazy: "Prefers napping over most other activities.",
  Sassy: "Has a bit of an attitude.",
  Stoic: "Doesn't show much emotion.",
  Cheerful: "Always seems to be in a good mood.",
};

export const PERSONALITY_LIST = Object.keys(PERSONALITY_EFFECTS);
