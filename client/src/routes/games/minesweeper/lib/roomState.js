/**
 * Bridge between the hub page (room creation) and the game room page.
 * A single pending room is held in memory; the game page claims it with takePendingRoom().
 *
 * @type {{ socket: import('socket.io-client').Socket, playerIndex: number, playerName: string, playerId: string, mode: string, color: string } | null}
 */
let pendingRoom = null;

export function setPendingRoom(state) {
    pendingRoom = state;
}

export function takePendingRoom() {
    const s = pendingRoom;
    pendingRoom = null;
    return s;
}
