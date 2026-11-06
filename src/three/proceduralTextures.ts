import * as THREE from 'three';

export function createPetalTexture(
  primaryHex: string,
  secondaryHex: string,
  accentHex: string,
  anisotropy = 4,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 256, 0, 0);
  grad.addColorStop(0, accentHex);
  grad.addColorStop(0.45, primaryHex);
  grad.addColorStop(1, secondaryHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle organic botanical petal veins
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 1.5;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(128 + i * 6, 256);
    ctx.quadraticCurveTo(128 + i * 16, 130, 128 + i * 22, 12);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(128 + i * 8, 256);
    ctx.quadraticCurveTo(128 + i * 19, 140, 128 + i * 24, 30);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createSunflowerDiscTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
  rad.addColorStop(0, '#23160D');
  rad.addColorStop(0.65, '#3B2414');
  rad.addColorStop(0.88, '#6B4218');
  rad.addColorStop(1, '#D48A1D');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  // Fibonacci phyllotaxis seed florets
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 240; i++) {
    const r = Math.sqrt(i / 240) * 116;
    const theta = i * goldenAngle;
    const x = 128 + Math.cos(theta) * r;
    const y = 128 + Math.sin(theta) * r;
    ctx.fillStyle = i > 185 ? 'rgba(235, 168, 42, 0.72)' : 'rgba(22, 12, 6, 0.78)';
    ctx.beginPath();
    ctx.arc(x, y, 2.2 + (i / 240) * 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

export function createWrapFabricTexture(
  primaryHex: string,
  secondaryHex: string,
  anisotropy = 4,
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const grad = cCtx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, primaryHex);
  grad.addColorStop(0.5, secondaryHex);
  grad.addColorStop(1, primaryHex);
  cCtx.fillStyle = grad;
  cCtx.fillRect(0, 0, size, size);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Linen / botanical weave threads
  for (let y = 0; y < size; y += 4) {
    cCtx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    cCtx.fillRect(0, y, size, 1.5);
    bCtx.fillStyle = y % 8 === 0 ? '#9E9E9E' : '#646464';
    bCtx.fillRect(0, y, size, 1.5);
  }
  for (let x = 0; x < size; x += 4) {
    cCtx.fillStyle = x % 8 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    cCtx.fillRect(x, 0, 1.5, size);
    bCtx.fillStyle = x % 8 === 0 ? '#969696' : '#6C6C6C';
    bCtx.fillRect(x, 0, 1.5, size);
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 2);
  map.anisotropy = anisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 2);
  bumpMap.anisotropy = anisotropy;

  return { map, bumpMap };
}

export function createPedestalStoneTexture(anisotropy = 4): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#EFECE5';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle travertine veins
  for (let i = 0; i < 24; i++) {
    const y = (i / 24) * 256;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(180, 174, 162, 0.22)' : 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + 6, 170, y - 6, 256, y + 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  return texture;
}

export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 122);
  grad.addColorStop(0, 'rgba(18, 28, 22, 0.55)');
  grad.addColorStop(0.55, 'rgba(18, 28, 22, 0.22)');
  grad.addColorStop(1, 'rgba(18, 28, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
