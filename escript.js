const FPS = 30;
const FRICTION = 0.7; // friction coefficient (0 = no friction)

const ROID_JAG = 0.4; // jaggedness of the asteroids (0 = none)
const ROIDS_NUM = 5; // starting number of asteroids
const ROIDS_SIZE = 60; // starting size of asteroids in pixels
const ROIDS_VERT = 10; // average number of vertices on each asteroid
const ROIDS_SPD = 50; // max starting speed of asteroids in pixels per second
const ROID_PTS_LGE = 20; // large asteroid score
const ROID_PTS_MED = 50; // medium asteroid score
const ROID_PTS_SML = 100; // small asteroid score
const LASER_MAX = 10; // max num of lasers on screen at once
const LASER_SPD = 500; // speed of lasers in pixels per second
const LASER_DIST = 0.4; // max distance laser as a fraction of screen with
const SHIP_SIZE = 20;
const SHIP_THRUST = 5; // ship acceleration in pixels per second
const SHIP_EXPLODE_DUR = 0.4; // duration of the ship explosion
const SHIP_INV_DUR = 3; // invisibility duration in seconds
const SHIP_BLINK_DUR = 0.1; // duration of the ship's blink during invisibility in seconds
const TURN_SPEED = 360; // rotation speed in degrees per second
const SHOW_BOUNDING = true; // show or hide collision bounding
const TEXT_FADE_TIME = 5; // text fade time in seconds
const TEXT_SIZE = 30; // text font height in pixels
const GAME_LIVES = 3; // number of lives
const SAVE_KEY_SCORE = "highscore"; // save key for local storage

/** @type {HTMLCanvasElement} */
var canv = document.getElementById("asteroidsCanvas");
var ctx = canv.getContext("2d");

//set up the game parameters
var level, lives, roids, score, scoreHigh, ship, text, textAlpha;
newGame();

// set up event handlers
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// set up the game loop
setInterval(update, 1000 / FPS);

function createAsteroidsBelt() {
  roids = [];
  var x, y;
  for (var i = 0; i < ROIDS_NUM + level; i++) {
    do {
      x = Math.floor(Math.random() * canv.width);
      y = Math.floor(Math.random() * canv.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < ROIDS_SIZE * 2 + ship.r);
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 2)));
  }
}
function destroyAsteroid(index) {
  var x = roids[index].x;
  var y = roids[index].y;
  var r = roids[index].r;
  //split the asteroid
  if (r == Math.ceil(ROIDS_SIZE / 2)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 4)));
    score += ROID_PTS_LGE;
  } else if (r == Math.ceil(ROIDS_SIZE / 4)) {
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    roids.push(newAsteroid(x, y, Math.ceil(ROIDS_SIZE / 8)));
    score += ROID_PTS_MED;
  } else {
    score += ROID_PTS_SML;
  }
  // check high score
  if (score > scoreHigh) {
    scoreHigh = score;
    localStorage.setItem(SAVE_KEY_SCORE, scoreHigh);
  }

  // destroy the asteroid
  roids.splice(index, 1);

  //new level when no more asteroids
  if (roids.length == 0) {
    level++;
    newLevel();
  }
}

function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function drawShip(x, y, a) {
  ctx.strokeStyle = "white";
  ctx.lineWidth = SHIP_SIZE / 40;
  ctx.beginPath();
  ctx.moveTo(
    // nose of the ship
    x + (4 / 3) * ship.r * Math.cos(a),
    y - (4 / 3) * ship.r * Math.sin(a)
  );
  ctx.lineTo(
    // rear left
    x - ship.r * ((2 / 3) * Math.cos(a) + Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) - Math.cos(a))
  );
  ctx.lineTo(
    // rear right
    x - ship.r * ((2 / 3) * Math.cos(a) - Math.sin(a)),
    y + ship.r * ((2 / 3) * Math.sin(a) + Math.cos(a))
  );
  ctx.closePath();
  ctx.stroke();
}

