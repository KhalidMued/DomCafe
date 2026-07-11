#!/usr/bin/env python3
"""Generate the roasted coffee-bean GLB used by the welcome-page background.

Sculpts a realistic coffee-bean mesh (asymmetric body, S-curved central
crease, rolled lobes, wrinkle displacement) from a spherical parametric grid
and bakes matching PBR textures (albedo, tangent-space normal map, packed
occlusion/roughness/metallic) in the same parameter space, so the painted
crease, chaff line and wrinkles line up exactly with the geometry.

Output: frontend/public/models/coffee-bean.glb (self-authored, CC0).

Usage:
    pip install numpy pillow trimesh   # or: uv pip install ...
    python scripts/generate-coffee-bean-glb.py

Deterministic: fixed seeds, no timestamps — re-running reproduces the asset.
"""

from __future__ import annotations

import io
from pathlib import Path

import numpy as np
from PIL import Image
import trimesh
from trimesh.visual.material import PBRMaterial
from trimesh.visual.texture import TextureVisuals

OUT_PATH = Path(__file__).resolve().parent.parent / "frontend" / "public" / "models" / "coffee-bean.glb"

# Mesh resolution: longitude x latitude segments of the parametric grid.
SEG_U, SEG_V = 64, 44
TEX_SIZE = 512


# --------------------------------------------------------------------------
# Deterministic 3D value noise (seeded hash grid + smooth interpolation).
# --------------------------------------------------------------------------
def _hash3(ix: np.ndarray, iy: np.ndarray, iz: np.ndarray, seed: int) -> np.ndarray:
    h = (ix * 374761393 + iy * 668265263 + iz * 2147483647 + seed * 144665) & 0x7FFFFFFF
    h = (h ^ (h >> 13)) * 1274126177 & 0x7FFFFFFF
    return ((h ^ (h >> 16)) & 0xFFFF) / 65535.0


def value_noise(p: np.ndarray, seed: int) -> np.ndarray:
    """Smooth value noise in [0,1] for an (..., 3) array of points."""
    pf = np.floor(p)
    ix, iy, iz = (pf[..., k].astype(np.int64) for k in range(3))
    f = p - pf
    t = f * f * (3.0 - 2.0 * f)

    def corner(dx: int, dy: int, dz: int) -> np.ndarray:
        return _hash3(ix + dx, iy + dy, iz + dz, seed)

    n000, n100 = corner(0, 0, 0), corner(1, 0, 0)
    n010, n110 = corner(0, 1, 0), corner(1, 1, 0)
    n001, n101 = corner(0, 0, 1), corner(1, 0, 1)
    n011, n111 = corner(0, 1, 1), corner(1, 1, 1)
    nx00 = n000 + (n100 - n000) * t[..., 0]
    nx10 = n010 + (n110 - n010) * t[..., 0]
    nx01 = n001 + (n101 - n001) * t[..., 0]
    nx11 = n011 + (n111 - n011) * t[..., 0]
    nxy0 = nx00 + (nx10 - nx00) * t[..., 1]
    nxy1 = nx01 + (nx11 - nx01) * t[..., 1]
    return nxy0 + (nxy1 - nxy0) * t[..., 2]


def fbm(p: np.ndarray, seed: int, octaves: int = 4) -> np.ndarray:
    """Fractal value noise, roughly centered on 0 with range ~[-1, 1]."""
    total = np.zeros(p.shape[:-1])
    amp, freq, norm = 1.0, 1.0, 0.0
    for i in range(octaves):
        total += amp * (value_noise(p * freq, seed + i * 101) - 0.5) * 2.0
        norm += amp
        amp *= 0.5
        freq *= 2.03
    return total / norm


