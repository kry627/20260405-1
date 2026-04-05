let gameState = 'WAITING'; // WAITING, PLAYING, GAMEOVER, WIN
const pathColor = 255;    // 路徑顏色 (白色)
const wallColor = 0;      // 牆壁顏色 (黑色)
const startColor = [0, 255, 0]; // 起點顏色 (綠色)
const goalColor = [255, 0, 0];  // 終點顏色 (紅色)
let startTime = 0;        // 遊戲開始時間
let finalTime = 0;        // 最終花費時間
let obstacles = [];       // 動態障礙物
let ox, oy;               // 地圖偏移量
const playerSize = 8;     // 玩家判定點大小 (越小越容易，越大越難)
let health = 3;           // 當前生命值
let isInvincible = false; // 是否處於無敵狀態
let invincibilityTimer = 0; // 無敵時間計時器
let heartItem = null;     // 回血道具
let shakeAmount = 0;      // 震動強度

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  noCursor();
  layoutGame();
}

function draw() {
  push();
  // 處理螢幕震動邏輯
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; // 震動衰減
    if (shakeAmount < 0.1) shakeAmount = 0;
  }

  if (gameState === 'WAITING' || gameState === 'PLAYING') {
    drawLevel();
    checkCollision();
    drawHeartItem();
    drawPlayer();
  } else if (gameState === 'GAMEOVER') {
    drawGameOver();
  } else if (gameState === 'WIN') {
    drawWin();
  }
  pop();
}

function layoutGame() {
  // 將地圖置中
  ox = width / 2 - 325;
  oy = height / 2 - 225;

  // 初始化動態障礙物 {x, y, w, h, speed, rangeMin, rangeMax, horizontal}
  obstacles = [
    { x: 140, y: 100, w: 20, h: 10, speed: 1.2, min: 70, max: 240, horiz: false },  // 垂直段1 (路寬40, 障20, 兩側各留10)
    { x: 140, y: 220, w: 20, h: 10, speed: -1.2, min: 70, max: 240, horiz: false }, // 垂直段2 (反向巡邏)
    { x: 180, y: 380, w: 15, h: 20, speed: 1.8, min: 100, max: 400, horiz: true },  // 底部橫向1 (路高40, 障20)
    { x: 300, y: 380, w: 15, h: 20, speed: -2.0, min: 100, max: 400, horiz: true }, // 底部橫向2 (交錯運動)
    { x: 420, y: 150, w: 20, h: 12, speed: 1.8, min: 120, max: 350, horiz: false }, // 右側上升段
    { x: 350, y: 49, w: 12, h: 12, speed: 2.5, min: 280, max: 540, horiz: true }    // 頂部衝刺區 (路高30, 障12, 空間充足)
  ];
}

function spawnHeartItem() {
  const pathRects = [
    [50, 50, 120, 50], [130, 50, 40, 250], [50, 260, 120, 35],
    [50, 260, 35, 150], [50, 370, 400, 40], [410, 100, 40, 310],
    [250, 100, 200, 35], [250, 40, 35, 100], [250, 40, 350, 30],
    [560, 40, 40, 300], [450, 300, 150, 35], [450, 200, 30, 135],
    [450, 200, 120, 30]
  ];
  let r = random(pathRects);
  // 儲存相對於 ox, oy 的位置，確保縮放視窗後位置依然正確
  heartItem = {
    relX: r[0] + random(10, r[2] - 10),
    relY: r[1] + random(10, r[3] - 10),
    active: true
  };
}

function drawHeartItem() {
  if (gameState === 'PLAYING' && heartItem && heartItem.active) {
    push();
    textSize(20);
    text("❤️", ox + heartItem.relX, oy + heartItem.relY);
    pop();
  }
}