function explodeShip() {
  ship.explodeTime = Math.ceil(SHIP_EXPLODE_DUR * FPS);
}

function gameOver() {
  ship.dead = true;
  text = "Game Over";
  textAlpha = 1.0;
}

function keyDown(/** @type {keyboardEvent}*/ ev) {
  if (ship.dead) {
    return;
  }
  switch (ev.keyCode) {
    case 32: //space bar(shoot)
      shootLaser();
      break;
    case 37: //left arrow (rotate ship left)
      ship.rot = ((TURN_SPEED / 180) * Math.PI) / FPS;
      break;
    case 38: //up arrow (accelerate the ship)
      ship.thrusting = true;
      break;
    case 39: //right arrow (rotate ship right)
      ship.rot = ((-TURN_SPEED / 180) * Math.PI) / FPS;
      break;
  }
}

function keyUp(/** @type {keyboardEvent}*/ ev) {
  if (ship.dead) {
    return;
  }
  switch (ev.keyCode) {
    case 32: //space bar(allow shooting again)
      ship.canShoot = true;
      break;
    case 37: //left arrow (stop rotating left)
      ship.rot = 0;
      break;
    case 38: //up arrow (stop the ship)
      ship.thrusting = false;
      break;
    case 39: //right arrow (stop rotating right)
      ship.rot = 0;
      break;
  }
}

