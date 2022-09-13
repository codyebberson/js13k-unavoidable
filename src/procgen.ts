import { entities, player } from '.';
import { Checkpoint } from './entities/checkpoint';
import { Eyeball } from './entities/eyeball';
import { Fireball } from './entities/fireball';
import { Platform } from './entities/platform';
import { Zombie } from './entities/zombie';
import { fromValuesVec3, setVec3 } from './lib/math/vec3';
import { setVoxel } from './lib/voxelengine';

export function generateLevel(): void {
  // createZone(0, [fromValuesVec3(0, 0, 0), fromValuesVec3(512, 64, 512)]);

  // Initial platform
  // Checkpoint #1
  // createPlatform(240, 272, 4, 0, 32);
  fillVoxels(238, 274, 0, 4, 0, 36, 0.8);
  fillVoxels(240, 272, 2, 4, 2, 34, -1);
  setVec3(player.pos, 256, 10, 18);
  entities.push(new Checkpoint(256, 3, 18, 0));

  // Bridge to main world
  // createPlatform(248, 256 + 8, 4, 33, 128);
  fillVoxels(246, 266, 0, 4, 37, 104, 0.8);
  fillVoxels(248, 264, 2, 4, 34, 102, -1);
  for (let z = 40; z <= 60; z += 10) {
    entities.push(new Fireball(fromValuesVec3(256 + 10, 4, z), fromValuesVec3(256, 4, z), 3, 0, true));
  }

  // Steps to Area 1
  createBridge(266, 1, 96, 384, 32, 96);

  // Area 1
  createPlatform(384, 384 + 50, 32, 128 - 50, 128 + 50, 4); // First floor
  createBridge(384 + 20, 32, 128 + 50 - 8, 384 + 80, 48, 128 + 50 - 8);
  createPlatform(384 + 50, 384 + 116, 48, 128 - 50, 128 + 50, 4); // Second floor

  // Area 1.1
  // createBridge(484 - 8 - 16, 32, 128 - 50 + 8, 484 + 8, 40, 128 - 50 + 8);
  createBridge(484 + 8, 48, 128 - 50 + 8 + 15, 484 + 8, 64, 224);

  // Checkpoint #2
  createPlatform(480, 512, 64, 224, 256);
  entities.push(new Checkpoint(496, 65, 240, 1));

  // Path from Area 1 to Area 2
  // createBridge(384, 32, 256, 220, 64, 256);
  createPlatform(200, 480, 64, 240 - 8, 240 + 8);

  // Area 2
  // x = 0 - 220 (220)
  // z = 35 - 256 (220)
  // 220 / 5 = 44
  // x = 0 - 44 - 88 - 132 - 176 - 220
  // z = 35 - 79 - 123 - 167 - 211 - 255
  for (let x = 0; x < 5; x++) {
    for (let z = 0; z < 5; z++) {
      const centerX = 22 + x * 44;
      const centerZ = 35 + 22 + z * 44;
      if (x < 4 && z < 4) {
        // Create connectors
        createPlatform(centerX + 18, centerX + 26, 64, centerZ + 18, centerZ + 26);
      }
      if ((x + z) % 2 === 0 && !(x === 2 && z > 0)) {
        createPlatform(centerX - 22, centerX + 22, 64, centerZ - 22, centerZ + 22);
        if (x === 0 && z === 4) {
          // Checkpoint #3
          entities.push(new Checkpoint(centerX, 65, centerZ, 2));
          // setVec3(player.pos, centerX, 65, centerZ);
        } else if (x % 2 === 1 || z % 2 === 1) {
          // Create a fireball
          for (let radius = 0; radius <= 32; radius += 8) {
            entities.push(
              new Fireball(fromValuesVec3(centerX + radius, 66, centerZ), fromValuesVec3(centerX, 66, centerZ))
            );
          }
        } else {
          // Add a zombie
          createZombie(centerX, 66, centerZ);
        }
      }
    }
  }

  // Bridge to Area 3
  createPlatform(22 - 8, 22 + 8, 64, 256, 320);

  // Area 3
  // x = 0 - 180 (180)
  // z = 320 - 500 (180)
  createPlatform(0, 64, 64, 320, 384);
  entities.push(new Eyeball(32, 66, 352));
  createPlatform(0, 64, 64, 436, 500);
  entities.push(new Eyeball(32, 66, 468));
  createPlatform(116, 180, 64, 320, 384);
  entities.push(new Eyeball(148, 66, 352));
  createPlatform(116, 180, 64, 436, 500);
  entities.push(new Eyeball(148, 66, 468));

  // Moving platforms
  createLift(72, 62, 376, 108, 62, 376, 12);
  createLift(124, 62, 392, 56, 62, 428, 12);
  createLift(72, 62, 492, 108, 62, 492, 12);

  // Bridge to the checkpoint
  createPlatform(180, 240, 64, 488, 504);
  createPlatform(240, 272, 64, 480, 512);
  entities.push(new Checkpoint(256, 65, 496, 3));
  // setVec3(player.pos, 256, 65, 496);

  // Stairs down to final boss area
  createBridge(256, 64, 473, 256, 32, 308);
  // setVec3(player.pos, 280, 36, 308);
  createPlatform(264, 349, 32, 300, 316);

  // Area 4
  // Final boss platform!
  createPlatform(350, 500, 32, 300, 450);
  // const boss = new Boss(425, 34, 375);
  // boss.team = 2;
  // boss.health = 1000;
  // entities.push(boss);

  // Pillars for eyeballs
  createBossPillar(425, 450 - 8, 16);
  // entities.push(new Eyeball(425, 50, 450 - 8));
  createBossPillar(500 - 8, 375, 16);
  // entities.push(new Eyeball(500 - 8, 50, 375));

  // Short pillars for cover
  // createBossPillar(390, 340, 8);
  createBossPillar(460, 340, 8);
  createBossPillar(390, 410, 8);
  createBossPillar(460, 410, 8);
}

