
// Winterfell-inspired 3D Background
// Implements 6-stage morphing timeline: City -> Sphere -> Pillar -> Ring -> Orbs -> Portal

const SCENE_CONFIG = {
  count: 1500, // Number of blocks/particles
  color: 0xf43f5e, // Tomato Red
  colorAccent: 0xfca5a5, // Pink accent
  stemColor: 0x22c55e, // Green
  fogColor: 0x1a0505, // Dark Red/Black
  scrollSpeed: 0.001
};

let scene, camera, renderer, composer;
let instancedMesh, particlesMesh;
let dummy = new THREE.Object3D();
let scrollProgress = 0;
let targetScroll = 0;

// Morph Targets (Positions for each state)
const targets = {
  city: [],
  sphere: [],
  pillar: [],
  ring: [],
  orbs: [],
  void: []
};

function init() {
  const container = document.getElementById('canvas-container');

  // Scene Setup
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(SCENE_CONFIG.fogColor, 0.02);
  scene.background = new THREE.Color(SCENE_CONFIG.fogColor);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 2; // START ZOOMED IN (Inside the swarm)
  camera.position.y = 0;
  camera.position.x = 0;

  // Intro Animation: Fly out to position
  const targetZ = 20;
  const targetY = 5;
  const targetX = -10;

  window.isIntroActive = true;

  // Simple custom tween for startup
  let introProgress = 0;
  const animateIntro = () => {
    if (introProgress < 1) {
      introProgress += 0.01; // Slower, more cinematic
      const ease = 1 - Math.pow(1 - introProgress, 4); // Ease Out Quart

      camera.position.z = 2 + (targetZ - 2) * ease;
      camera.position.y = 0 + (targetY - 0) * ease;
      camera.position.x = 0 + (targetX - 0) * ease;

      requestAnimationFrame(animateIntro);
    } else {
      window.isIntroActive = false; // Release control to main loop
    }
  };
  setTimeout(animateIntro, 200); // Start sooner

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  container.classList.add('loaded'); // Fade in

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(10, 20, 10);
  scene.add(dirLight);

  // Generate Geometry
  const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White to allow instance colors to pop
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
    opacity: 0.8
  });

  instancedMesh = new THREE.InstancedMesh(geometry, material, SCENE_CONFIG.count);
  scene.add(instancedMesh);

  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 1000;
  const posArray = new Float32Array(particlesCount * 3);

  for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 50; // Spread across 50 units
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true
  });

  particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particlesMesh);

  // Calculate Target Positions
  generateTargets();

  // Event Listeners
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll);
  document.addEventListener('mousemove', onMouseMove);

  // Post-Processing (Bloom)
  const renderScene = new THREE.RenderPass(scene, camera);

  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, // Strength (High for neon glow)
    0.4, // Radius
    0.85 // Threshold
  );

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  // Start Loop
  animate();
}

function generateTargets() {
  const count = SCENE_CONFIG.count;

  // 1. City (Random Cuboids on a plane)
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 60;
    const z = (Math.random() - 0.5) * 60;
    const y = Math.random() * 10 - 10; // Below camera

    // Assign color based on Tomato distribution (92% Red, 8% Green)
    const color = (i < count * 0.92) ? SCENE_CONFIG.color : SCENE_CONFIG.stemColor;

    // Store as [x, y, z, scaleY]
    targets.city.push({
      x, y, z,
      sx: 1, sy: Math.random() * 10 + 2, sz: 1,
      color: color
    });
  }

  // 2. Tomato (Flattened Sphere + Stem)
  for (let i = 0; i < count; i++) {
    // 92% of points for the red body
    if (i < count * 0.92) {
      const phi = Math.acos(-1 + (2 * i) / (count * 0.92));
      const theta = Math.sqrt((count * 0.92) * Math.PI) * phi;

      // Shape Modulation (Lobes)
      const perturbation = 1 + 0.05 * Math.sin(theta * 5);
      const r = 10 * perturbation;

      let y = (r * Math.cos(phi)) * 0.7; // Flattened

      // Indent top
      if (y > 4) y -= (y - 4) * 0.5;

      targets.sphere.push({
        x: r * Math.cos(theta) * Math.sin(phi),
        y: y,
        z: r * Math.sin(theta) * Math.sin(phi),
        sx: 0.5, sy: 0.5, sz: 0.5,
        color: SCENE_CONFIG.color
      });
    } else {
      // 8% for the Green Stem
      const r = Math.random() * 2;
      const h = Math.random() * 3 + 5; // On top
      const theta = Math.random() * Math.PI * 2;

      targets.sphere.push({
        x: r * Math.cos(theta),
        y: h,
        z: r * Math.sin(theta),
        sx: 0.2, sy: 0.8, sz: 0.2,
        color: SCENE_CONFIG.stemColor
      });
    }
  }

  // 3. Pillar (Vertical Stack)
  for (let i = 0; i < count; i++) {
    const r = 3;
    const theta = Math.random() * Math.PI * 2;
    const y = (i / count) * 40 - 20;

    const color = (i < count * 0.92) ? SCENE_CONFIG.color : SCENE_CONFIG.stemColor;

    targets.pillar.push({
      x: r * Math.cos(theta),
      y: y,
      z: r * Math.sin(theta),
      sx: 2, sy: 0.1, sz: 2,
      color: color
    });
  }

  // 4. Ring/Torus (Donut shape)
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const R = 12; // Major radius
    const r = 3;  // Minor radius

    const color = (i < count * 0.92) ? SCENE_CONFIG.color : SCENE_CONFIG.stemColor;

    targets.ring.push({
      x: (R + r * Math.cos(v)) * Math.cos(u),
      y: (R + r * Math.cos(v)) * Math.sin(u),
      z: r * Math.sin(v),
      sx: 0.4, sy: 0.4, sz: Math.random() * 3 + 0.5, // Long crystals
      color: color
    });
  }

  // 5. Orbs (Scattered Starfield)
  for (let i = 0; i < count; i++) {
    const color = (i < count * 0.92) ? SCENE_CONFIG.color : SCENE_CONFIG.stemColor;
    targets.orbs.push({
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100,
      z: (Math.random() - 0.5) * 50,
      sx: 0.2, sy: 0.2, sz: 0.2,
      color: color
    });
  }
}

