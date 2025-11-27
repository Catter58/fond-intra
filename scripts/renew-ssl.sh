#!/bin/bash

echo "$(date): Checking SSL certificate renewal..."

# Renew certificates
certbot renew --quiet --nginx

# Reload nginx if certificates were renewed
if [ $? -eq 0 ]; then
    echo "$(date): Reloading nginx..."
    nginx -s reload
fi

echo "$(date): SSL renewal check complete"
