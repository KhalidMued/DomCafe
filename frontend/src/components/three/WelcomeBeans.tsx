import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const BEAN_COUNT = 22;
const DRIFT_BOUNDS = { x: 9, y: 7.5, z: 4 };
// Matches the page background (nubian night mixed toward black) so distant
// beans fade into it instead of popping against the transparent canvas.
const FOG_COLOR = 0x1f1f1d;
const BEAN_COLORS = [0xba7517, 0xd85a30, 0x6d4a2a];

function createBeanGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, 24, 18);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    vertex.y *= 0.72;
    vertex.z *= 0.5;
    if (vertex.z > 0) {
      // Pinch the front face toward the long axis to suggest the bean crease.
      vertex.z *= 1 - 0.55 * Math.exp(-((vertex.y / 0.16) ** 2));
    }
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

interface BeanMotion {
  mesh: THREE.Mesh;
  riseSpeed: number;
  swayPhase: number;
  swayAmplitude: number;
  spin: THREE.Vector3;
}

export default function WelcomeBeans() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      // No usable WebGL: leave the plain dark background as the static fallback.
      return undefined;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG_COLOR, 12, 22);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 60);
    camera.position.set(0, 0, 14);

    scene.add(new THREE.AmbientLight(0xf1efe8, 0.5));
    const keyLight = new THREE.DirectionalLight(0xf5dfb8, 1.4);
    keyLight.position.set(6, 8, 10);
    scene.add(keyLight);

    const geometry = createBeanGeometry();
    const materials = BEAN_COLORS.map(
      (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15 }),
    );

    const random = (min: number, max: number) => min + Math.random() * (max - min);
    const beans: BeanMotion[] = [];
    for (let i = 0; i < BEAN_COUNT; i += 1) {
      const mesh = new THREE.Mesh(geometry, materials[i % materials.length]);
      mesh.position.set(
        random(-DRIFT_BOUNDS.x, DRIFT_BOUNDS.x),
        random(-DRIFT_BOUNDS.y, DRIFT_BOUNDS.y),
        random(-DRIFT_BOUNDS.z, DRIFT_BOUNDS.z),
      );
      mesh.rotation.set(random(0, Math.PI * 2), random(0, Math.PI * 2), random(0, Math.PI * 2));
      mesh.scale.setScalar(random(0.35, 0.7));
      scene.add(mesh);
      beans.push({
        mesh,
        riseSpeed: random(0.12, 0.3),
        swayPhase: random(0, Math.PI * 2),
        swayAmplitude: random(0.1, 0.35),
        spin: new THREE.Vector3(random(-0.3, 0.3), random(-0.3, 0.3), random(-0.3, 0.3)),
      });
    }

    const pointer = new THREE.Vector2(0, 0);
    const onPointerMove = (event: PointerEvent) => {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };
    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };

    const clock = new THREE.Clock();
    let frameId = 0;
    let running = true;

    const renderFrame = () => {
      if (!running) return;
      frameId = window.requestAnimationFrame(renderFrame);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;
      for (const bean of beans) {
        bean.mesh.position.y += bean.riseSpeed * delta;
        bean.mesh.position.x += Math.sin(elapsed * 0.4 + bean.swayPhase) * bean.swayAmplitude * delta;
        if (bean.mesh.position.y > DRIFT_BOUNDS.y) bean.mesh.position.y = -DRIFT_BOUNDS.y;
        bean.mesh.rotation.x += bean.spin.x * delta;
        bean.mesh.rotation.y += bean.spin.y * delta;
        bean.mesh.rotation.z += bean.spin.z * delta;
      }
      camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
      camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(frameId);
      } else if (!running) {
        running = true;
        clock.getDelta();
        renderFrame();
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    renderFrame();

    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      geometry.dispose();
      for (const material of materials) material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="welcome-beans-layer" aria-hidden="true" />;
}
