/**
 * Module-level bridge for passing socket state from the "create room" flow
 * on /games/connect4 to the /games/connect4/[code] page after navigation.
 * Only populated for the room creator; joiners connect fresh on the [code] page.
 */

/** @type {{ socket: import('socket.io-client').Socket, playerIndex: number, playerName: string, playerId: string, color: string } | null} */
let pending = null;

export function setPendingRoom(state) {
    pending = state;
}

/** Consumes and returns the pending room state (clears it after reading). */
export function takePendingRoom() {
    const s = pending;
    pending = null;
    return s;
}
