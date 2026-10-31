// Vanilla three.js scene for the homepage specialty switcher.
// Loaded with dynamic import() only in the browser, never during SSR.
import * as THREE from "three";

export type SpecialtyKey = "dental" | "eye" | "lab" | "general";
export const SPECIALTY_ORDER: SpecialtyKey[] = ["dental", "eye", "lab", "general"];

const TEAL = 0x2dd4bf;
const BLUE = 0x3b82f6;
const IVORY = 0xf3efe6;

function glass(color = 0xffffff) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.08,
    metalness: 0,
    transmission: 0.9,
    thickness: 0.6,
    ior: 1.45,
    clearcoat: 1,
    transparent: true,
    opacity: 0.55,
  });
}

function buildDental() {
  const g = new THREE.Group();
  // Molar crown profile spun on a lathe, then split into four cusps
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const y = -1.3 + t * 2.4;
    const r = t < 0.45 ? 0.32 + t * 0.9 : 0.73 + Math.sin((t - 0.45) * 2.6) * 0.18 - Math.pow(t - 0.45, 3) * 2.2;
    pts.push(new THREE.Vector2(Math.max(r, 0.05), y));
  }
  const geo = new THREE.LatheGeometry(pts, 72);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.x);
    if (v.y > 0.6) v.y += Math.cos(a * 4) * 0.12 * (v.y - 0.6) * 2;
    if (v.y < -0.4) {
      // two roots
      const k = Math.abs(Math.cos(a));
      v.x *= 0.7 + k * 0.3;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const tooth = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({ color: IVORY, roughness: 0.35, clearcoat: 0.8, sheen: 0.4 }),
  );
  g.add(tooth);
  // charting markers floating around the crown
  const markerMat = new THREE.MeshBasicMaterial({ color: TEAL });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), markerMat);
    const a = (i / 5) * Math.PI * 2;
    m.position.set(Math.cos(a) * 1.25, 0.5 + Math.sin(a * 2) * 0.25, Math.sin(a) * 1.25);
    g.add(m);
  }
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.25, 0.006, 8, 160),
    new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.5 }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.5;
  g.add(ring);
  return g;
}

function buildEye() {
  const g = new THREE.Group();
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.9, 64, 64), glass(0xdff7ff));
  lens.scale.z = 0.35;
  g.add(lens);
  const iris = new THREE.Mesh(
    new THREE.RingGeometry(0.18, 0.42, 64),
    new THREE.MeshStandardMaterial({ color: BLUE, roughness: 0.4, side: THREE.DoubleSide }),
  );
  iris.position.z = -0.05;
  g.add(iris);
  // diopter rings at increasing depth
  for (let i = 0; i < 6; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(1.05 + i * 0.16, 0.004, 6, 160),
      new THREE.MeshBasicMaterial({ color: i % 2 ? TEAL : 0xffffff, transparent: true, opacity: 0.55 - i * 0.07 }),
    );
    r.position.z = -i * 0.12;
    r.userData.spin = (i % 2 ? 1 : -1) * (0.1 + i * 0.03);
    g.add(r);
  }
  return g;
}

function buildLab() {
  const g = new THREE.Group();
  const fills = [TEAL, BLUE, 0xf59e0b, TEAL, 0xef4444];
  fills.forEach((c, i) => {
    const tube = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.7, 32, 1, true), glass());
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass());
    bottom.position.y = -0.85;
    const level = 0.5 + ((i * 37) % 50) / 100;
    const liquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, level, 32),
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.2, emissive: c, emissiveIntensity: 0.15 }),
    );
    liquid.position.y = -0.85 + level / 2;
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.14, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 }),
    );
    cap.position.y = 0.9;
    tube.add(body, bottom, liquid, cap);
    const a = (i / fills.length) * Math.PI * 2;
    tube.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85);
    tube.rotation.z = Math.cos(a) * 0.08;
    g.add(tube);
  });
  const rack = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.08, 64),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.35 }),
  );
  rack.position.y = -0.2;
  g.add(rack);
  return g;
}

