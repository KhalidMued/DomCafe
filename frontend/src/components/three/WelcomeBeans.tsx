import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const BEAN_COUNT = 22;
const DRIFT_BOUNDS = { x: 9, y: 7.5, z: 4 };
// Matches the page background (nubian night mixed toward black) so distant
// beans fade into it instead of popping against the transparent canvas.
const FOG_COLOR = 0x1f1f1d;
// Sculpted roasted-bean mesh with baked PBR textures; see
// frontend/public/models/README.md and scripts/generate-coffee-bean-glb.py.
const MODEL_URL = '/models/coffee-bean.glb';
const FADE_SECONDS = 1.6;

interface BeanMotion {
  batch: THREE.InstancedMesh;
  index: number;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
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
    // Filmic tone mapping keeps the roasted browns rich instead of washed out.
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG_COLOR, 13, 24);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 60);
    camera.position.set(0, 0, 14);

    // Soft warm studio: hemisphere fill, one warm key, faint rim to lift
    // silhouettes off the dark background. A dim environment map gives the
    // matte PBR surface believable ambient response without gloss.
    scene.add(new THREE.HemisphereLight(0xf5e6c8, 0x201812, 0.85));
    const keyLight = new THREE.DirectionalLight(0xf5dfb8, 1.8);
    keyLight.position.set(5, 7, 9);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xbaa27e, 0.7);
    rimLight.position.set(-7, -3, -6);
    scene.add(rimLight);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    let disposed = false;
    let geometry: THREE.BufferGeometry | null = null;
    let sourceMaterial: THREE.MeshStandardMaterial | null = null;
    const materials: THREE.MeshPhysicalMaterial[] = [];
    const batches: THREE.InstancedMesh[] = [];
    const beans: BeanMotion[] = [];
    let fadeElapsed = 0;
    let fading = false;

    const random = (min: number, max: number) => min + Math.random() * (max - min);

    const loader = new GLTFLoader();
    const onModelLoaded = (gltf: { scene: THREE.Group }) => {
        if (disposed) {
          gltf.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.geometry.dispose();
              (object.material as THREE.MeshStandardMaterial).dispose();
            }
          });
          return;
        }
        let source: THREE.Mesh | null = null;
        gltf.scene.traverse((object) => {
          if (!source && object instanceof THREE.Mesh) source = object;
        });
        if (!source) return;
        geometry = (source as THREE.Mesh).geometry;
        sourceMaterial = (source as THREE.Mesh).material as THREE.MeshStandardMaterial;

        // Two batches with slightly different roughness so beans do not all
        // share one identical dry sheen; both stay fully non-metallic and
        // low-specular for the dry-roasted (never varnished) look.
        const batchSpecs = [
          { count: Math.ceil(BEAN_COUNT / 2), roughness: 1.0 },
          { count: Math.floor(BEAN_COUNT / 2), roughness: 0.88 },
        ];
        for (const spec of batchSpecs) {
          const material = new THREE.MeshPhysicalMaterial({
            map: sourceMaterial.map,
            normalMap: sourceMaterial.normalMap,
            roughnessMap: sourceMaterial.roughnessMap,
            aoMap: sourceMaterial.aoMap,
            metalness: 0,
            roughness: spec.roughness,
            specularIntensity: 0.35,
            transparent: true,
            opacity: 0,
          });
          material.envMapIntensity = 0.45;
          materials.push(material);

          const batch = new THREE.InstancedMesh(geometry, material, spec.count);
          batch.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          // Instances drift across the whole viewport; skip whole-mesh culling.
          batch.frustumCulled = false;
          batches.push(batch);
          scene.add(batch);

          const tint = new THREE.Color();
          for (let i = 0; i < spec.count; i += 1) {
            const base = random(0.35, 0.7);
            beans.push({
              batch,
              index: i,
              position: new THREE.Vector3(
                random(-DRIFT_BOUNDS.x, DRIFT_BOUNDS.x),
                random(-DRIFT_BOUNDS.y, DRIFT_BOUNDS.y),
                random(-DRIFT_BOUNDS.z, DRIFT_BOUNDS.z),
              ),
              rotation: new THREE.Euler(random(0, Math.PI * 2), random(0, Math.PI * 2), random(0, Math.PI * 2)),
              scale: new THREE.Vector3(
                base * random(0.92, 1.08),
                base * random(0.92, 1.08),
                base * random(0.92, 1.08),
              ),
              riseSpeed: random(0.12, 0.3),
              swayPhase: random(0, Math.PI * 2),
              swayAmplitude: random(0.1, 0.35),
              spin: new THREE.Vector3(random(-0.3, 0.3), random(-0.3, 0.3), random(-0.3, 0.3)),
            });
            // Subtle roast variation: multiply the baked albedo by a warm
            // brown tint so no two beans share the exact same roast tone.
            tint.setHSL(random(0.05, 0.09), random(0.15, 0.3), random(0.8, 0.98));
            batch.setColorAt(i, tint);
          }
          if (batch.instanceColor) batch.instanceColor.needsUpdate = true;
        }
        fading = true;
      };
    const onModelError = (error: unknown) => {
      // Model failed to load: keep the plain dark background, same as the
      // no-WebGL fallback. The animation loop just renders an empty scene.
      console.warn('WelcomeBeans: bean model failed to load', error);
    };
    // Fetch + parse instead of GLTFLoader.load: keeps full control of errors
    // and avoids THREE.FileLoader's streaming fetch path.
    fetch(MODEL_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        if (disposed) return;
        loader.parse(buffer, '', onModelLoaded, onModelError);
      })
      .catch(onModelError);

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
    const instanceMatrix = new THREE.Matrix4();
    const instanceQuaternion = new THREE.Quaternion();

    const renderFrame = () => {
      if (!running) return;
      frameId = window.requestAnimationFrame(renderFrame);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;
      if (fading) {
        fadeElapsed += delta;
        const opacity = Math.min(fadeElapsed / FADE_SECONDS, 1);
        for (const material of materials) {
          material.opacity = opacity;
          if (opacity >= 1) material.transparent = false;
        }
        if (fadeElapsed >= FADE_SECONDS) fading = false;
      }
      for (const bean of beans) {
        bean.position.y += bean.riseSpeed * delta;
        bean.position.x += Math.sin(elapsed * 0.4 + bean.swayPhase) * bean.swayAmplitude * delta;
        if (bean.position.y > DRIFT_BOUNDS.y) bean.position.y = -DRIFT_BOUNDS.y;
        bean.rotation.x += bean.spin.x * delta;
        bean.rotation.y += bean.spin.y * delta;
        bean.rotation.z += bean.spin.z * delta;
        instanceQuaternion.setFromEuler(bean.rotation);
        instanceMatrix.compose(bean.position, instanceQuaternion, bean.scale);
        bean.batch.setMatrixAt(bean.index, instanceMatrix);
      }
      for (const batch of batches) batch.instanceMatrix.needsUpdate = true;
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
      disposed = true;
      running = false;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      for (const batch of batches) batch.dispose();
      for (const material of materials) material.dispose();
      if (sourceMaterial) {
        sourceMaterial.map?.dispose();
        sourceMaterial.normalMap?.dispose();
        sourceMaterial.roughnessMap?.dispose();
        sourceMaterial.aoMap?.dispose();
        sourceMaterial.dispose();
      }
      geometry?.dispose();
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="welcome-beans-layer" aria-hidden="true" />;
}