def smoothstep(a: float, b: float, x: np.ndarray) -> np.ndarray:
    t = np.clip((x - a) / (b - a), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


# --------------------------------------------------------------------------
# Shared feature fields.
#
# The bean lives in sphere-parameter space: px along the length axis (poles at
# the two tips), py across the width, pz through the thickness. pz > 0 is the
# flat (ventral) face that carries the crease; pz < 0 is the domed back.
# --------------------------------------------------------------------------
def sphere_points(u: np.ndarray, v: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    theta = v * np.pi
    phi = u * 2.0 * np.pi
    px = np.cos(theta)
    py = np.sin(theta) * np.cos(phi)
    pz = np.sin(theta) * np.sin(phi)
    return px, py, pz


def crease_fields(px: np.ndarray, py: np.ndarray, pz: np.ndarray):
    """Return (gauss, chaff, lobe, mask*taper) for the central crease."""
    width = 0.105
    meander = 0.05 * np.sin(np.pi * px) + 0.015 * np.sin(2.6 * np.pi * px + 1.7)
    d = (py * 0.70 - meander) / width
    taper = 1.0 - smoothstep(0.55, 0.95, np.abs(px))
    mask = smoothstep(0.12, 0.5, pz) * taper
    gauss = np.exp(-d * d)
    chaff = np.exp(-((d / 0.22) ** 2))
    lobe = np.exp(-(((np.abs(d) - 1.6) / 0.7) ** 2))
    return gauss, chaff, lobe, mask, d


def bean_position(px: np.ndarray, py: np.ndarray, pz: np.ndarray) -> np.ndarray:
    """Map unit-sphere points to the sculpted bean surface."""
    # Base proportions: length ~2.0, width ~1.4, thickness ~1.0 (dorsal deeper).
    x = px * 1.0
    widen = 1.0 + 0.09 * px  # one end blunter than the other
    y = py * 0.70 * widen
    t_dorsal, t_ventral = 0.52, 0.38
    tz = t_dorsal + (t_ventral - t_dorsal) * (0.5 + 0.5 * np.tanh(3.0 * pz))
    z = pz * tz * widen

    gauss, _, lobe, mask, _ = crease_fields(px, py, pz)
    z -= 0.12 * gauss * mask           # carve the central crease
    z += 0.032 * lobe * mask           # lobes roll up beside the crease
    z += 0.06 * px * px - 0.03         # slight lengthwise curl

    pos = np.stack([x, y, z], axis=-1)

    # Low-frequency lopsidedness + mid-frequency wrinkles, pushed radially.
    p3 = np.stack([px, py, pz], axis=-1)
    lump = fbm(p3 * np.array([1.6, 2.2, 2.2]) + 7.3, seed=41, octaves=3) * 0.045
    wrinkle_in = p3 * np.array([2.4, 6.5, 6.5]) + 2.9
    wrinkle = fbm(wrinkle_in, seed=97, octaves=3) * 0.014
    radial = pos / np.maximum(np.linalg.norm(pos, axis=-1, keepdims=True), 1e-6)
    pos += radial * (lump + wrinkle)[..., None]
    return pos


# --------------------------------------------------------------------------
# Mesh construction.
# --------------------------------------------------------------------------
def build_mesh() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    j = np.arange(SEG_U + 1)
    i = np.arange(SEG_V + 1)
    uu, vv = np.meshgrid(j / SEG_U, i / SEG_V)  # (rows, cols)
    px, py, pz = sphere_points(uu, vv)
    pos = bean_position(px, py, pz)
    pos[:, -1] = pos[:, 0]  # exact wrap at the seam

    # Vertex normals via central differences on the parametric grid.
    dv = np.gradient(pos, axis=0)
    du_wrapped = np.empty_like(pos)
    du_wrapped[:, 1:-1] = (pos[:, 2:] - pos[:, :-2]) * 0.5
    du_wrapped[:, 0] = (pos[:, 1] - pos[:, -2]) * 0.5
    du_wrapped[:, -1] = du_wrapped[:, 0]
    normal = np.cross(du_wrapped, dv)
    length = np.linalg.norm(normal, axis=-1, keepdims=True)
    # Poles have degenerate tangents; point their normals along the tips.
    normal = np.where(length > 1e-9, normal / np.maximum(length, 1e-9), 0.0)
    normal[0, :] = [1.0, 0.0, 0.0]
    normal[-1, :] = [-1.0, 0.0, 0.0]

    rows, cols = pos.shape[0], pos.shape[1]
    verts = pos.reshape(-1, 3)
    norms = normal.reshape(-1, 3)
    uvs = np.stack([uu, 1.0 - vv], axis=-1).reshape(-1, 2)  # glTF v origin is top

    faces = []
    for r in range(rows - 1):
        for c in range(cols - 1):
            a = r * cols + c
            b = a + 1
            cc = a + cols
            dd = cc + 1
            if r > 0:
                faces.append([a, cc, b])
            if r < rows - 2:
                faces.append([b, cc, dd])
    return verts, np.asarray(faces, dtype=np.int64), norms, uvs


# --------------------------------------------------------------------------
# Texture baking (same feature fields, evaluated per texel).
# --------------------------------------------------------------------------
def bake_textures() -> tuple[Image.Image, Image.Image, Image.Image]:
    n = TEX_SIZE
    us, vs = np.meshgrid((np.arange(n) + 0.5) / n, (np.arange(n) + 0.5) / n)
    px, py, pz = sphere_points(us, vs)  # image row 0 == v=0 (top, per UV flip)
    p3 = np.stack([px, py, pz], axis=-1)
    gauss, chaff, lobe, mask, _ = crease_fields(px, py, pz)

    mottle = fbm(p3 * 2.6 + 11.0, seed=7, octaves=4) * 0.5 + 0.5
    patch = fbm(p3 * 1.3 + 3.0, seed=23, octaves=3) * 0.5 + 0.5
    speckle = fbm(p3 * 22.0, seed=55, octaves=2)
    wrinkle = fbm(p3 * np.array([2.4, 6.5, 6.5]) + 2.9, seed=97, octaves=3)
    grain = fbm(p3 * 18.0 + 5.0, seed=131, octaves=2)

    # Albedo: mottled roasted browns, darker crease, pale chaff line.
    dark = np.array([56.0, 34.0, 19.0])
    mid = np.array([96.0, 60.0, 33.0])
    light = np.array([134.0, 88.0, 50.0])
    base = dark + (mid - dark) * mottle[..., None]
    base = base + (light - base) * (smoothstep(0.62, 0.95, patch) * 0.5)[..., None]
    base *= (1.0 + 0.10 * wrinkle + 0.06 * speckle)[..., None]
    crease_shadow = 1.0 - 0.52 * gauss * mask  # roast stays dark inside the cut
    base *= crease_shadow[..., None]
    chaff_color = np.array([206.0, 172.0, 126.0])
    chaff_w = (chaff * mask * (0.75 + 0.25 * mottle))[..., None]
    base = base + (chaff_color - base) * np.clip(chaff_w, 0.0, 1.0)
    albedo = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), "RGB")

    # Height detail -> tangent-space normal map (crease line, wrinkles, grain).
    height = (
        -0.55 * np.exp(-((gauss - 1.0) / 0.35) ** 2) * mask  # crisp inner cut
        + 0.22 * chaff * mask                                # raised silverskin
        + 0.14 * lobe * mask
        + 0.26 * wrinkle
        + 0.07 * grain
    )
    gy, gx = np.gradient(height)
    strength = 1.3
    nx = -gx * n * strength / 48.0
    ny = gy * n * strength / 48.0  # +Y up (OpenGL convention, v flipped in UVs)
    nz = np.ones_like(nx)
    inv = 1.0 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nrm = np.stack([nx * inv, ny * inv, nz * inv], axis=-1)
    normal_img = Image.fromarray(
        np.clip((nrm * 0.5 + 0.5) * 255.0, 0, 255).astype(np.uint8), "RGB"
    )

    # ORM: R occlusion, G roughness, B metallic (always 0).
    occlusion = 1.0 - 0.45 * gauss * mask - 0.15 * np.clip(-wrinkle, 0.0, None)
    rough = (
        0.88
        + 0.06 * (mottle - 0.5) * 2.0
        - 0.10 * lobe * mask        # faint dry sheen on the rolled lobes
        + 0.10 * gauss * mask       # dusty inside the crease
        - 0.05 * np.clip(wrinkle, 0.0, None)
    )
    orm = np.stack(
        [
            np.clip(occlusion, 0.0, 1.0),
            np.clip(rough, 0.05, 0.98),
            np.zeros_like(rough),
        ],
        axis=-1,
    )
    orm_img = Image.fromarray(np.clip(orm * 255.0, 0, 255).astype(np.uint8), "RGB")
    return albedo, normal_img, orm_img


