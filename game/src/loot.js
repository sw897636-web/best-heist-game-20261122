// The Gilded Hour — loot.
// Three pieces, one on each route, so every route pays: the mask in the bright
// middle, the sapphire at the vent's exit, the ledger down the shadow aisle.
// The mask is the main target and the only one the getaway door waits for.
import { LOOT_SPOTS } from './world.js';

export function makeLoot() {
  return LOOT_SPOTS.map(function (spot) {
    return {
      id: spot.id,
      name: spot.name,
      x: spot.x,
      y: spot.y,
      value: spot.value,
      main: spot.main,
      taken: false,
      glowPhase: 0,
    };
  });
}

// Walk over a piece to take it. Returns the piece, or null.
export function tryPickup(loot, player, state) {
  for (let i = 0; i < loot.length; i += 1) {
    const item = loot[i];
    if (item.taken) continue;
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    if (dx * dx + dy * dy < 30 * 30) {
      item.taken = true;
      state.score += item.value;
      if (item.main) {
        player.carryingMain = true;
        state.exitOpen = true;
        state.message = 'The Gilded Mask is yours — get to the south door';
        state.messageTimer = 3.5;
      } else {
        state.message = item.name + ' pocketed — $' + item.value.toLocaleString('en-US');
        state.messageTimer = 2.5;
      }
      return item;
    }
  }
  return null;
}

export function lootTakenCount(loot) {
  let n = 0;
  for (let i = 0; i < loot.length; i += 1) if (loot[i].taken) n += 1;
  return n;
}
