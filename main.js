import { createScene } from './scene.js';
import { createGame } from './game.js';

const container = document.querySelector('#app');

if (!container) {
  throw new Error('Expected #app container to exist.');
}

const sceneContext = createScene(container);
const game = createGame(sceneContext);

game.start();

window.addEventListener('beforeunload', () => {
  sceneContext.dispose();
  game.stop();
});
