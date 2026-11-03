// m_core: minimal renderer/core for the EV model build (model.html). Will be swapped for the full lesson a_core (shared with watch-movement) at integration.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
let _seed = 977; const rnd = () => { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t, TAU = Math.PI * 2;
const QS = location.search;
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
renderer.setClearColor(0x000000, 0); renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a2233, .6));
const key = new THREE.DirectionalLight(0xffffff, 1.7); key.position.set(-20, 34, 26); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 }); key.shadow.bias = -.0006; key.shadow.normalBias = .02;
scene.add(key); const rim = new THREE.DirectionalLight(0x88ccff, .5); rim.position.set(24, 10, -24); scene.add(rim);
const camera = new THREE.PerspectiveCamera(28, 1, .5, 800);
const controls = new OrbitControls(camera, canvas); controls.enableDamping = true;
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
function M(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .55, metalness: .05, envMapIntensity: .8 }, o)); }
const EDGE = new THREE.LineBasicMaterial({ color: 0, transparent: true, opacity: .22 });
function mesh(geo, mat, { x = 0, y = 0, z = 0, parent, shadow = true, edge = false, part = '' } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; m.userData.part = part;
  if (edge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), EDGE); e.raycast = () => { }; m.add(e); }
  if (parent) parent.add(m); return m;
}
const rbox = (w, h, d, r = .04) => new RoundedBoxGeometry(w, h, d, 2, r);
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
const TX = {};
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
