import { useEffect, useRef, useState } from "react";

/** Lightweight 3D preview for STL scan files. Loads three.js only in the browser. */
export function StlViewer({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const el = ref.current;
      if (!el || disposed) return;
      const w = el.clientWidth, h = el.clientHeight;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(getComputedStyle(el).backgroundColor || "#f4f6f8");
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 5000);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      el.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
      const dir = new THREE.DirectionalLight(0xffffff, 1.2);
      dir.position.set(1, 2, 3);
      camera.add(dir);
      scene.add(camera);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      try {
        const geo = await new STLLoader().loadAsync(url);
        if (disposed) return;
        geo.computeVertexNormals();
        geo.center();
        const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xece4d4, roughness: 0.45, metalness: 0.05 }));
        scene.add(mesh);
        geo.computeBoundingSphere();
        const r = geo.boundingSphere?.radius || 20;
        camera.position.set(0, r * 0.6, r * 2.6);
        controls.update();
      } catch {
        setError("Could not open this file as a 3D model.");
      }

      let raf = 0;
      const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
      loop();
      const onResize = () => {
        const nw = el.clientWidth, nh = el.clientHeight;
        camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        controls.dispose(); renderer.dispose();
        renderer.domElement.remove();
      };
    })();
    return () => { disposed = true; cleanup(); };
  }, [url]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-lg border bg-muted">
      <div ref={ref} className="h-full w-full bg-muted" />
      {error && <p className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">{error}</p>}
      {!error && <p className="pointer-events-none absolute bottom-2 left-2 text-[11px] text-muted-foreground">Drag to rotate · scroll to zoom</p>}
    </div>
  );
}
