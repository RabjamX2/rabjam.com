export class CPUPlayer {
    playingAs; // 0 = red, 1 = blue

    constructor(playingAs = 1) {
        this.playingAs = playingAs;
    }

    /** @param {import("./Game.svelte.js").Connect4} game */
    playTurn(game) {
        throw new Error("playTurn() must be implemented by subclass");
    }
}
