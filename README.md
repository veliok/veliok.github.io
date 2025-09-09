# Hosting some wasm projects for Pilvipalvelut
<br>

## [wasmboy](https://github.com/torch2424/wasmboy) running Public Domain ROM of Ultima III
<iframe title="WasmBoy Iframe Embed" width="320" height="288" allowfullscreen="true" src="https://wasmboy.app/iframe/?rom-url=https://raw.githubusercontent.com/veliok/veliok.github.io/main/gb/ult3.gb"> </iframe>
<br><br>

## [WASMpsx](https://github.com/js-emulators/wasmpsx) with Net Yaroze games
<script src="ps1/wasmpsx.min.js"></script>
<wasmpsx-player id="wasmpsx-element"></wasmpsx-player>
<script>
    const player = document.getElementById("wasmpsx-element");
    player.fetchFile("ps1/ny.bin, "ny.bin").then(() => {
        player.readFile("ny.bin");
    });
</script>

> Net Yaroze was an development kit for Sony Playstation console.
> Consumers were able to write PS1 games in C code and upload it to the console.
> Wanted to showcase this, will remove after the course because gray area.