function newAsteroid(x, y, r) {
  var lvlMult = 1 + 0.1 * level;
  var roid = {
    x: x,
    y: y,
    xv:
      ((Math.random() * ROIDS_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    yv:
      ((Math.random() * ROIDS_SPD * lvlMult) / FPS) *
      (Math.random() < 0.5 ? 1 : -1),
    r: r,
    a: Math.random() * Math.PI * 2, // in radians
    vert: Math.floor(Math.random() * (ROIDS_VERT + 1) + ROIDS_VERT / 2),
    offs: [],
  };
  // create the vertex offsets array
  for (var i = 0; i < roid.vert; i++) {
    roid.offs.push(Math.random() * ROID_JAG * 2 + 1 - ROID_JAG);
  }
  return roid;
}

function newGame() {
  level = 0;
  lives = GAME_LIVES;
  score = 0;
  ship = newShip();
  // get the high score from local storage
  var scoreStr = localStorage.getItem(SAVE_KEY_SCORE);
  if (scoreStr == null) {
    scoreHigh = 0;
  } else {
    scoreHigh = parseInt(scoreStr);
  }
  newLevel();
}

function newLevel() {
  text = "Level" + (level + 1);
  textAlpha = 1.0;
  createAsteroidsBelt();
}

function newShip() {
  return {
    x: canv.width / 2,
    y: canv.height / 2,
    r: SHIP_SIZE / 2,
    a: (90 / 180) * Math.PI, // face up converted to radians
    blinkTime: Math.ceil(SHIP_BLINK_DUR * FPS),
    blinkNum: Math.ceil(SHIP_INV_DUR / SHIP_BLINK_DUR),
    canShoot: true,
    dead: false,
    explodeTime: 0,
    lasers: [],
    rot: 0,
    thrusting: false,
    thrust: {
      x: 0,
      y: 0,
    },
  };
}

function shootLaser() {
  // create the laser object
  if (ship.canShoot && ship.lasers.length < LASER_MAX) {
    ship.lasers.push({
      // from the nose of the ship
      x: ship.x + (4 / 3) * ship.r * Math.cos(ship.a),
      y: ship.y - (4 / 3) * ship.r * Math.sin(ship.a),
      xv: (LASER_SPD * Math.cos(ship.a)) / FPS,
      yv: (-LASER_SPD * Math.sin(ship.a)) / FPS,
      dist: 0,
      explodeTime: 0,
    });
  }
  //prevent further shooting
  ship.canShoot = false;
}

function update() {
  var exploding = ship.explodeTime > 0;
  var blinkOn = ship.blinkNum % 2 == 0;
  // draw space
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canv.width, canv.height);
  // thrust the ship
  if (ship.thrusting && !ship.dead) {
    ship.thrust.x += (SHIP_THRUST * Math.cos(ship.a)) / FPS;
    ship.thrust.y -= (SHIP_THRUST * Math.sin(ship.a)) / FPS;
    // draw the thruster
    if (!exploding && blinkOn) {
      ctx.strokeStyle = "grey";
      ctx.fillStyle = "white";
      ctx.lineWidth = SHIP_SIZE / 10;
      ctx.beginPath();
      ctx.moveTo(
        // rear left
        ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) + 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) - 0.5 * Math.cos(ship.a))
      );
      ctx.lineTo(
        // rear centre behind the ship
        ship.x - ship.r * (5 / 3) * Math.cos(ship.a),
        ship.y + ship.r * (5 / 3) * Math.sin(ship.a)
      );
      ctx.lineTo(
        // rear right
        ship.x - ship.r * ((2 / 3) * Math.cos(ship.a) - 0.5 * Math.sin(ship.a)),
        ship.y + ship.r * ((2 / 3) * Math.sin(ship.a) + 0.5 * Math.cos(ship.a))
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ship.thrust.x -= (FRICTION * ship.thrust.x) / FPS;
    ship.thrust.y -= (FRICTION * ship.thrust.y) / FPS;
  }

  // draw the ship
  if (!exploding) {
    if (blinkOn && !ship.dead) {
      drawShip(ship.x, ship.y, ship.a);
    }
    // handle blinking
    if (ship.blinkNum > 0) {
      // reduce the blink time
      ship.blinkTime--;
      // reduce the blink num
      if (ship.blinkTime == 0) {
        ship.blinkTime = Math.ceil(SHIP_BLINK_DUR * FPS);
        ship.blinkNum--;
      }
    }
  } else {
    // draw the explosion

    ctx.fillStyle = "grey";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 1, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r * 0.7, 0, Math.PI * 2, false);
    ctx.fill();
  }

  // draw the asteroids

  var x, y, r, a, vert, offs;
  for (var i = 0; i < roids.length; i++) {
    ctx.strokeStyle = "white";
    ctx.lineWidth = SHIP_SIZE / 40;
    x = roids[i].x;
    y = roids[i].y;
    r = roids[i].r;
    a = roids[i].a;
    vert = roids[i].vert;
    offs = roids[i].offs;

    //draw apath
    ctx.beginPath();
    ctx.moveTo(x + r * offs[0] * Math.cos(a), y + r * offs[0] * Math.sin(a));
    //draw the polygon
    for (var j = 1; j - vert; j++) {
      ctx.lineTo(
        x + r * offs[j] * Math.cos(a + (j * Math.PI * 2) / vert),
        y + r * offs[j] * Math.sin(a + (j * Math.PI * 2) / vert)
      );
    }
    ctx.closePath();
    ctx.stroke();
  }

  // check asteroids collision
  if (!exploding) {
    if (ship.blinkNum == 0 && !ship.dead) {
      for (var i = 0; i < roids.length; i++) {
        if (
          distBetweenPoints(ship.x, ship.y, roids[i].x, roids[i].y) <
          ship.r + roids[i].r
        ) {
          explodeShip();
          destroyAsteroid(i);
          break;
        }
      }
    }

    // rotate ship
    ship.a += ship.rot;
    // move the ship
    ship.x += ship.thrust.x;
    ship.y += ship.thrust.y;
  } else {
    ship.explodeTime--;
    // reset the ship after explosion
    if (ship.explodeTime == 0) {
      lives--;
      if (lives == 0) {
        gameOver();
      } else {
        ship = newShip();
      }
    }
  }

  // move the laser
  for (var i = ship.lasers.length - 1; i >= 0; i--) {
    // check the distance travelled
    if (ship.lasers[i].dist > LASER_DIST * canv.width) {
      ship.lasers.splice(i, 1);
      continue;
    }
    // move the laser
    ship.lasers[i].x += ship.lasers[i].xv;
    ship.lasers[i].y += ship.lasers[i].yv;
    // calculate the distance travelled
    ship.lasers[i].dist += Math.sqrt(
      Math.pow(ship.lasers[i].xv, 2) + Math.pow(ship.lasers[i].yv, 2)
    );
    // handle endge of screen
    if (ship.lasers[i].x < 0) {
      ship.lasers[i].x = canv.width;
    } else if (ship.lasers[i].x > canv.width) {
      ship.lasers[i].x = 0;
    }
    if (ship.lasers[i].y < 0) {
      ship.lasers[i].y = canv.height;
    } else if (ship.lasers[i].y > canv.height) {
      ship.lasers[i].y = 0;
    }
  }

  // handle edge of screen
  if (ship.x < 0 - ship.r) {
    ship.x = canv.width + ship.r;
  } else if (ship.x > canv.width + ship.r) {
    ship.x = 0 - ship.r;
  }
  if (ship.y < 0 - ship.r) {
    ship.y = canv.height + ship.r;
  } else if (ship.y > canv.height + ship.r) {
    ship.y = 0 - ship.r;
  }
  //move the asteroid
  for (var i = 0; i < roids.length; i++) {
    roids[i].x += roids[i].xv;
    roids[i].y += roids[i].yv;
    //handle asteroid edge of screen
    if (roids[i].x < 0 - roids[i].r) {
      roids[i].x = canv.width + roids[i].r;
    } else if (roids[i].x > canv.width + roids[i].r) {
      roids[i].x = 0 - roids[i].r;
    }
    if (roids[i].y < 0 - roids[i].r) {
      roids[i].y = canv.height + roids[i].r;
    } else if (roids[i].y > canv.height + roids[i].r) {
      roids[i].y = 0 - roids[i].r;
    }
  }
  // draw the lasers
  for (var i = 0; i < ship.lasers.length; i++) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(
      ship.lasers[i].x,
      ship.lasers[i].y,
      SHIP_SIZE / 35,
      0,
      Math.PI * 2,
      false
    );
    ctx.fill();
  }

  // detect laser collisins with asteroiuds
  var ax, ay, ar, lx, ly;
  for (var i = roids.length - 1; i >= 0; i--) {
    ax = roids[i].x;
    ay = roids[i].y;
    ar = roids[i].r;
    //loop over the lasers
    for (var j = ship.lasers.length - 1; j >= 0; j--) {
      lx = ship.lasers[j].x;
      ly = ship.lasers[j].y;
      // detect collision
      if (distBetweenPoints(ax, ay, lx, ly) < ar) {
        // remove laser
        ship.lasers.splice(j, 1);
        // remove the asteroid
        destroyAsteroid(i);

        break;
      }
    }
  }
  // draw the game text
  if (textAlpha >= 0) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255, 255, 255, " + textAlpha + ")";
    ctx.font = "small-caps " + TEXT_SIZE + "px arial";
    ctx.fillText(text, canv.width / 2, canv.height * 0.75);
    textAlpha -= 1.0 / TEXT_FADE_TIME / FPS;
  } else if (ship.dead) {
    newGame();
  }

  // DRAW THE LIVES
  for (var i = 0; i < lives; i++) {
    drawShip(
      SHIP_SIZE * 1.2 + i * SHIP_SIZE * 1.1,
      SHIP_SIZE * 1.5,
      0.5 * Math.PI
    ); //90º in radians
  }
  // draw the score
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "13px Helvetica";
  ctx.fillText("Score " + score, canv.width - SHIP_SIZE * 1.1, SHIP_SIZE * 1.3);

  // draw the high score
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.font = "12px Helvetica";
  ctx.fillText("High Score " + scoreHigh, canv.width / 2, SHIP_SIZE * 1.3);
}
