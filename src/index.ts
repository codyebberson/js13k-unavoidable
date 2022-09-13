import { ATTACK_STATE_IDLE, ATTACK_STATE_SWINGING, ATTACK_STATE_WINDING } from './animation';
import { ACCELERATION, DASH_COOLDOWN, DASH_STAMINA_COST, PLAYER_HEIGHT, SWING_STAMINA_COST } from './constants';
import { Boss } from './entities/boss';
import { Checkpoint } from './entities/checkpoint';
import { GameEntity } from './entities/entity';
import { Fireball } from './entities/fireball';
import { FloatingText } from './entities/floatingtext';
import { Hero } from './entities/hero';
import { Particle } from './entities/particle';
import { ParticleGenerator } from './entities/particlegenerator';
import { Platform } from './entities/platform';
import { Zombie } from './entities/zombie';
import { playMusic, playSfx, stopMusic } from './lib/audio';
import { lookAt } from './lib/camera';
import { STATIC_CUBES } from './lib/constants';
import { DEBUG } from './lib/debug';
import { DrawList } from './lib/drawlist';
import {
  camera,
  drawLists,
  dt,
  gameTime,
  init,
  lightSource,
  modelViewMatrix,
  projectionMatrix,
  time,
} from './lib/engine';
import { gamepadButtons, getGamepad } from './lib/gamepad';
import { gl, HEIGHT, overlayCtx, tempVec, WIDTH } from './lib/globals';
import {
  isKeyDown,
  isKeyPressed,
  keys,
  KEY_1,
  KEY_2,
  KEY_3,
  KEY_A,
  KEY_D,
  KEY_DOWN,
  KEY_E,
  KEY_I,
  KEY_LEFT,
  KEY_M,
  KEY_RIGHT,
  KEY_S,
  KEY_UP,
  KEY_W,
  KEY_X,
  KEY_Z,
} from './lib/keyboard';
import { createMat4, multiplyMat4, scaleMat4, translateMat4 } from './lib/math/mat4';
import {
  copyVec3,
  createVec3,
  distanceVec3,
  fromValuesVec3,
  lerpVec3,
  magnitudeVec3,
  normalizeVec3,
  origin,
  rotateYVec3,
  scaleAndAddVec3,
  setVec3,
  subtractVec3,
  transformMat4Vec3,
  Vec3,
} from './lib/math/vec3';
import { drawBar, drawShadowText, drawText, setFontSize, setTextAlign } from './lib/overlay';
import { buildVoxelGeometry } from './lib/voxelengine';
import { generateLevel } from './procgen';

export const entities: GameEntity[] = [];

export const player = new Hero(256, 25, 16);
player.team = 1;
player.damage = 50;
player.interruptible = false;
entities.push(player);

export const boss = new Boss(425, 34, 375);
boss.team = 2;
boss.maxHealth = boss.health = 1000;
boss.stunDuration = 0.1;
boss.interruptible = false;
entities.push(boss);

const moveDir = createVec3();

let dialogTime = 0;

let deathDialog = false;

let screenShakeTime = 0;

let easyMode = false;

let isoMode = false;

let gameOver = false;

const objectives = [true];

// Lava floor
{
  const color = 0xff010101;
  const m = drawLists[STATIC_CUBES].addInstance(color);
  translateMat4(m, m, fromValuesVec3(256, -0.2, 256));
  scaleMat4(m, m, fromValuesVec3(8000, 0.2, 8000));
}

const dialogText = [
  [
    'Welcome to your friendly tax authority.',
    'Please proceed to the next window to complete Form 1A.',
    'We hope you have a pleasant stay.',
  ],
  [
    'Congratulations on completing Form 1A.',
    'Please proceed to the next window to complete Form 1B.',
    'We apologize for the broken A/C.',
  ],
  [
    'Congratulations on completing Form 1B.',
    'You are now eligible for a tax refund.',
    'Please proceed to the Director to claim your refund.',
  ],
  ["Welcome to the Director's office.", 'Please proceed down the stairs.', 'Thank you for your patience.'],
  [
    'Congratulations on your tax refund!',
    'After all additional taxes and fees, you have received $0.00.',
    'Thank you for your patronage.',
  ],
];

