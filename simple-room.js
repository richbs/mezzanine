// Simple Three.js room with three textured walls, no React

// Set up renderer
const width = window.innerWidth;
const height = width * (9 / 16); // Maintain 3:2 aspect ratio
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Set up scene and camera
const scene = new THREE.Scene();

// Create canvas for gradient
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
const ctx = canvas.getContext("2d");

// Create gradient
const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
gradient.addColorStop(0, "#004225");
gradient.addColorStop(1, "#000000");

ctx.fillStyle = gradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Apply to scene
const texture = new THREE.CanvasTexture(canvas);
scene.background = texture;

const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.set(0, 1, 5);

// Room group
const roomGroup = new THREE.Group();
scene.add(roomGroup);

// --- Room construction with 3 internal walls using the 3 images ---
const wallImagePaths = [
  "/images/wall-center.png", // back
  "/images/wall-left.png", // left
  "/images/wall-right.png", // right
];
const balustradeImagePaths = [
  "/images/balustrade-centre.png", // back
  "/images/balustrade-left.png", // left
  "/images/balustrade-right.png", // right
];
const loader = new THREE.TextureLoader();

// Load all images to get their natural sizes
const loadImages = (paths) => {
  return Promise.all(
    paths.map((path) => {
      return new Promise((resolve) => {
        const img = new window.Image();
        img.src = path;
        img.onload = function () {
          resolve({
            path,
            width: img.width,
            height: img.height,
          });
        };
      });
    }),
  );
};

Promise.all([
  loadImages(wallImagePaths),
  loadImages(balustradeImagePaths),
]).then(([wallImages, balustradeImages]) => {
  const images = wallImages;
  // Calculate world dimensions for each wall using their natural aspect ratios
  const maxHeight = Math.max(...images.map((img) => img.height));
  // Use natural height proportions - scale all to match the tallest wall's height in world units
  const worldWallHeight = 3;
  const wallData = images.map((img) => ({
    worldWidth: worldWallHeight * (img.width / img.height),
    worldHeight: worldWallHeight * (img.height / maxHeight),
  }));
  // Calculate positioning - align all walls at the same top height (ceiling)
  const ceilingHeight = worldWallHeight;
  const backWidth = wallData[0].worldWidth;
  const backHeight = wallData[0].worldHeight;
  const leftWidth = wallData[1].worldWidth;
  const leftHeight = wallData[1].worldHeight;
  const rightWidth = wallData[2].worldWidth;
  const rightHeight = wallData[2].worldHeight;

  // Back wall
  loader.load(images[0].path, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(backWidth, backHeight),
      mat,
    );
    // Position so top edge aligns at ceiling height
    mesh.position.set(0, ceilingHeight - backHeight / 2, -backWidth / 2);
    mesh.name = "wall-center";
    mesh.receiveShadow = true;
    roomGroup.add(mesh);
  });
  // Left wall (rotated +90deg, positioned to connect with back wall)
  loader.load(images[1].path, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(leftWidth, leftHeight),
      mat,
    );
    // Position so the back edge of left wall meets the left edge of back wall
    // After rotation, leftWidth becomes the depth (z-direction)
    mesh.position.set(
      -backWidth / 2,
      ceilingHeight - leftHeight / 2,
      -backWidth / 2 + leftWidth / 2,
    );
    mesh.rotation.y = Math.PI / 2;
    mesh.name = "wall-left";
    mesh.receiveShadow = true;
    roomGroup.add(mesh);
  });
  // Right wall (rotated -90deg, positioned to connect with back wall)
  loader.load(images[2].path, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(rightWidth, rightHeight),
      mat,
    );
    // Position so the back edge of right wall meets the right edge of back wall
    // After rotation, rightWidth becomes the depth (z-direction)
    mesh.position.set(
      backWidth / 2,
      ceilingHeight - rightHeight / 2,
      -backWidth / 2 + rightWidth / 2,
    );
    mesh.rotation.y = -Math.PI / 2;
    mesh.name = "wall-right";
    mesh.receiveShadow = true;
    roomGroup.add(mesh);
  });

  // Add balustrades with parallax effect (slightly closer to camera)
  const parallaxOffset = 0.2; // Distance in front of walls

  // Calculate balustrade dimensions using their natural aspect ratios
  const balustradeData = balustradeImages.map((img) => ({
    worldWidth: worldWallHeight * (img.width / img.height),
    worldHeight:
      worldWallHeight *
      (img.height / Math.max(...balustradeImages.map((b) => b.height))),
  }));

  // Back balustrade
  loader.load(balustradeImages[0].path, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        balustradeData[0].worldWidth,
        balustradeData[0].worldHeight,
      ),
      mat,
    );
    mesh.position.set(
      0,
      balustradeData[0].worldHeight / 2,
      -backWidth / 2 + parallaxOffset,
    );
    mesh.name = "balustrade-center";
    mesh.castShadow = true;
    roomGroup.add(mesh);
  });

  // Left balustrade
  loader.load(balustradeImages[1].path, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        balustradeData[1].worldWidth,
        balustradeData[1].worldHeight,
      ),
      mat,
    );
    // Move inward (toward center) by parallax offset for left wall
    mesh.position.set(
      -backWidth / 2 + parallaxOffset,
      balustradeData[1].worldHeight / 2,
      -backWidth / 2 + balustradeData[1].worldWidth / 2 - 0.15,
    );
    mesh.rotation.y = Math.PI / 2;
    mesh.name = "balustrade-left";
    mesh.castShadow = true;
    roomGroup.add(mesh);
  });

  // Right balustrade
  loader.load(balustradeImages[2].path, (texture) => {
    texture.encoding = THREE.sRGBEncoding;
    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(
        balustradeData[2].worldWidth,
        balustradeData[2].worldHeight,
      ),
      mat,
    );
    // Move inward (toward center) by parallax offset for right wall
    mesh.position.set(
      backWidth / 2 - parallaxOffset,
      balustradeData[2].worldHeight / 2 - 0.4,
      -backWidth / 2 + balustradeData[2].worldWidth / 2,
    );
    mesh.rotation.y = -Math.PI / 2;
    mesh.name = "balustrade-right";
    mesh.castShadow = true;
    roomGroup.add(mesh);
  });
});

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 5, 100);
pointLight.position.set(0, 1, 0);
pointLight.castShadow = true;
pointLight.shadow.mapSize.width = 2048;
pointLight.shadow.mapSize.height = 2048;
pointLight.shadow.camera.near = 0.5;
pointLight.shadow.camera.far = 50;
scene.add(pointLight);

