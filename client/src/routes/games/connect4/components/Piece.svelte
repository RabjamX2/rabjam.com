<script>
    let { col, row, color, size = 50, slot = 60 } = $props();
</script>

<div
    class="piece {color}"
    style="left:{col * slot + (slot - size) / 2}px; top:{row * slot +
        (slot - size) / 2}px; width:{size}px; height:{size}px;"
></div>

<style>
    .piece {
        position: absolute;
        border-radius: 50%;
    }
    .piece.red {
        background: red;
    }
    .piece.blue {
        background: blue;
    }
</style>