def flatten_poles(img: Image.Image) -> Image.Image:
    """Make the top/bottom texel rows uniform so pole pinching + JPEG ringing
    cannot produce stray saturated pixels at the bean tips."""
    a = np.asarray(img).copy()
    for rows in (slice(0, 3), slice(-3, None)):
        a[rows] = a[rows].mean(axis=(0, 1), keepdims=True).astype(a.dtype)
    return Image.fromarray(a, "RGB")


def as_jpeg(img: Image.Image, quality: int) -> Image.Image:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    buf.seek(0)
    return Image.open(buf)


def main() -> None:
    verts, faces, norms, uvs = build_mesh()
    albedo, normal_img, orm_img = bake_textures()

    orm_jpeg = as_jpeg(flatten_poles(orm_img), 90)  # shared: R=AO, G=rough, B=metal
    material = PBRMaterial(
        name="roasted-coffee-bean",
        baseColorTexture=as_jpeg(flatten_poles(albedo), 88),
        normalTexture=as_jpeg(flatten_poles(normal_img), 92),
        metallicRoughnessTexture=orm_jpeg,
        occlusionTexture=orm_jpeg,
        metallicFactor=0.0,
        roughnessFactor=1.0,
        doubleSided=False,
    )
    mesh = trimesh.Trimesh(
        vertices=verts,
        faces=faces,
        vertex_normals=norms,
        visual=TextureVisuals(uv=uvs, material=material),
        process=False,
    )
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(OUT_PATH)
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"wrote {OUT_PATH} ({size_kb:.0f} KB, {len(verts)} verts, {len(faces)} tris)")


if __name__ == "__main__":
    main()
