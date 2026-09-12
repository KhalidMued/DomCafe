// Exact curated URLs only: future uploads and API/database values stay untouched.
// Hand-named copies cannot match the server's <drink_id>-<32-hex>.webp cleanup rule.
const optimizedMenuPhotos = new Map([
  ['/uploads/drinks/americano-149e0b75623445f597ff219f6fb3b975.png', '/uploads/drinks/menu-americano.webp'],
  ['/uploads/drinks/espresso-0dec0500485a47b48d9ee4897f4296b0.png', '/uploads/drinks/menu-espresso.webp'],
  ['/uploads/drinks/cappuccino-0edac8698e204c009bc55cae2e0c9661.png', '/uploads/drinks/menu-cappuccino.webp'],
  ['/uploads/drinks/caramel_latte-069eadbbdb0c4849a98f795e56220af5.png', '/uploads/drinks/menu-caramel-latte.webp'],
  ['/uploads/drinks/cortado-60ba909207594814b5da1367996e4451.png', '/uploads/drinks/menu-cortado.webp'],
  ['/uploads/drinks/flat_white-9f943db79e1e42859363d286edfc4a43.png', '/uploads/drinks/menu-flat-white.webp'],
]);

export function menuPhotoUrl(photoUrl: string): string {
  return optimizedMenuPhotos.get(photoUrl) ?? photoUrl;
}
