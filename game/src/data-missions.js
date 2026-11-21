// data-missions.js — the night's eight chained story jobs. Every job is a chain of
// stages (pickup → timed drops → lose the tail), each stage carrying the dialogue
// line the giver says while it is live, so the HUD always narrates the mechanic
// in the scene. Heat is scripted per job: the PHCPD leans harder every drop.

export const MISSIONS = [
  {
    id: 'tide', n: 1, name: 'FIRST TIDE', giver: 'MAMA VEGA', pay: 2600, rp: 120, heat: 0,
    intro: 'Cargo\'s hot, mijo. Wheels up before the tide turns — one box, one door, no noise.',
    stages: [
      { kind: 'pickup', at: 'crane',  time: 75,  line: 'Pier 9, under the crane. The box is marked with a pink tag.', next: 'Take the cargo from Pier 9' },
      { kind: 'drop',   at: 'casino', time: 95,  line: 'Casino Azahar, back door. Knock twice, drive once.', next: 'Deliver to CASINO AZAHAR' },
    ],
  },
  {
    id: 'cold', n: 2, name: 'COLD CONTAINERS', giver: 'MAMA VEGA', pay: 3900, rp: 170, heat: 1,
    intro: 'Two cold boxes off the K-7 yard. Fish on paper, money in fact. The harbor band will notice.',
    stages: [
      { kind: 'pickup', at: 'yard',   time: 80,  line: 'Container yard K-7, third row. Mind the forklifts, they gossip.', next: 'Load up at CONTAINER YARD K-7' },
      { kind: 'drop',   at: 'market', time: 105, line: 'Mercado Alto fish stalls. Smell covers everything, even guilt.', next: 'Deliver to MERCADO ALTO' },
      { kind: 'drop',   at: 'hotel',  time: 90,  line: 'Hotel Lucero service bay. A bellhop with no questions waits.', next: 'Deliver to HOTEL LUCERO' },
    ],
  },
  {
    id: 'ghost', n: 3, name: 'CUSTOMS GHOST', giver: 'IBO SANZ', pay: 4600, rp: 210, heat: 2,
    intro: 'A customs drone tagged your plates over the bridge. Deliver, then become weather: vanish.',
    stages: [
      { kind: 'pickup', at: 'crane',  time: 75,  line: 'Same crane, new sins. Box is heavier than it looks.', next: 'Take the cargo from Pier 9' },
      { kind: 'drop',   at: 'chapel', time: 100, line: 'Capilla del Mar steps. Even the saints look away tonight.', next: 'Deliver to CAPILLA DEL MAR' },
      { kind: 'escape', at: null,     time: 120, line: 'Now ghost. Break their sight and keep it broken until the band goes quiet.', next: 'Lose the PHCPD — stay unseen' },
    ],
  },
  {
    id: 'mile', n: 4, name: 'NEON RUN', giver: 'MAMA VEGA', pay: 5800, rp: 260, heat: 2,
    intro: 'Three doors on the Neon Mile want their cut before the clubs close. The Mile is all cameras, mijo.',
    stages: [
      { kind: 'pickup', at: 'yard',   time: 80,  line: 'K-7 again. The night foreman is ours until 2 a.m.', next: 'Load up at CONTAINER YARD K-7' },
      { kind: 'drop',   at: 'casino', time: 85,  line: 'Azahar first — their door closes when the show ends.', next: 'Deliver to CASINO AZAHAR' },
      { kind: 'drop',   at: 'bridge', time: 95,  line: 'Puente Bruma south ramp. A courier on a scooter takes it from there.', next: 'Deliver at PUENTE BRUMA' },
      { kind: 'drop',   at: 'tower',  time: 110, line: 'Onda Neón tower yard. The DJ pays in cash and requests.', next: 'Deliver to ONDA NEÓN TOWER' },
    ],
  },
  {
    id: 'inspector', n: 5, name: 'THE INSPECTOR', giver: 'LULA FERRER', pay: 7200, rp: 320, heat: 3,
    intro: 'Inspector Salas set a roadblock net for you personally. Flattering. Drive through his feelings.',
    stages: [
      { kind: 'pickup', at: 'crane',  time: 75,  line: 'Pier 9. Salas watches the docks now — smile for his telescope.', next: 'Take the cargo from Pier 9' },
      { kind: 'drop',   at: 'hill',   time: 120, line: 'Colina Serena overlook. Rich streets, thin police, thick curtains.', next: 'Deliver to COLINA SERENA' },
      { kind: 'drop',   at: 'market', time: 110, line: 'Down to the Mercado. If a roadblock breathes on you, Pato burns the plates.', next: 'Deliver to MERCADO ALTO' },
    ],
  },
  {
    id: 'lights', n: 6, name: 'HARBOR LIGHTS', giver: 'MAMA VEGA', pay: 8800, rp: 380, heat: 4,
    intro: 'The lighthouse keeper sells his silence by the hour and the bird is already up. Fly low, drive lower.',
    stages: [
      { kind: 'pickup', at: 'yard',   time: 80,  line: 'K-7, last row. This box ticks — it is a clock, probably.', next: 'Load up at CONTAINER YARD K-7' },
      { kind: 'drop',   at: 'ferry',  time: 115, line: 'Last Ferry terminal. The gate captain leaves at the horn, not after.', next: 'Deliver to LAST FERRY' },
      { kind: 'drop',   at: 'hill',   time: 120, line: 'Colina again — the overlook buyer doubled his price and his nerves.', next: 'Deliver to COLINA SERENA' },
      { kind: 'escape', at: null,     time: 130, line: 'Bird\'s lit. Kill your lights in the dock shadow and let the harbor hide you.', next: 'Lose the PHCPD — stay unseen' },
    ],
  },
  {
    id: 'net', n: 7, name: 'THE LONG NET', giver: 'IBO SANZ', pay: 11000, rp: 460, heat: 5,
    intro: 'Full net tonight: five stars of attention, roadblocks on the bridges, and every door still wants paying.',
    stages: [
      { kind: 'pickup', at: 'crane',  time: 70,  line: 'Pier 9, fast hands. The whole band is already singing your name.', next: 'Take the cargo from Pier 9' },
      { kind: 'drop',   at: 'market', time: 100, line: 'Mercado first — the stalls fold at midnight and so does the money.', next: 'Deliver to MERCADO ALTO' },
      { kind: 'drop',   at: 'casino', time: 90,  line: 'Azahar. Their doorman counts stars better than the police do.', next: 'Deliver to CASINO AZAHAR' },
      { kind: 'drop',   at: 'ferry',  time: 115, line: 'Ferry gate. If the net closes, the dock road is your only honest friend.', next: 'Deliver to LAST FERRY' },
      { kind: 'drop',   at: 'yard',   time: 100, line: 'Home to K-7. Bring the night back where it started.', next: 'Deliver to CONTAINER YARD K-7' },
    ],
  },
  {
    id: 'harbor', n: 8, name: 'NEON HARBOR', giver: 'MAMA VEGA', pay: 16000, rp: 600, heat: 5,
    intro: 'Last job of the night, mijo. Every crew, every door, every light in the harbor — one run to legend.',
    stages: [
      { kind: 'pickup', at: 'yard',   time: 70,  line: 'The final box. Gold tag. The harbor holds its breath.', next: 'Load up at CONTAINER YARD K-7' },
      { kind: 'drop',   at: 'tower',  time: 95,  line: 'Tower yard — the DJ announces your run live. Give him a story.', next: 'Deliver to ONDA NEÓN TOWER' },
      { kind: 'drop',   at: 'hotel',  time: 85,  line: 'Lucero bay. The bellhop retires rich tonight.', next: 'Deliver to HOTEL LUCERO' },
      { kind: 'drop',   at: 'hill',   time: 110, line: 'Colina overlook. The whole city below you, working for you.', next: 'Deliver to COLINA SERENA' },
      { kind: 'drop',   at: 'crane',  time: 115, line: 'Pier 9, where it began. Bring her home under the crane, legend.', next: 'Deliver to PIER 9 — FINAL' },
    ],
  },
];

export function medalFor(secondsLeft, parSeconds) {
  const r = secondsLeft / Math.max(1, parSeconds);
  if (r >= 0.35) return 'GOLD';
  if (r >= 0.15) return 'SILVER';
  return 'BRONZE';
}