let firstClick = false;
let loading = true;
let playing = false;
let currentDialog = 0;

async function initGame(): Promise<void> {
  generateLevel();

  // Create the voxel geometry buffers
  // Must be done after level generation
  // Voxels cannot change after this point
  const voxelGeometry = buildVoxelGeometry();
  const voxelDrawList = new DrawList(gl.STATIC_DRAW, voxelGeometry, 1);
  voxelDrawList.addInstance(0xff808080);
  drawLists.push(voxelDrawList);

  // Update all of the static buffers
  // Static buffers cannot change after this point
  drawLists.forEach((b) => b.usage === gl.STATIC_DRAW && b.updateBuffers());

  // Start music last so that it starts right when the screen flips
  playMusic(13);
}

init(() => {
  if (!firstClick && isAnyInputDown()) {
    firstClick = true;
    loading = true;
    resetInputs();
    setTimeout(() => initGame().then(() => (loading = false)), 100);
  }

  if (!firstClick || loading) {
    overlayCtx.textBaseline = 'middle';
    setTextAlign('center');
    setFontSize(450);
    drawText('☣️', WIDTH / 2, HEIGHT / 2, 'rgba(0, 0, 0, 0.15)');
    setFontSize(64);
    drawShadowText('THE UNAVOIDABLE', WIDTH / 2, 130);
    setFontSize(24, 'italic bold');
    drawShadowText('Tis impossible to be sure of anything but Death and Taxes.', WIDTH / 2, 260);
    setFontSize(24);
  }

  if (!firstClick) {
    drawShadowText('PRESS ANY KEY', WIDTH / 2, 370);
  } else if (loading) {
    drawShadowText('LOADING... ', WIDTH / 2, 370);
  } else {
    updateWorld();
  }
});

