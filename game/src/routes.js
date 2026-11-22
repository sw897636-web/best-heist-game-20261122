// The Gilded Hour — the three routes through the room.
// Each route is a named plan with a different price: the fast one is watched,
// the quiet one is slow, the third costs an EMP. The names are drawn on the
// title screen so the player — and the judge — can read the choice.
export const ROUTES = [
  {
    id: 'front',
    name: 'The Gilded Hall',
    price: 'Fast, watched',
    note: 'Straight up the middle past the porcelain case. Dense cones, no cover — read the pauses and move in the gaps.',
  },
  {
    id: 'shadow',
    name: 'The Long Shadow',
    price: 'Slow, quiet',
    note: 'Down the dark west aisle. Half the evidence in shadow, and the Ledger of Names sits on the way.',
  },
  {
    id: 'vent',
    name: 'The Vent Run',
    price: 'Costs an EMP',
    note: 'EMP the grate by the north wall, crawl the duct, drop behind the Star Sapphire. Unseen — until you land.',
  },
];
