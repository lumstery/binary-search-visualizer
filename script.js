// Variables
let scene, camera, renderer, controls;
let cubes = [];
let bstNodes = [];
let bstEdges = [];
let steps = [];
let currentStep = 0;
let font;
let targetNumber;

let array = [];

// Load font for labels
const loader = new THREE.FontLoader();
loader.load(
  'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
  function (loadedFont) {
    font = loadedFont;
    // Enable the Start button after the font is loaded
    document.getElementById('startBtn').disabled = false;
  },
  undefined,
  function (error) {
    console.error('An error occurred during font loading:', error);
    // Proceed without font
    font = null;
    document.getElementById('startBtn').disabled = false;
  }
);

// Disable the Start button until the font is loaded
document.getElementById('startBtn').disabled = true;

// Start the animation loop once
animate();

// Event listener for the start button
document.getElementById('startBtn').addEventListener('click', () => {
  const arrayLengthInput = document.getElementById('arrayLength').value;
  const targetNumberInput = document.getElementById('targetNumber').value;

  const arrayLength = parseInt(arrayLengthInput);
  targetNumber = parseInt(targetNumberInput);

  if (isNaN(arrayLength) || arrayLength < 1 || arrayLength > 31) {
    alert('Please enter a valid array length between 1 and 31.');
    return;
  }

  if (isNaN(targetNumber)) {
    alert('Please enter a valid target number.');
    return;
  }

  // Initialize the visualization with the provided inputs
  initVisualization(arrayLength, targetNumber);
});