function buildGeneral() {
  const g = new THREE.Group();
  // ECG trace as a tube
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 200; i++) {
    const x = -2 + (i / 200) * 4;
    const p = ((x + 2) % 1.33) / 1.33;
    let y = 0;
    if (p > 0.4 && p < 0.45) y = -0.15;
    else if (p >= 0.45 && p < 0.5) y = 0.85;
    else if (p >= 0.5 && p < 0.55) y = -0.35;
    else if (p > 0.7 && p < 0.82) y = Math.sin(((p - 0.7) / 0.12) * Math.PI) * 0.18;
    pts.push(new THREE.Vector3(x, y, 0));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.05);
  const trace = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 400, 0.025, 8),
    new THREE.MeshStandardMaterial({ color: TEAL, emissive: TEAL, emissiveIntensity: 0.6 }),
  );
  g.add(trace);
  // grid plate behind
  const grid = new THREE.GridHelper(4.2, 21, 0x64748b, 0x334155);
  grid.rotation.x = Math.PI / 2;
  grid.position.z = -0.3;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.35;
  g.add(grid);
  const plus = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 });
  plus.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.16), mat));
  plus.add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), mat));
  plus.position.set(1.5, 1.1, 0.3);
  g.add(plus);
  return g;
}

export function mountSpecialtyScene(container: HTMLElement, opts: { reduceMotion: boolean }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0.3, 6.5);

  // studio light setup + simple room environment for glass reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const panel = (c: number, x: number, y: number, z: number, s: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    envScene.add(m);
  };
  panel(0xffffff, 0, 6, 0, 6);
  panel(0x7dd3fc, -6, 1, 2, 4);
  panel(0x99f6e4, 6, 0, -2, 4);
  envScene.background = new THREE.Color(0x0b1727);
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5eead4, 1.6);
  rim.position.set(-4, 1, -3);
  scene.add(rim);

  const groups: Record<SpecialtyKey, THREE.Group> = {
    dental: buildDental(),
    eye: buildEye(),
    lab: buildLab(),
    general: buildGeneral(),
  };
  const weights: Record<SpecialtyKey, number> = { dental: 1, eye: 0, lab: 0, general: 0 };
  for (const k of SPECIALTY_ORDER) {
    groups[k].visible = k === "dental";
    scene.add(groups[k]);
  }
  let active: SpecialtyKey = "dental";

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e: PointerEvent) => {
    const r = container.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  };
  window.addEventListener("pointermove", onMove, { passive: true });

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.position.z = w < 500 ? 5.6 : 6.5;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(container);

  const clock = new THREE.Clock();
  let raf = 0;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden) return;
    const t = clock.elapsedTime;
    const k = 1 - Math.exp(-6 * dt);
    pointer.x += (pointer.tx - pointer.x) * k;
    pointer.y += (pointer.ty - pointer.y) * k;

    for (const key of SPECIALTY_ORDER) {
      const target = key === active ? 1 : 0;
      weights[key] += (target - weights[key]) * (1 - Math.exp(-7 * dt));
      const w = weights[key];
      const grp = groups[key];
      grp.visible = w > 0.01;
      if (!grp.visible) continue;
      const s = 0.6 + 0.4 * w;
      grp.scale.setScalar(s);
      grp.position.y = (1 - w) * -0.8 + (opts.reduceMotion ? 0 : Math.sin(t * 0.9) * 0.06);
      grp.rotation.y = (opts.reduceMotion ? 0 : t * 0.25) + (1 - w) * 1.2 + pointer.x * 0.35;
      grp.rotation.x = pointer.y * 0.2;
      grp.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | undefined;
        if (m && "opacity" in m) {
          if (m.userData.base === undefined) m.userData.base = m.transparent ? m.opacity : 1;
          m.transparent = true;
          m.opacity = m.userData.base * w;
        }
        if (o.userData.spin && !opts.reduceMotion) o.rotation.z += o.userData.spin * dt;
      });
    }
    renderer.render(scene, camera);
  };
  tick();

  return {
    setActive(k: SpecialtyKey) {
      active = k;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
