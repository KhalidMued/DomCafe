# Shared security headers. Nginx add_header directives are NOT inherited by
# a location that declares its own add_header, so every such location must
# include this file explicitly.
# Start with one day; no includeSubDomains/preload (other sites are separate).
add_header Strict-Transport-Security "max-age=86400" always;
add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; connect-src 'self' blob:; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: blob:; object-src 'none'; script-src 'self'; style-src 'self'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