function initVisualization(arrayLength, targetNumber) {
  // Clear previous scene if it exists
  if (scene) {
    // Remove existing objects from the scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Dispose of renderer
    renderer.dispose();

    // Remove existing canvas
    const container = document.getElementById('threejs-container');
    container.innerHTML = '';
  }

  // Initialize variables
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const container = document.getElementById('threejs-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 2);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  // Build the array and start the visualization
  buildArrayAndStart(arrayLength, targetNumber);
}

function buildArrayAndStart(arrayLength, targetNumber) {
  // Build the array
  array = [];
  for (let i = 1; i <= arrayLength; i++) {
    array.push(i * 2); // Even numbers from 2 to arrayLength*2
  }

  // Initialize variables
  cubes = [];
  bstNodes = [];
  bstEdges = [];
  steps = [];
  currentStep = 0;

  // Adjust camera and cube positions
  const cubeSize = 1;
  const spacing = 1.5;
  const totalWidth = arrayLength * spacing;
  const startX = -totalWidth / 2 + spacing / 2;
  camera.position.set(0, 5, arrayLength * 1.5); // Adjusted for better view

  // Create cubes (array visualization)
  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

  array.forEach((value, index) => {
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = startX + index * spacing;
    cube.position.y = 5; // Move up to make room for BST
    cube.userData = { value };
    scene.add(cube);
    cubes.push(cube);

    // Add labels to cubes
    if (font && arrayLength <= 50) {
      const textGeometry = new THREE.TextGeometry(value.toString(), {
        font: font,
        size: 0.4,
        height: 0.02,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(
        cube.position.x - 0.3,
        cube.position.y + cubeSize,
        cube.position.z
      );
      scene.add(textMesh);
    }
  });

  // Build and render BST
  const bstRoot = buildBST(
    array,
    0,
    array.length - 1,
    -arrayLength * spacing,
    arrayLength * spacing,
    0
  );
  renderBST(bstRoot);

  // Compute steps
  computeSteps(array, targetNumber);
  updateVisualization();

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

function buildBST(arr, start, end, xMin, xMax, y) {
  if (start > end) {
    return null;
  }
  const mid = Math.floor((start + end) / 2);
  const nodeValue = arr[mid];

  const xPos = (xMin + xMax) / 2;
  const yStep = -3; // Vertical distance between levels

  const node = {
    value: nodeValue,
    index: mid,
    position: { x: xPos, y },
    left: null,
    right: null,
  };

  bstNodes.push(node);

  // Left child
  node.left = buildBST(arr, start, mid - 1, xMin, xPos, y + yStep);

  // Right child
  node.right = buildBST(arr, mid + 1, end, xPos, xMax, y + yStep);

  return node;
}

function renderBST(node) {
  if (!node) return;

  // Create sphere for node
  const geometry = new THREE.SphereGeometry(0.5, 16, 16);
  const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(node.position.x, node.position.y, 0);
  sphere.userData = { node };
  scene.add(sphere);
  node.mesh = sphere;

  // Add label
  if (font) {
    const textGeometry = new THREE.TextGeometry(node.value.toString(), {
      font: font,
      size: 0.3,
      height: 0.02,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(
      node.position.x - 0.2,
      node.position.y + 0.6,
      0
    );
    scene.add(textMesh);
  }

  // Render left child
  if (node.left) {
    renderBST(node.left);

    // Draw edge to left child
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const points = [];
    points.push(new THREE.Vector3(node.position.x, node.position.y, 0));
    points.push(
      new THREE.Vector3(node.left.position.x, node.left.position.y, 0)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    bstEdges.push(line);
  }

  // Render right child
  if (node.right) {
    renderBST(node.right);

    // Draw edge to right child
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const points = [];
    points.push(new THREE.Vector3(node.position.x, node.position.y, 0));
    points.push(
      new THREE.Vector3(node.right.position.x, node.right.position.y, 0)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    bstEdges.push(line);
  }
}

function computeSteps(array, target) {
  let left = 0;
  let right = array.length - 1;

  steps = []; // Clear previous steps

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    steps.push({ left, right, mid });
    if (array[mid] === target) {
      steps.push({ left, right, mid, found: true });
      break;
    } else if (array[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (left > right) {
    // Target not found
    steps.push({ left, right, mid: -1, found: false });
  }

  currentStep = 0; // Initialize currentStep to 0
  console.log('Steps:', steps);
}

function updateVisualization() {
  console.log('updateVisualization called, currentStep:', currentStep);

  // Reset all cubes to default color and scale
  cubes.forEach((cube) => {
    cube.material.color.set(0x00ff00);
    cube.scale.set(1, 1, 1);
  });

  // Reset BST nodes
  bstNodes.forEach((node) => {
    node.mesh.material.color.set(0x00ff00);
    node.mesh.scale.set(1, 1, 1);
  });

  document.getElementById('info').innerHTML = '';

  if (currentStep >= 0 && currentStep < steps.length) {
    const { left, right, mid, found } = steps[currentStep];

    console.log('Updating visualization for step:', currentStep, steps[currentStep]);

    if (mid >= 0 && mid < cubes.length) {
      // Highlight the mid element in the array
      cubes[mid].material.color.set(0xff0000);
      cubes[mid].scale.set(1.2, 1.2, 1.2);
    }

    // Dim out elements outside the current search range
    cubes.forEach((cube, index) => {
      if (index < left || index > right) {
        cube.material.color.set(0xaaaaaa);
      }
    });

    // Highlight the node in the BST
    const midNode = bstNodes.find(node => node.index === mid);
    if (midNode) {
      midNode.mesh.material.color.set(0xff0000);
      midNode.mesh.scale.set(1.2, 1.2, 1.2);
    }

    // Display information
    if (found) {
      document.getElementById('info').innerHTML = `Target ${array[mid]} found at index ${mid}.`;
    } else if (currentStep === steps.length - 1 && !found) {
      document.getElementById('info').innerHTML = `Target ${targetNumber} not found in the array.`;
    } else {
      document.getElementById('info').innerHTML = `Step ${currentStep + 1}: Searching index ${mid}, Value ${array[mid]}`;
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Event listeners for navigation buttons
document.getElementById('nextBtn').addEventListener('click', () => {
  console.log('Next button clicked');
  if (currentStep < steps.length - 1) {
    currentStep++;
    console.log('Current Step:', currentStep);
    updateVisualization();
  } else {
    console.log('Already at the last step');
  }
});

document.getElementById('prevBtn').addEventListener('click', () => {
  console.log('Previous button clicked');
  if (currentStep > 0) {
    currentStep--;
    console.log('Current Step:', currentStep);
    updateVisualization();
  } else {
    console.log('Already at the first step');
  }
});

function onWindowResize() {
  if (camera && renderer) {
    const container = document.getElementById('threejs-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (renderer && scene && camera) {
    controls.update();
    renderer.render(scene, camera);
  }
}