function updateObstacles() {
  for (let obs of obstacles) {
    if (obs.horiz) {
      obs.x += obs.speed;
      if (obs.x < obs.min || obs.x + obs.w > obs.max) obs.speed *= -1;
    } else {
      obs.y += obs.speed;
      if (obs.y < obs.min || obs.y + obs.h > obs.max) obs.speed *= -1;
    }
    fill(wallColor);
    rect(ox + obs.x, oy + obs.y, obs.w, obs.h);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  layoutGame();
}

function drawLevel() {
  background(wallColor);

  // 繪製迷宮路徑
  fill(pathColor);
  noStroke();
  rect(ox + 50, oy + 50, 120, 50);    // 1. 起點
  rect(ox + 130, oy + 50, 40, 250);   // 2. 下行
  rect(ox + 50, oy + 260, 120, 35);   // 3. 左折 (變窄)
  rect(ox + 50, oy + 260, 35, 150);   // 4. 下行 (變窄)
  rect(ox + 50, oy + 370, 400, 40);   // 5. 底部長路
  rect(ox + 410, oy + 100, 40, 310);  // 6. 右側長攀升
  rect(ox + 250, oy + 100, 200, 35);  // 7. 中段橫向
  rect(ox + 250, oy + 40, 35, 100);   // 8. 向上
  rect(ox + 250, oy + 40, 350, 30);   // 9. 頂部窄路大衝刺
  rect(ox + 560, oy + 40, 40, 300);   // 10. 末端下行
  rect(ox + 450, oy + 300, 150, 35);  // 11. 終點前大轉向
  rect(ox + 450, oy + 200, 30, 135);  // 12. 最後爬升
  rect(ox + 450, oy + 200, 120, 30);  // 13. 終點小道

  // 起點 (綠色)
  fill(startColor);
  rect(ox + 50, oy + 50, 40, 50);
  
  // 終點 (紅色)
  fill(goalColor);
  rect(ox + 540, oy + 200, 30, 30);

  // 更新並繪製動態障礙物
  updateObstacles();

  fill(100);
  noStroke();
  textSize(12);
  text("起點", ox + 65, oy + 75);
  text("GOAL", ox + 555, oy + 215);

  // 繪製生命值 (右上角)
  drawHealth();

  // 當生命值只剩一顆心時，增加紅色邊框閃爍提醒
  if (gameState === 'PLAYING' && health === 1) {
    push();
    noFill();
    strokeWeight(20);
    // 使用 sin 函數讓透明度隨時間變化產生閃爍感 (呼吸燈效果)
    let alpha = map(sin(frameCount * 0.15), -1, 1, 40, 180);
    stroke(255, 0, 0, alpha);
    rect(0, 0, width, height);
    pop();
  }

  // 狀態顯示
  if (gameState === 'WAITING') {
    fill(255, 255, 0);
    textSize(20);
    text("請將游標移至「起點」以開始遊戲", width / 2, 40);
  } else if (gameState === 'PLAYING') {
    fill(255);
    textSize(24);
    let currentTime = ((millis() - startTime) / 1000).toFixed(2);
    text("計時: " + currentTime + "s", width / 2, 40);
  }
}

function drawHealth() {
  textSize(24);
  let heartStr = "";
  for (let i = 0; i < 3; i++) {
    heartStr += (i < health) ? "❤️" : "🖤";
  }
  textAlign(RIGHT, TOP);
  text(heartStr, width - 20, 20);
  textAlign(CENTER, CENTER); // 恢復原本的對齊設定
}

function drawPlayer() {
  // 無敵狀態下的閃爍效果
  if (isInvincible && frameCount % 10 < 5) return;

  fill(255, 255, 0); // 鮮黃色判定點
  noStroke();
  ellipse(mouseX, mouseY, playerSize, playerSize);
  // 外圈裝飾
  noFill();
  stroke(255, 150);
  ellipse(mouseX, mouseY, playerSize + 4, playerSize + 4);
}

function checkCollision() {
  // 處理無敵時間結束
  if (isInvincible && millis() - invincibilityTimer > 1000) {
    isInvincible = false;
  }

  let pixelColor = get(mouseX, mouseY);
  let r = pixelColor[0];
  let g = pixelColor[1];
  let b = pixelColor[2];

  // 檢查是否觸發開始 (碰到綠色且是等待狀態)
  if (gameState === 'WAITING' && r === 0 && g === 255 && b === 0) {
    gameState = 'PLAYING';
    health = 3;
    isInvincible = false;
    shakeAmount = 0;
    startTime = millis();
    spawnHeartItem();
  }

  // 碰到黑色 (牆壁或障礙物)
  if (gameState === 'PLAYING' && r === 0 && g === 0 && b === 0 && !isInvincible) {
    health--;
    shakeAmount = 15; // 觸發劇烈震動
    playTone(150, 'square', 0.2); // 碰到牆壁的嗡鳴聲 (150Hz, 方波)
    if (health <= 0) {
      gameState = 'GAMEOVER';
    } else {
      isInvincible = true;
      invincibilityTimer = millis();
    }
  }
  
  // 檢查是否吃到回血道具
  if (gameState === 'PLAYING' && heartItem && heartItem.active) {
    let d = dist(mouseX, mouseY, ox + heartItem.relX, oy + heartItem.relY);
    if (d < 15) { // 判定範圍
      if (health < 3) health++;
      playTone(880, 'sine', 0.3); // 吃到愛心的叮一聲 (880Hz, 正弦波)
      heartItem.active = false;
    }
  }
  
  // 碰到紅色 (終點)
  if (gameState === 'PLAYING' && r === 255 && g === 0 && b === 0) {
    finalTime = ((millis() - startTime) / 1000).toFixed(2);
    gameState = 'WIN';
  }
}

function drawGameOver() {
  noCursor();
  background(100, 0, 0);
  fill(255);
  textSize(48);
  text("GAME OVER", width / 2, height / 2);
  textSize(16);
  text("點擊滑鼠重試", width / 2, height / 2 + 50);
}

function drawWin() {
  noCursor();
  background(0, 100, 0);
  fill(255);
  textSize(48);
  text("YOU WIN!", width / 2, height / 2);
  textSize(32);
  text("花費時間: " + finalTime + " 秒", width / 2, height / 2 + 40);
  textSize(16);
  text("點擊滑鼠重新開始", width / 2, height / 2 + 100);
}

function mousePressed() {
  if (gameState === 'GAMEOVER' || gameState === 'WIN') {
    gameState = 'WAITING';
  }
}

// 簡易音效產生器 (使用 Web Audio API，無需外部音檔)
let audioCtx;
function playTone(freq, type, duration) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume(); // 確保瀏覽器允許播放聲音
  
  let osc = audioCtx.createOscillator();
  let gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}