// Linear interpolation between two states
function lerpState(stateA, stateB, alpha) {
  const colorA = new THREE.Color();
  const colorB = new THREE.Color();
  const colorFinal = new THREE.Color();

  for (let i = 0; i < SCENE_CONFIG.count; i++) {
    const a = targets[stateA][i];
    const b = targets[stateB][i];

    if (!a || !b) continue;

    // Interpolate Pos & Scale
    dummy.position.set(
      THREE.MathUtils.lerp(a.x, b.x, alpha),
      THREE.MathUtils.lerp(a.y, b.y, alpha),
      THREE.MathUtils.lerp(a.z, b.z, alpha)
    );

    dummy.scale.set(
      THREE.MathUtils.lerp(a.sx, b.sx, alpha),
      THREE.MathUtils.lerp(a.sy, b.sy, alpha),
      THREE.MathUtils.lerp(a.sz, b.sz, alpha)
    );

    dummy.rotation.set(
      alpha * Math.PI * 2,
      alpha * Math.PI,
      0
    );

    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);

    // Color Interpolation
    // Fallbacks
    const cA = a.color !== undefined ? a.color : SCENE_CONFIG.colorAccent;
    const cB = b.color !== undefined ? b.color : SCENE_CONFIG.colorAccent;

    colorA.setHex(cA);
    colorB.setHex(cB);
    colorFinal.copy(colorA).lerp(colorB, alpha);

    instancedMesh.setColorAt(i, colorFinal);
  }
  instancedMesh.instanceMatrix.needsUpdate = true;
  if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
}

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScroll = window.scrollY / maxScroll;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

let mouseX = 0;
let mouseY = 0;
function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);

  // Smooth Scroll Lerp
  scrollProgress += (targetScroll - scrollProgress) * 0.05;

  // Determine which two states we are between
  // Timeline:
  // 0.0 - 0.2: City -> Sphere
  // 0.2 - 0.4: Sphere -> Pillar
  // 0.4 - 0.6: Pillar -> Ring
  // 0.6 - 0.8: Ring -> Orbs
  // 0.8 - 1.0: Orbs -> Flythrough (Scale up/fade)

  let phase = scrollProgress * 5; // 5 transitions

  if (phase < 1) {
    lerpState('city', 'sphere', phase);
    if (!window.isIntroActive) camera.position.z = 20; // Maintain base Z
  } else if (phase < 2) {
    lerpState('sphere', 'pillar', phase - 1);
    if (!window.isIntroActive) camera.position.z = 20;
  } else if (phase < 3) {
    lerpState('pillar', 'ring', phase - 2);
    instancedMesh.rotation.y += 0.005;
    if (!window.isIntroActive) camera.position.z = 20;
  } else if (phase < 4) {
    lerpState('ring', 'orbs', phase - 3);
    instancedMesh.rotation.x += 0.005;
    if (!window.isIntroActive) camera.position.z = 20;
  } else {
    // Finale: Flythrough
    lerpState('orbs', 'orbs', 1); // Stay as orbs but move camera
    if (!window.isIntroActive) camera.position.z = 20 - (phase - 4) * 40; // Fly forward
  }

  // Camera Parallax (Only if intro is done)
  if (!window.isIntroActive) {
    const targetX = (mouseX * 2) - 10; // Base offset -10
    camera.position.x += (targetX - camera.position.x) * 0.05;
  }
  camera.position.y += (mouseY * 2 + 5 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);

  const time = Date.now() * 0.0015;
  const breath = 1 + Math.sin(time) * 0.02; // Micro-pulse +/- 2%
  instancedMesh.scale.set(breath, breath, breath);

  // Animate Dust
  if (particlesMesh) {
    particlesMesh.rotation.y = time * 0.05; // Slow rotation
    particlesMesh.rotation.x = time * 0.02;
  }

  // Render via Composer for Bloom
  // renderer.render(scene, camera);
  composer.render();
}

// Init
init();
