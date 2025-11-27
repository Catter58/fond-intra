#!/bin/bash
set -e

if [ -z "$DOMAIN" ]; then
    echo "DOMAIN not set, skipping SSL setup"
    exit 0
fi

echo "Setting up SSL for $DOMAIN..."

# Check if certificate already exists
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL certificate already exists for $DOMAIN"
else
    # Start nginx temporarily for certificate validation
    nginx &
    NGINX_PID=$!
    sleep 2

    # Obtain certificate
    certbot certonly --nginx \
        --non-interactive \
        --agree-tos \
        --email "${SSL_EMAIL:-admin@$DOMAIN}" \
        --domains "$DOMAIN" \
        --domains "www.$DOMAIN" \
        || certbot certonly --webroot \
            --webroot-path=/var/www/html \
            --non-interactive \
            --agree-tos \
            --email "${SSL_EMAIL:-admin@$DOMAIN}" \
            --domains "$DOMAIN" \
            --domains "www.$DOMAIN" \
        || echo "Failed to obtain certificate, will retry later"

    # Stop temporary nginx
    kill $NGINX_PID 2>/dev/null || true
    sleep 1
fi

# Switch to SSL nginx config if certificate exists
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "Enabling SSL configuration..."

    # Update nginx config with domain
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" /etc/nginx/nginx-ssl.conf
    cp /etc/nginx/nginx-ssl.conf /etc/nginx/nginx.conf

    echo "SSL setup complete for $DOMAIN"
else
    echo "SSL certificate not available, using HTTP only"
fi