// Raycaster for click detection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Animation variables
let isAnimating = false;
let animationStartTime = 0;
let animationDuration = 1000; // 1 second
let startCameraPosition = new THREE.Vector3();
let startCameraRotation = new THREE.Euler();
let startRoomRotation = new THREE.Euler();
let targetCameraPosition = new THREE.Vector3();
let targetCameraRotation = new THREE.Euler();
let targetRoomRotation = new THREE.Euler();

// Drag controls for rotating the room
let isDragging = false;
let previousX = 0;
let previousY = 0;

function onPointerDown(e) {
  if (isAnimating) return; // Don't allow interaction during animation

  // Check for wall clicks first
  mouse.x = (e.clientX / width) * 2 - 1;
  mouse.y = -(e.clientY / height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(
    roomGroup.children.filter(
      (child) => child.name && child.name.startsWith("wall-"),
    ),
  );

  if (intersects.length > 0) {
    const clickedWall = intersects[0].object;
    animateToWallView(clickedWall);
    return;
  }

  // If no wall clicked, start dragging
  isDragging = true;
  previousX = e.clientX;
  previousY = e.clientY;
}
function onPointerUp() {
  isDragging = false;
}
function onPointerMove(e) {
  if (!isDragging || isAnimating) return;
  const deltaX = e.clientX - previousX;
  const deltaY = e.clientY - previousY;
  previousX = e.clientX;
  previousY = e.clientY;
  roomGroup.rotation.y += deltaX * 0.01;
  roomGroup.rotation.x += deltaY * 0.01;
  roomGroup.rotation.x = Math.max(
    -Math.PI / 4,
    Math.min(Math.PI / 4, roomGroup.rotation.x),
  );
}

renderer.domElement.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointermove", onPointerMove);

// Mouse wheel zoom
// Wall animation function
function animateToWallView(wall) {
  if (isAnimating) return;

  isAnimating = true;
  animationStartTime = Date.now();

  // Store current positions
  startCameraPosition.copy(camera.position);
  startCameraRotation.copy(camera.rotation);
  startRoomRotation.copy(roomGroup.rotation);

  // Calculate target positions based on wall
  const wallCenter = new THREE.Vector3();
  wall.getWorldPosition(wallCenter);

  // Reset room rotation for frontal view
  targetRoomRotation.set(0, 0, 0);

  // Calculate camera distance to fit entire wall in viewport
  const wallGeometry = wall.geometry;
  const wallWidth = wallGeometry.parameters.width;
  const wallHeight = wallGeometry.parameters.height;

  // Calculate distance needed to fit wall in viewport
  const fov = (camera.fov * Math.PI) / 180; // Convert to radians
  const aspect = camera.aspect;

  // Distance needed to fit width and height
  const distanceWidth = wallWidth / 2 / Math.tan((fov * aspect) / 2);
  const distanceHeight = wallHeight / 2 / Math.tan(fov / 2);
  let distance = Math.max(distanceWidth, distanceHeight) * -0.1; // Add 10% padding

  // Extra distance for side walls since they tend to appear closer
  // if (wall.name === "wall-left" || wall.name === "wall-right") {
  //   console.log("Adjusting distance for side wall", distance, (distance *= -1));
  //   distance *= -0.2; // Move back a bit more
  // }

  // Set camera target based on wall name
  switch (wall.name) {
    case "wall-center": // Back wall
      targetCameraPosition.set(0, wallHeight / 2, distance);
      targetCameraRotation.set(0, 0, 0);
      break;
    case "wall-left": // Left wall
      targetCameraPosition.set(-distance, wallHeight / 2, 0);
      targetCameraRotation.set(0, Math.PI / 2, 0);
      break;
    case "wall-right": // Right wall
      targetCameraPosition.set(distance, wallHeight / 2, 0);
      targetCameraRotation.set(0, -Math.PI / 2, 0);
      break;
  }
}

// Smooth interpolation function
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

renderer.domElement.addEventListener(
  "wheel",
  function (e) {
    e.preventDefault();
    if (isAnimating) return; // Don't allow zoom during animation
    // Zoom in/out by changing camera.position.z
    const zoomSpeed = 0.2;
    camera.position.z += e.deltaY * zoomSpeed * 0.01;
    // Clamp zoom
    camera.position.z = Math.max(1.5, Math.min(20, camera.position.z));
  },
  { passive: false },
);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Handle wall view animation
  if (isAnimating) {
    const elapsed = Date.now() - animationStartTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    const easeProgress = easeInOutCubic(progress);

    // Interpolate camera position
    camera.position.x = lerp(
      startCameraPosition.x,
      targetCameraPosition.x,
      easeProgress,
    );
    camera.position.y = lerp(
      startCameraPosition.y,
      targetCameraPosition.y,
      easeProgress,
    );
    camera.position.z = lerp(
      startCameraPosition.z,
      targetCameraPosition.z,
      easeProgress,
    );

    // Interpolate camera rotation
    camera.rotation.x = lerp(
      startCameraRotation.x,
      targetCameraRotation.x,
      easeProgress,
    );
    camera.rotation.y = lerp(
      startCameraRotation.y,
      targetCameraRotation.y,
      easeProgress,
    );
    camera.rotation.z = lerp(
      startCameraRotation.z,
      targetCameraRotation.z,
      easeProgress,
    );

    // Interpolate room rotation
    roomGroup.rotation.x = lerp(
      startRoomRotation.x,
      targetRoomRotation.x,
      easeProgress,
    );
    roomGroup.rotation.y = lerp(
      startRoomRotation.y,
      targetRoomRotation.y,
      easeProgress,
    );
    roomGroup.rotation.z = lerp(
      startRoomRotation.z,
      targetRoomRotation.z,
      easeProgress,
    );

    if (progress >= 1) {
      isAnimating = false;
    }
  }

  renderer.render(scene, camera);
}
animate();
