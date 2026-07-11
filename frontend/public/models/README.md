# 3D models

## coffee-bean.glb

Roasted coffee-bean mesh used by the welcome-page drifting-beans background
(`frontend/src/components/three/WelcomeBeans.tsx`).

- **Source:** self-authored for this project — procedurally sculpted and baked
  by `scripts/generate-coffee-bean-glb.py` (deterministic; re-running the
  script reproduces the file byte-for-byte apart from JPEG encoder versions).
- **License:** CC0 / public domain. No third-party assets, textures, or scan
  data were used; no attribution required.
- **Contents:** one mesh (2,925 vertices / 5,504 triangles) with baked PBR
  textures embedded in the binary — 512² base-color (JPEG), 512² tangent-space
  normal map (JPEG), and a shared 512² occlusion/roughness/metallic map
  (JPEG, R=AO, G=roughness, B=metallic 0). ~210 KB total.
- **Geometry:** asymmetric bean body, S-curved central crease with raised
  chaff (silverskin) line, rolled lobes, lengthwise curl, and two layers of
  noise displacement (lopsidedness + wrinkles). The same feature fields are
  evaluated in texture space, so painted crease/chaff/wrinkle detail lines up
  with the sculpt.

The renderer draws it with `THREE.InstancedMesh` and per-instance tint/scale
variation, so this one asset covers all beans on screen.
