<script>
    import Seat from "./Seat.svelte";

    let { seatList, mySeat, gameInProgress, currentPlayerSeat, onSitDown } = $props();

    const TOTAL = 15;

    /**
     * Compute the oval position for a seat so that *my* seat always appears
     * at the bottom-centre (6 o'clock) of the table.
     *
     * Without rotation seat 1 sits at the top (−90°), clockwise.
     * We shift every angle so mySeat lands at +90° (bottom).
     */
    function seatPos(seatNum) {
        const baseAngle = -90 + (seatNum - 1) * (360 / TOTAL);
        let offset = 0;
        if (mySeat !== null) {
            const myBase = -90 + (mySeat - 1) * (360 / TOTAL);
            offset = 90 - myBase;
        }
        const rad = ((baseAngle + offset) * Math.PI) / 180;
        // Oval radii: 43 % horizontal, 37 % vertical from the centre (50 %, 50 %)
        const x = 50 + 43 * Math.cos(rad);
        const y = 50 + 37 * Math.sin(rad);
        return { left: `${x.toFixed(2)}%`, top: `${y.toFixed(2)}%` };
    }
</script>

<div class="table-felt">
    <div class="oval-table">
        {#each seatList as [seatNumber, player]}
            {@const pos = seatPos(seatNumber)}
            <div class="seat-anchor" style="top: {pos.top}; left: {pos.left};">
                <Seat
                    {player}
                    {seatNumber}
                    isMyself={seatNumber === mySeat}
                    {gameInProgress}
                    isCurrentTurn={seatNumber === currentPlayerSeat}
                    {onSitDown}
                />
            </div>
        {/each}

        <div class="table-logo">♠ ♥ ♣ ♦</div>
    </div>
</div>

<style>
    .table-felt {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .oval-table {
        position: relative;
        width: min(calc(100vw - 40px), 720px);
        height: min(calc(100vh - 220px), 500px);
        background: radial-gradient(ellipse at center, #2d7a52 55%, #1b4d33 80%, #123626 100%);
        border-radius: 50%;
        border: 10px solid #6b3f10;
        box-shadow:
            0 0 0 4px #3a2008,
            0 0 60px rgba(0, 0, 0, 0.7),
            inset 0 0 50px rgba(0, 0, 0, 0.35);
    }

    .seat-anchor {
        position: absolute;
        transform: translate(-50%, -50%);
    }

    .table-logo {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: rgba(255, 255, 255, 0.07);
        font-size: 1.8rem;
        letter-spacing: 12px;
        pointer-events: none;
        user-select: none;
    }
</style>