function updateWorld(): void {
  player.accelerating = false;
  player.stamina = Math.min(player.stamina + dt * 10, player.maxStamina);

  const gamepad = getGamepad();

  setVec3(moveDir, 0, 0, 0);

  if (isKeyPressed(KEY_E)) {
    easyMode = !easyMode;
  }

  if (isKeyPressed(KEY_I)) {
    isoMode = !isoMode;
  }

  if (playing) {
    if (isKeyDown(KEY_UP) || isKeyDown(KEY_W)) {
      moveDir[2] += 1;
    }
    if (isKeyDown(KEY_DOWN) || isKeyDown(KEY_S)) {
      moveDir[2] -= 1;
    }
    if (isKeyDown(KEY_LEFT) || isKeyDown(KEY_A)) {
      moveDir[0] -= 1;
    }
    if (isKeyDown(KEY_RIGHT) || isKeyDown(KEY_D)) {
      moveDir[0] += 1;
    }

    if (gamepad && Math.hypot(gamepad.axes[0], gamepad.axes[1]) > 0.5) {
      moveDir[0] += gamepad.axes[0];
      moveDir[2] -= gamepad.axes[1];
    }

    // Rotate keyboard and gamepad movement to face the camera
    if (!isoMode && magnitudeVec3(moveDir) > 0.5) {
      rotateYVec3(moveDir, moveDir, origin, Math.PI / 4);
    }

    normalizeVec3(moveDir, moveDir);
    if (magnitudeVec3(moveDir) > 0.5) {
      scaleAndAddVec3(player.velocity, player.velocity, moveDir, dt * ACCELERATION);
      player.accelerating = true;
    }

    if (
      (keys.get(KEY_X).downCount === 1 || gamepadButtons.get(0).downCount === 1) &&
      player.accelerating &&
      gameTime - player.dashTime > DASH_COOLDOWN &&
      player.stamina > DASH_STAMINA_COST
    ) {
      player.velocity[0] *= 1.5;
      player.velocity[2] *= 1.5;
      player.dashTime = gameTime;
      player.stamina -= DASH_STAMINA_COST;
      playSfx(20);
    }

    if (
      (isKeyDown(KEY_Z) || gamepadButtons.get(1).down) &&
      // gameTime - player.slamTime > ATTACK_COOLDOWN &&
      player.attackState === ATTACK_STATE_IDLE &&
      player.stamina > SWING_STAMINA_COST
    ) {
      player.setAttackState(ATTACK_STATE_WINDING);
      player.slamTime = gameTime;
      player.stamina -= SWING_STAMINA_COST;
      playSfx(19);
    }
  } else if (deathDialog) {
    // Wait for the user to choose a death bonus
    if (isKeyPressed(KEY_1)) {
      player.health += 25;
      player.maxHealth += 25;
      closeDialog();
    }
    if (isKeyPressed(KEY_2)) {
      player.damage += 25;
      closeDialog();
    }
    if (isKeyPressed(KEY_3)) {
      player.stamina += 25;
      player.maxStamina += 25;
      closeDialog();
    }
  } else if (!gameOver && gameTime - dialogTime > 1.0 && isAnyInputDown()) {
    closeDialog();
  }

  // Update all entities
  for (let i = 0; i < entities.length; i++) {
    entities[i].update();
  }

  // Do entity-to-entity collision detection
  for (let i = 0; i < entities.length; i++) {
    for (let j = 0; j < entities.length; j++) {
      if (i !== j && entities[i] instanceof Zombie && entities[j] instanceof Zombie) {
        const attacker = entities[i];
        const defender = entities[j];
        subtractVec3(tempVec, defender.pos, attacker.pos);
        if (magnitudeVec3(tempVec) < 4) {
          // Push the zombies away from each other
          normalizeVec3(tempVec, tempVec);
          scaleAndAddVec3(defender.pos, defender.pos, tempVec, 0.5);
          scaleAndAddVec3(attacker.pos, attacker.pos, tempVec, -0.5);
        }
      }
      if (
        entities[i].attackState === ATTACK_STATE_SWINGING &&
        entities[j].team > 0 &&
        entities[i].team !== entities[j].team
      ) {
        // Sword damage
        if (entities[i].angleToward(entities[j].pos) < 1.5) {
          damage(entities[i], entities[j]);
        }
      }
      if (entities[i] instanceof Checkpoint && entities[j] instanceof Hero) {
        if (distanceVec3(entities[i].pos, entities[j].pos) < 8) {
          player.activeCheckpoint = entities[i] as Checkpoint;
          if (!objectives[player.activeCheckpoint.objective]) {
            objectives[player.activeCheckpoint.objective] = true;
            playSfx(21);
            playMusic(13);
            player.health = player.maxHealth;
            player.stamina = player.maxStamina;
            playing = false;
            dialogTime = gameTime;
            deathDialog = false;
            resetInputs();
            currentDialog = player.activeCheckpoint.objective;
          }
        }
      }
      if (entities[i] instanceof ParticleGenerator && entities[j] instanceof Hero) {
        if (distanceVec3(entities[i].pos, entities[j].pos) < 12) {
          damage(entities[i], entities[j]);
        }
      }
      if (entities[i] instanceof Fireball && entities[j] instanceof Hero) {
        const fireball = entities[i];
        if (
          !player.isInvincible() &&
          fireball.pos[1] + 4 > player.pos[1] &&
          fireball.pos[1] - 4 < player.pos[1] + PLAYER_HEIGHT &&
          Math.hypot(fireball.pos[0] - player.pos[0], fireball.pos[2] - player.pos[2]) < 4
        ) {
          damage(entities[i], entities[j]);
        }
      }
      if (entities[i] instanceof Platform && !(entities[j] instanceof Platform)) {
        const platform = entities[i] as Platform;
        const actor = entities[j];
        // Need actor size
        // Assume actor is a cylinder
        // Assume radius 1.0 and height 3.0
        // actor.pos represents center of feet
        const actorX = actor.pos[0];
        const actorY = actor.pos[1];
        const actorZ = actor.pos[2];
        const projectile = actor instanceof Particle && actor.projectile > 0;
        const actorRadius = projectile ? 0.1 : 0.7;
        const actorHeight = projectile ? 0.1 : 2.5;

        const platformMinX = platform.pos[0] - platform.scale[0] - actorRadius;
        const platformMinY = platform.pos[1] - platform.scale[1];
        const platformMinZ = platform.pos[2] - platform.scale[2] - actorRadius;

        const platformMaxX = platform.pos[0] + platform.scale[0] + actorRadius;
        const platformMaxY = platform.pos[1] + platform.scale[1];
        const platformMaxZ = platform.pos[2] + platform.scale[2] + actorRadius;

        const graceY = 1.0;

        if (actorX > platformMinX && actorX < platformMaxX && actorZ > platformMinZ && actorZ < platformMaxZ) {
          if (projectile && actorY < platformMaxY && actorY > platformMinY) {
            // Destroy the projectile
            actor.health = 0;
          } else if (actorY > platformMaxY - graceY && actorY < platformMaxY) {
            // Put the actor on top of the platform
            actor.pos[1] = platformMaxY;
            if (actor.velocity[1] < 0) {
              actor.velocity[1] = 0;
              actor.groundedTime = gameTime;
              actor.groundedPlatform = platform;
              scaleAndAddVec3(actor.pos, actor.pos, platform.velocity, dt);
            }
          } else if (actorY < platformMaxY && actorY + actorHeight > platformMinY) {
            // Determine which edge to use
            // Push the actor away from the platform
            if (actorX < platform.pos[0] - platform.scale[0]) {
              actor.pos[0] = platformMinX;
            } else if (actorX > platform.pos[0] + platform.scale[0]) {
              actor.pos[0] = platformMaxX;
            } else if (actorZ < platform.pos[2] - platform.scale[2]) {
              actor.pos[2] = platformMinZ;
            } else {
              actor.pos[2] = platformMaxZ;
            }
          }
        }
      }
    }
  }

  setTextAlign('left');
  setFontSize(10);

  // Healthbar
  drawBar(20, 20, player.health, player.maxHealth, '#7b1d17', player.maxHealth * 2);
  drawShadowText(`${player.health} / ${player.maxHealth}`, 30 + player.maxHealth * 2, 16, '#a99');

  // Stamina
  drawBar(20, 35, player.stamina, player.maxStamina, '#18506d', player.maxStamina * 2);
  drawShadowText(`${Math.round(player.stamina)} / ${player.maxStamina}`, 30 + player.maxStamina * 2, 31, '#a99');

  setFontSize(14);
  drawShadowText('Objectives:', 20, 100);
  drawShadowText('Form 1A', 40, 125, objectives[1] ? '#fff' : '#a99');
  drawShadowText('Form 1B', 40, 150, objectives[2] ? '#fff' : '#a99');
  drawShadowText('The Director', 40, 175, objectives[3] ? '#fff' : '#a99');
  drawShadowText('Tax Refund', 40, 200, objectives[4] ? '#fff' : '#a99');

  setFontSize(12);
  drawShadowText('Z - ATTACK       X - DASH       ARROW KEYS TO MOVE', 10, HEIGHT - 16, '#ccc');

  setTextAlign('right');
  drawShadowText(
    'I - ISO MODE: ' + (isoMode ? 'ON' : 'OFF') + '      E - EASY MODE: ' + (easyMode ? 'ON' : 'OFF'),
    WIDTH - 10,
    HEIGHT - 16,
    '#ccc'
  );
  setTextAlign('left');

  if (boss.aggro && boss.health > 0) {
    setFontSize(16);
    drawShadowText('The Director', 200, 450, '#fff');
    drawBar(200, 470, boss.health, boss.maxHealth, '#7b1d17', 560, 14);
  }

  if (DEBUG) {
    setTextAlign('left');
    setFontSize(10);
    drawShadowText('health = ' + player.health.toFixed(1), 750, 220);
    drawShadowText('time = ' + time.toFixed(1), 750, 240);
    drawShadowText('gameTime = ' + gameTime.toFixed(1), 750, 260);
    drawShadowText('dt = ' + dt.toFixed(3), 750, 280);
    drawShadowText(`player.pos = ` + vec3ToString(player.pos), 750, 300);
    drawShadowText(`player.velocity = ` + vec3ToString(player.velocity), 750, 320);
    drawShadowText(`camera.pos = ` + vec3ToString(camera.source), 750, 340);
    drawShadowText(`lightSource.source = ` + vec3ToString(lightSource.source), 750, 360);
    drawShadowText(`groundedTime = ` + player.groundedTime, 750, 380);
    drawShadowText(`isGrounded = ` + player.isGrounded(), 750, 400);
    drawShadowText(`isDashing = ` + player.isDashing(), 750, 420);
  }

  if (!playing) {
    // Draw the dialog overlay
    // Rounded rectangle
    // White border
    const x = 50;
    const y = 300;
    const w = 860;
    const h = 200;
    const r = 16;
    overlayCtx.fillStyle = '#000';
    overlayCtx.strokeStyle = '#fff';
    overlayCtx.lineWidth = 3;
    overlayCtx.beginPath();
    overlayCtx.moveTo(x + r, y);
    overlayCtx.arcTo(x + w, y, x + w, y + h, r);
    overlayCtx.arcTo(x + w, y + h, x, y + h, r);
    overlayCtx.arcTo(x, y + h, x, y, r);
    overlayCtx.arcTo(x, y, x + w, y, r);
    overlayCtx.closePath();
    overlayCtx.fill();
    overlayCtx.stroke();

    if (deathDialog) {
      setTextAlign('center');

      setFontSize(20);
      drawShadowText('In death, you find strength. Choose a bonus.', WIDTH / 2, 320);

      setFontSize(40);
      drawShadowText('🛡️', (WIDTH * 0.2) | 0, 380);
      drawShadowText('⚔️', (WIDTH * 0.5) | 0, 380);
      drawShadowText('⚡', (WIDTH * 0.8) | 0, 380);

      setFontSize(16);
      drawShadowText('1: +25 Max Health', (WIDTH * 0.2) | 0, 440);
      drawShadowText('2: +25 Attack Power', (WIDTH * 0.5) | 0, 440);
      drawShadowText('3: +25 Stamina', (WIDTH * 0.8) | 0, 440);
    } else {
      setFontSize(128);
      drawShadowText('💀', 60, 340);

      setFontSize(20);
      let lineY = 330;
      for (const line of dialogText[currentDialog]) {
        drawShadowText(line, 250, lineY);
        lineY += 50;
      }
    }
  }

  if (magnitudeVec3(player.velocity) > 5) {
    if (Math.random() < 0.2) {
      const dust = new Particle(player.pos[0], player.pos[1], player.pos[2]);
      dust.velocity[1] = 0.1;
      entities.push(dust);
    }
  }

  if (!gameOver && boss.health <= 0) {
    // Boss died
    gameOver = true;
    stopMusic();
    playSfx(22);

    // Remove all remaining enemies
    for (let i = entities.length - 1; i >= 0; i--) {
      if (entities[i].team === 2) {
        entities.splice(i, 1);
      }
    }

    // Final checkpoint
    // This should only be enabled once the boss is dead
    entities.push(new Checkpoint(425, 34, 375, 4));
  }

  for (let i = entities.length - 1; i >= 0; i--) {
    const entity = entities[i];
    if (entity.health <= 0) {
      if (entity === player) {
        // Player died
        // Reset position and health
        playSfx(17);
        playSfx(18);
        playMusic(13);
        playing = false;
        dialogTime = gameTime;
        deathDialog = true;
        resetInputs();
        if (player.activeCheckpoint) {
          copyVec3(player.pos, player.activeCheckpoint.pos);
        } else {
          setVec3(player.pos, 256, 25, 16);
        }
        player.health = player.maxHealth;
        player.stamina = player.maxStamina;
        for (const e of entities) {
          e.aggro = false;
        }
      } else {
        entities.splice(i, 1);
      }
      continue;
    }
    if (entity instanceof FloatingText) {
      drawWorldText(entity.text, entity.pos);
    } else {
      entity.setupTransformMatrix();
      entity.render();
    }
  }

  const desiredCameraPosition = fromValuesVec3(player.pos[0] - 36, player.pos[1] + 72, player.pos[2] - 36);
  camera.near = 15;
  camera.far = 30;

  if (isKeyDown(KEY_M)) {
    setVec3(desiredCameraPosition, player.pos[0] - 30, player.pos[1] + 16, player.pos[2] - 30);
    camera.near = 2;
    camera.far = 50;
  }

  if (distanceVec3(camera.source, desiredCameraPosition) < 2) {
    copyVec3(camera.source, desiredCameraPosition);
  } else {
    lerpVec3(camera.source, camera.source, desiredCameraPosition, 0.1);
  }

  if (gameTime < screenShakeTime) {
    // Screen shake
    const shake = 1.2 + screenShakeTime - gameTime;
    lookAt(
      camera,
      fromValuesVec3(
        camera.source[0] + 36 + shake * Math.random(),
        camera.source[1] - 72 + shake * Math.random() + 2,
        camera.source[2] + 36 + shake * Math.random()
      ),
      Math.PI / 4
    );
  } else {
    lookAt(camera, fromValuesVec3(camera.source[0] + 36, camera.source[1] - 72, camera.source[2] + 36), Math.PI / 4);
  }

  copyVec3(lightSource.source, fromValuesVec3(100, 500, -25));
  lookAt(lightSource, player.pos, 0.2);
}

