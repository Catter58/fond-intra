#!/bin/bash
set -e

echo "================================================"
echo "  FondSmena Intranet Portal - Starting..."
echo "================================================"

# Ensure log directory exists with proper permissions
mkdir -p /app/logs
chmod 777 /app/logs

# Initialize PostgreSQL if needed
if [ ! -f /app/data/postgres/PG_VERSION ]; then
    echo "Initializing PostgreSQL database cluster..."
    chown -R postgres:postgres /app/data/postgres
    sudo -u postgres /usr/lib/postgresql/14/bin/initdb -D /app/data/postgres
    echo "host all all 0.0.0.0/0 md5" >> /app/data/postgres/pg_hba.conf
    echo "local all all trust" >> /app/data/postgres/pg_hba.conf
    echo "listen_addresses='localhost'" >> /app/data/postgres/postgresql.conf
    echo "unix_socket_directories='/run/postgresql'" >> /app/data/postgres/postgresql.conf
fi

# Start PostgreSQL for initialization
echo "Starting PostgreSQL..."
sudo -u postgres /usr/lib/postgresql/14/bin/pg_ctl -D /app/data/postgres -l /app/logs/postgresql-init.log start

# Wait for PostgreSQL
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
    if sudo -u postgres pg_isready -h localhost; then
        break
    fi
    sleep 1
done

# Initialize database
echo "Initializing database..."
sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = '$POSTGRES_DB'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $POSTGRES_DB"

sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = '$POSTGRES_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $POSTGRES_USER WITH PASSWORD '$POSTGRES_PASSWORD'"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER"
sudo -u postgres psql -c "ALTER DATABASE $POSTGRES_DB OWNER TO $POSTGRES_USER"
sudo -u postgres psql -d "$POSTGRES_DB" -c "GRANT ALL ON SCHEMA public TO $POSTGRES_USER"

echo "Database initialized"

# Initialize Django
echo "Running Django migrations..."
cd /app/backend
export DJANGO_SETTINGS_MODULE=config.settings.production
export DATABASE_URL="postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"
export REDIS_URL="redis://localhost:6379/0"

sudo -u appuser -E python3 manage.py migrate --noinput

echo "Initializing roles..."
sudo -u appuser -E python3 manage.py init_roles || true

echo "Collecting static files..."
sudo -u appuser -E python3 manage.py collectstatic --noinput
cp -r /app/backend/staticfiles/* /var/www/static/ 2>/dev/null || true

# Create admin user
echo "Creating admin user..."
sudo -u appuser -E python3 << PYTHON_SCRIPT
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from apps.accounts.models import User
from apps.roles.models import Role

email = os.environ.get('ADMIN_EMAIL')
password = os.environ.get('ADMIN_PASSWORD')
first_name = os.environ.get('ADMIN_FIRST_NAME', 'Admin')
last_name = os.environ.get('ADMIN_LAST_NAME', 'Administrator')

if email and password:
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'is_staff': True,
            'is_superuser': True,
            'is_active': True,
        }
    )
    if created:
        user.set_password(password)
        user.save()
        admin_role = Role.objects.filter(is_admin=True).first()
        if admin_role:
            user.roles.add(admin_role)
        print(f"Admin user created: {email}")
    else:
        print(f"Admin user already exists: {email}")
else:
    print("Admin credentials not provided")
PYTHON_SCRIPT

# Setup SSL if enabled
if [ "$ENABLE_SSL" = "true" ] && [ -n "$DOMAIN" ]; then
    echo "Setting up SSL certificates..."
    /app/setup-ssl.sh
fi

# Setup SSL renewal cron job
if [ "$ENABLE_SSL" = "true" ]; then
    echo "Setting up SSL auto-renewal..."
    echo "0 3 * * * /app/renew-ssl.sh >> /app/logs/ssl-renewal.log 2>&1" | crontab -
fi

# Stop PostgreSQL (supervisor will restart it)
echo "Stopping PostgreSQL for supervisor..."
sudo -u postgres /usr/lib/postgresql/14/bin/pg_ctl -D /app/data/postgres stop

echo "================================================"
echo "  Starting all services..."
echo "================================================"

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