function createBossPillar(x: number, z: number, height: number): void {
  fillVoxels(x - 8, x + 8, 32, 32 + height, z - 8, z + 8);
  entities.push(new Eyeball(x, 34 + height, z));
}

function fillVoxels(x1: number, x2: number, y1: number, y2: number, z1: number, z2: number, prob = 0.5): void {
  for (let x = x1; x <= x2; x++) {
    for (let z = z1; z <= z2; z++) {
      for (let y = y1; y <= y2; y++) {
        setVoxel(x, y, z, +(Math.random() < prob));
      }
    }
  }
}

function createPlatform(x1: number, x2: number, y2: number, z1: number, z2: number, zombieCount = 0, prob = 0.5): void {
  fillVoxels(x1, x2, y2 - 2, y2, z1, z2, prob);

  for (let i = 0; i < zombieCount; i++) {
    // const zombie = new Zombie(x1 + Math.random() * (x2 - x1), y2 + 2, z1 + Math.random() * (z2 - z1));
    // zombie.team = 2;
    // entities.push(zombie);
    createZombie(x1 + Math.random() * (x2 - x1), y2 + 2, z1 + Math.random() * (z2 - z1));
  }
}

function createZombie(x: number, y: number, z: number): void {
  const zombie = new Zombie(x, y, z);
  zombie.team = 2;
  entities.push(zombie);
}

function createBridge(x: number, y: number, z: number, endX: number, endY: number, endZ: number): void {
  let i = 0;

  while ((x !== endX || y !== endY || z !== endZ) && i < 1000) {
    if (x < endX) {
      x += 2;
    } else if (x > endX) {
      x -= 2;
    }
    if (y < endY) {
      y++;
    } else if (y > endY) {
      y--;
    }
    if (z < endZ) {
      z += 2;
    } else if (z > endZ) {
      z -= 2;
    }
    createBridgeStep(x, y, z);
    i++;
  }
}

/**
 * Creates a lift.
 * Vertical moving platform.
 * @param {number} x1
 * @param {number} y1
 * @param {number} z1
 * @param {number} x2
 * @param {number} y2
 * @param {number} z2
 * @return {!Platform}
 */
function createLift(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, speed = 24): Platform {
  const platform = new Platform();
  setVec3(platform.pos, x1, y1, z1);
  setVec3(platform.scale, 8, 2, 8);
  platform.waypoints = [fromValuesVec3(x1, y1, z1), fromValuesVec3(x2, y2, z2)];
  platform.speed = speed;
  entities.push(platform);
  return platform;
}

function createBridgeStep(x: number, y: number, z: number): void {
  fillVoxels(x - 8, x + 8, y - 1, y, z - 8, z + 8, 0.8);
}
