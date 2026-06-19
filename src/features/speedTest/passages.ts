/**
 * Sample passages for the reading-speed test. Each has a precounted word total
 * (used to compute WPM) and a few comprehension questions used by the
 * comprehension variant. Keep passages roughly 200–260 words.
 */

export type ComprehensionQuestion = {
  prompt: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
};

export type Passage = {
  id: string;
  title: string;
  text: string;
  wordCount: number;
  questions: ComprehensionQuestion[];
};

export const PASSAGES: Passage[] = [
  {
    id: 'lighthouse',
    title: 'The Lighthouse Keeper',
    wordCount: 218,
    text:
      'For thirty years Elias had kept the light burning on Gull Point, and in all that time he had never once let it fail. The work was quiet but exacting. Each evening, as the sun slid behind the water, he climbed the spiral stairs with a can of oil and a cloth, trimmed the wick, and polished the great glass lens until it threw a clean white beam far out across the waves. Sailors who would never meet him owed him their lives, and he took a steady, private pride in that.\n\n' +
      'The village below rarely thought of the lighthouse until a storm rolled in. Then every family with a boat at sea would watch the headland, counting the slow sweep of the light and reading in it a promise that someone was awake and watching. Elias understood this better than anyone. He had buried a brother who drowned within sight of an unlit shore, on a night when the previous keeper had fallen ill and no one had thought to take his place.\n\n' +
      'So he stayed. Through fevers and lonely winters and the slow ache of growing old, he climbed the stairs. People called it duty, but Elias thought of it more simply. The light was a kind of conversation with strangers in the dark, and he had no intention of letting it go silent.',
    questions: [
      {
        prompt: 'How long had Elias kept the light?',
        options: ['Ten years', 'Thirty years', 'A single winter', 'Since childhood'],
        answer: 1,
      },
      {
        prompt: 'Why did Elias feel so committed to the work?',
        options: [
          'He was paid very well',
          'His brother drowned near an unlit shore',
          'He disliked the village',
          'He wanted to become famous',
        ],
        answer: 1,
      },
      {
        prompt: 'How did Elias think of the light?',
        options: [
          'As a burden he resented',
          'As a conversation with strangers in the dark',
          'As a way to get rich',
          'As a tourist attraction',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'seed-vault',
    title: 'The Seed Vault',
    wordCount: 224,
    text:
      'Deep inside a frozen mountain on a remote Arctic island sits one of the most important buildings most people will never see. It is a seed vault, built to store duplicates of seeds from the world’s crop collections. The idea is simple but profound: if a war, a flood, or a failed harvest wipes out a country’s store of seeds, a backup will still exist, locked safely in the cold.\n\n' +
      'The vault works almost entirely without machinery. The surrounding rock stays naturally frozen year round, so even if the power failed, the seeds inside would remain cold for a very long time. Tunnels slope downward into the mountain, and at the end lie chambers packed with sealed packets, each labelled and catalogued. Some hold the ancestors of the wheat and rice we eat today; others hold rare varieties that almost no one grows anymore.\n\n' +
      'Countries that deposit seeds keep ownership of them, the way a person keeps ownership of valuables in a bank. They can withdraw their seeds whenever they need them, and on at least one occasion a collection was indeed restored from the vault after the original was lost in a conflict. In a world of fast change and uncertain weather, the quiet vault stands as a long bet on the future, made of nothing more dramatic than careful planning and cold stone.',
    questions: [
      {
        prompt: 'What is stored in the vault?',
        options: ['Gold reserves', 'Backup copies of crop seeds', 'Historical documents', 'Fresh water'],
        answer: 1,
      },
      {
        prompt: 'Why is the location useful even without power?',
        options: [
          'It is close to a city',
          'The rock stays naturally frozen',
          'It has many windows',
          'It floats on the sea',
        ],
        answer: 1,
      },
      {
        prompt: 'Who owns the deposited seeds?',
        options: [
          'The island government',
          'No one',
          'The countries that deposit them',
          'A private company',
        ],
        answer: 2,
      },
    ],
  },
];

/** Pick a passage (rotates by index for variety). */
export function pickPassage(index = 0): Passage {
  return PASSAGES[index % PASSAGES.length];
}
