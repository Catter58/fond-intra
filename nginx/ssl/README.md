# SSL Certificates

This directory should contain SSL certificates for HTTPS.

## For Development

Generate self-signed certificates:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/C=RU/ST=Moscow/L=Moscow/O=Company/CN=localhost"
```

## For Production

Use Let's Encrypt with certbot:

```bash
# Install certbot
apt-get install certbot

# Generate certificates
certbot certonly --webroot -w /var/www/certbot -d your-domain.com

# Certificates will be in:
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

Update nginx config to use Let's Encrypt paths:
```nginx
ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
```

## Auto-renewal

Add to crontab:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```
