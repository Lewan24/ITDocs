#!/bin/sh
set -e

envsubst '$ITDOCS_API_BASE_URL' \
    < /usr/share/nginx/html/env.template.js \
    > /usr/share/nginx/html/env.js

exec nginx -g 'daemon off;'