function closeDialog(): void {
  playMusic(0);
  playing = true;
  resetInputs();
}

function damage(attacker: GameEntity, defender: GameEntity): void {
  subtractVec3(tempVec, defender.pos, attacker.pos);
  if (!defender.isInvincible() && magnitudeVec3(tempVec) < 12) {
    let damage = attacker.damage;
    if (easyMode && defender === player) {
      damage = 0;
    }
    defender.health -= damage;
    defender.stunTime = defender.invincibleTime = gameTime;
    defender.accelerating = false;
    if (defender.interruptible) {
      // Interrupt any attacks
      defender.setAttackState(ATTACK_STATE_IDLE);
    }
    normalizeVec3(tempVec, tempVec);
    let knockback = 60.0;
    if (attacker === boss) {
      knockback = 300;
    }
    scaleAndAddVec3(defender.velocity, defender.velocity, tempVec, knockback);
    // scaleAndAddVec3(defender.pos, defender.pos, tempVec, knockback);
    const explosion = new Particle(
      0.2 * attacker.pos[0] + 0.8 * defender.pos[0],
      0.2 * attacker.pos[1] + 0.8 * defender.pos[1] + 1,
      0.2 * attacker.pos[2] + 0.8 * defender.pos[2]
    );
    explosion.size = 0.3;
    explosion.color = 0xff8080ff;
    explosion.velocity[1] = 0.1;
    entities.push(explosion);
    const floatingText = new FloatingText(explosion.pos[0], explosion.pos[1] + 2, explosion.pos[2], damage.toString());
    floatingText.velocity[1] = 8;
    entities.push(floatingText);
    playSfx(2);
    screenShakeTime = gameTime + 0.25;
  }
}

function drawWorldText(msg: string, pos: Vec3, size = 32): void {
  setFontSize(size);
  // modelViewMatrix
  // gl_Position = u_projectionMatrix * u_viewMatrix * v_position;
  const debugMatrix = createMat4();
  multiplyMat4(debugMatrix, projectionMatrix, modelViewMatrix);
  const debugVec = createVec3();
  transformMat4Vec3(debugVec, pos, debugMatrix);
  if (debugVec[2] > 0) {
    drawShadowText(msg, (1 + debugVec[0]) * 0.5 * WIDTH, (1 - debugVec[1]) * 0.5 * HEIGHT, '#f00');
  }
}

function vec3ToString(point: Vec3, precision = 1): string {
  return `${point[0].toFixed(precision)}, ${point[1].toFixed(precision)}, ${point[2].toFixed(precision)}`;
}

function isAnyInputDown(): boolean {
  return keys.isAnyDown() || gamepadButtons.isAnyDown();
}

function resetInputs(): void {
  keys.clear();
  gamepadButtons.clear();
}
