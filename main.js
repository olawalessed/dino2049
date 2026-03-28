import { createScene } from './scene.js';
import { createGame } from './game.js';

const container = document.querySelector('#app');
const score = document.querySelector('#score');
const prompt = document.querySelector('#start-prompt');

if (!container || !score || !prompt) {
  throw new Error('Expected #app, #score, and #start-prompt elements to exist.');
}

const sceneContext = createScene(container);
const game = createGame({
  ...sceneContext,
  ui: {
    score,
    prompt,
  },
});

game.start();

window.addEventListener('beforeunload', () => {
  sceneContext.dispose();
  game.stop();
});
