<template>
  <div class="game-wrapper">
    <div class="game-container">
      <canvas
        ref="canvasRef"
        id="screen"
        width="160"
        height="100"
        class="game-canvas"
      />
    </div>

    <div class="hud">
      <p>ARROWS to Move & Turn | SPACE to Step Forward</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGame } from "./composables/useGame";

const canvasRef = ref<HTMLCanvasElement | null>(null);
const { levelData } = useGame(canvasRef);
</script>

<style scoped>
.game-wrapper {
  background-color: #222;
  color: #ddd;
  font-family: "Courier New", Courier, monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
  overflow: hidden;
}

.game-container {
  position: relative;
  border: 20px solid #444;
  border-radius: 10px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
  background: #000;
}

.game-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
  width: 800px;
  height: 500px;
  background-color: #fff;
}

.hud {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #888;
}
</style>
