# Shared security headers. Nginx add_header directives are NOT inherited by
# a location that declares its own add_header, so every such location must
# include this file explicitly.
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
