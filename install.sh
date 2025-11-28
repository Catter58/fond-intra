#!/bin/bash

# =============================================================================
# FondSmena Intranet Portal - Installation Script
# =============================================================================
# Usage:
#   Interactive:  ./install.sh
#   With config:  ./install.sh --config install.conf
#   Auto mode:    ./install.sh --auto (uses defaults + generates passwords)
#   With SSL:     ./install.sh --auto --ssl --domain example.com --email admin@example.com
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTAINER_NAME="fondsmena-intranet"
IMAGE_NAME="fondsmena-intranet:latest"

# Default values
DEFAULT_SITE_NAME="FondSmena Intranet"
DEFAULT_ALLOWED_HOSTS="localhost,127.0.0.1"
DEFAULT_POSTGRES_DB="fond_intra"
DEFAULT_POSTGRES_USER="fond_intra"
DEFAULT_EMAIL_PORT="587"
DEFAULT_FROM_EMAIL="noreply@company.local"
DEFAULT_ADMIN_FIRST_NAME="Admin"
DEFAULT_ADMIN_LAST_NAME="Administrator"

# Config variables
CONFIG_FILE=""
AUTO_MODE=false
ENABLE_SSL=false
DOMAIN=""
SSL_EMAIL=""

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}$1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

generate_password() {
    local length=${1:-16}
    python3 -c "import secrets, string; print(''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range($length)))" 2>/dev/null || \
    openssl rand -base64 $length | tr -d '\n/+=' | head -c $length
}

generate_secret_key() {
    python3 -c "import secrets; print(secrets.token_urlsafe(50))" 2>/dev/null || \
    openssl rand -base64 50 | tr -d '\n/+=' | head -c 50
}

prompt_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    local result

    # Check if variable already set (from config or env)
    eval "local current_val=\${$var_name:-}"
    if [ -n "$current_val" ]; then
        echo "$current_val"
        return
    fi

    if [ -n "$default" ]; then
        read -p "$(echo -e "${CYAN}$prompt${NC} [${YELLOW}$default${NC}]: ")" result </dev/tty
        result="${result:-$default}"
    else
        read -p "$(echo -e "${CYAN}$prompt${NC}: ")" result </dev/tty
    fi
    echo "$result"
}

prompt_password() {
    local prompt="$1"
    local var_name="$2"
    local result

    # Check if variable already set (only if var_name is provided)
    if [ -n "$var_name" ]; then
        eval "local current_val=\${$var_name:-}"
        if [ -n "$current_val" ]; then
            echo "$current_val"
            return
        fi
    fi

    read -s -p "$(echo -e "${CYAN}$prompt${NC}: ")" result </dev/tty
    echo "" >&2
    echo "$result"
}

validate_email() {
    local email="$1"
    if [[ "$email" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    fi
    return 1
}

# =============================================================================
# Parse Arguments
# =============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --config|-c)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --auto|-a)
                AUTO_MODE=true
                shift
                ;;
            --ssl)
                ENABLE_SSL=true
                shift
                ;;
            --domain|-d)
                DOMAIN="$2"
                shift 2
                ;;
            --email|-e)
                SSL_EMAIL="$2"
                shift 2
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --config, -c FILE   Load configuration from file"
                echo "  --auto, -a          Auto mode with defaults and generated passwords"
                echo "  --ssl               Enable SSL with Let's Encrypt"
                echo "  --domain, -d DOMAIN Domain name for SSL certificate"
                echo "  --email, -e EMAIL   Email for Let's Encrypt notifications"
                echo "  --help, -h          Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0 --auto                                    # Quick local setup"
                echo "  $0 --auto --ssl --domain example.com         # Production with SSL"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

load_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        print_info "Loading configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
        print_step "Configuration loaded"
    fi
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

check_requirements() {
    print_header "Checking System Requirements"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_step "Docker is installed"

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    print_step "Docker daemon is running"

    # Check if port 80 is available
    if ss -tuln 2>/dev/null | grep -q ':80 '; then
        print_warning "Port 80 is currently in use. Will attempt to free it."
    else
        print_step "Port 80 is available"
    fi

    # Check if port 443 is available (for SSL)
    if [ "$ENABLE_SSL" = true ]; then
        if ss -tuln 2>/dev/null | grep -q ':443 '; then
            print_warning "Port 443 is currently in use. Will attempt to free it."
        else
            print_step "Port 443 is available"
        fi
    fi
}

# =============================================================================
# Configuration Collection
# =============================================================================

collect_configuration() {
    print_header "Service Configuration"

    if [ "$AUTO_MODE" = true ]; then
        print_info "Auto mode: using defaults and generating passwords"
        SITE_NAME="${SITE_NAME:-$DEFAULT_SITE_NAME}"

        # Set allowed hosts based on domain
        # Use wildcard '*' for remote access without domain name
        if [ -n "$DOMAIN" ]; then
            ALLOWED_HOSTS="${ALLOWED_HOSTS:-$DOMAIN,www.$DOMAIN,localhost,127.0.0.1}"
        else
            # Allow all hosts for remote access without domain
            ALLOWED_HOSTS="${ALLOWED_HOSTS:-*}"
        fi

        POSTGRES_DB="${POSTGRES_DB:-$DEFAULT_POSTGRES_DB}"
        POSTGRES_USER="${POSTGRES_USER:-$DEFAULT_POSTGRES_USER}"
        POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(generate_password 16)}"
        EMAIL_HOST="${EMAIL_HOST:-}"
        EMAIL_PORT="${EMAIL_PORT:-$DEFAULT_EMAIL_PORT}"
        EMAIL_HOST_USER="${EMAIL_HOST_USER:-}"
        EMAIL_HOST_PASSWORD="${EMAIL_HOST_PASSWORD:-}"
        DEFAULT_FROM_EMAIL="${DEFAULT_FROM_EMAIL:-$DEFAULT_FROM_EMAIL}"
        ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN:-localhost}}"
        ADMIN_PASSWORD="${ADMIN_PASSWORD:-$(generate_password 12)}"
        ADMIN_FIRST_NAME="${ADMIN_FIRST_NAME:-$DEFAULT_ADMIN_FIRST_NAME}"
        ADMIN_LAST_NAME="${ADMIN_LAST_NAME:-$DEFAULT_ADMIN_LAST_NAME}"
    else
        echo -e "${BLUE}Please provide the following configuration values.${NC}"
        echo -e "${BLUE}Press Enter to accept default values shown in brackets.${NC}"
        echo ""

        # Site settings
        SITE_NAME=$(prompt_input "Site name" "$DEFAULT_SITE_NAME" "SITE_NAME")
        ALLOWED_HOSTS=$(prompt_input "Allowed hosts (comma-separated)" "$DEFAULT_ALLOWED_HOSTS" "ALLOWED_HOSTS")

        echo ""
        print_info "Database Configuration"
        POSTGRES_DB=$(prompt_input "Database name" "$DEFAULT_POSTGRES_DB" "POSTGRES_DB")
        POSTGRES_USER=$(prompt_input "Database user" "$DEFAULT_POSTGRES_USER" "POSTGRES_USER")

        if [ -z "$POSTGRES_PASSWORD" ]; then
            while true; do
                POSTGRES_PASSWORD=$(prompt_password "Database password (min 8 characters)" "POSTGRES_PASSWORD")
                if [ ${#POSTGRES_PASSWORD} -ge 8 ]; then
                    break
                fi
                print_error "Password must be at least 8 characters"
            done
        fi

        echo ""
        print_info "Email Configuration (optional, press Enter to skip)"
        EMAIL_HOST=$(prompt_input "SMTP server" "" "EMAIL_HOST")
        if [ -n "$EMAIL_HOST" ]; then
            EMAIL_PORT=$(prompt_input "SMTP port" "$DEFAULT_EMAIL_PORT" "EMAIL_PORT")
            EMAIL_HOST_USER=$(prompt_input "SMTP username" "" "EMAIL_HOST_USER")
            EMAIL_HOST_PASSWORD=$(prompt_password "SMTP password" "EMAIL_HOST_PASSWORD")
            DEFAULT_FROM_EMAIL=$(prompt_input "From email address" "$DEFAULT_FROM_EMAIL" "DEFAULT_FROM_EMAIL")
        else
            EMAIL_PORT="$DEFAULT_EMAIL_PORT"
            EMAIL_HOST_USER=""
            EMAIL_HOST_PASSWORD=""
        fi

        echo ""
        print_info "Domain & SSL Configuration"
        DOMAIN=$(prompt_input "Domain name (e.g., portal.example.com, or press Enter to skip)" "" "DOMAIN")

        if [ -n "$DOMAIN" ]; then
            # Validate domain format
            if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$ ]]; then
                print_warning "Domain format may be invalid, but continuing..."
            fi

            # Update ALLOWED_HOSTS with domain
            ALLOWED_HOSTS="$DOMAIN,www.$DOMAIN,localhost,127.0.0.1"

            read -p "$(echo -e "${CYAN}Enable SSL with Let's Encrypt for $DOMAIN? (y/n)${NC} [${YELLOW}y${NC}]: ")" ssl_choice </dev/tty
            if [[ ! "$ssl_choice" =~ ^[Nn]$ ]]; then
                ENABLE_SSL=true
                SSL_EMAIL=$(prompt_input "Email for SSL certificate notifications" "${ADMIN_EMAIL:-admin@$DOMAIN}" "SSL_EMAIL")
                print_step "SSL will be configured for $DOMAIN"
            else
                ENABLE_SSL=false
                SSL_EMAIL=""
                print_info "SSL disabled. Site will be accessible via HTTP only."
            fi
        else
            ENABLE_SSL=false
            SSL_EMAIL=""
            print_info "No domain specified. Site will be accessible via IP address."
        fi
    fi

    SECRET_KEY=$(generate_secret_key)
    print_step "Configuration collected"
}

# =============================================================================
# Admin User Creation
# =============================================================================

collect_admin_credentials() {
    print_header "Administrator Account"

    if [ "$AUTO_MODE" = true ] && [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
        print_info "Using pre-configured admin credentials"
        print_step "Admin: $ADMIN_EMAIL"
        return
    fi

    echo -e "${BLUE}Create the initial administrator account.${NC}"
    echo ""

    if [ -z "$ADMIN_EMAIL" ]; then
        while true; do
            ADMIN_EMAIL=$(prompt_input "Admin email" "" "ADMIN_EMAIL")
            if validate_email "$ADMIN_EMAIL"; then
                break
            fi
            print_error "Please enter a valid email address"
        done
    fi

    ADMIN_FIRST_NAME=$(prompt_input "Admin first name" "$DEFAULT_ADMIN_FIRST_NAME" "ADMIN_FIRST_NAME")
    ADMIN_LAST_NAME=$(prompt_input "Admin last name" "$DEFAULT_ADMIN_LAST_NAME" "ADMIN_LAST_NAME")

    if [ -z "$ADMIN_PASSWORD" ]; then
        while true; do
            ADMIN_PASSWORD=$(prompt_password "Admin password (min 8 characters)" "ADMIN_PASSWORD")
            if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
                print_error "Password must be at least 8 characters"
                continue
            fi

            ADMIN_PASSWORD_CONFIRM=$(prompt_password "Confirm admin password" "")
            if [ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]; then
                break
            fi
            print_error "Passwords do not match"
        done
    fi

    print_step "Admin credentials collected"
}

# =============================================================================
# Create Configuration Files
# =============================================================================

create_env_file() {
    print_header "Creating Configuration Files"

    # Determine protocol and CORS origins
    if [ "$ENABLE_SSL" = true ] && [ -n "$DOMAIN" ]; then
        PROTOCOL="https"
        CORS_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,http://localhost"
        FRONTEND_URL="https://$DOMAIN"
    else
        PROTOCOL="http"
        CORS_ORIGINS="http://localhost,http://127.0.0.1"
        FRONTEND_URL="http://localhost"
    fi

    cat > "$PROJECT_DIR/.env.production" << EOF
# FondSmena Intranet Portal Configuration
# Generated on $(date)

# Site Settings
SITE_NAME=${SITE_NAME}
ALLOWED_HOSTS=${ALLOWED_HOSTS}
FRONTEND_URL=${FRONTEND_URL}
CORS_ALLOWED_ORIGINS=${CORS_ORIGINS}

# Database
POSTGRES_DB=${POSTGRES_DB}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Security
SECRET_KEY=${SECRET_KEY}
DEBUG=False

# Email
EMAIL_HOST=${EMAIL_HOST}
EMAIL_PORT=${EMAIL_PORT}
EMAIL_HOST_USER=${EMAIL_HOST_USER}
EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
DEFAULT_FROM_EMAIL=${DEFAULT_FROM_EMAIL}

# Admin User
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_FIRST_NAME=${ADMIN_FIRST_NAME}
ADMIN_LAST_NAME=${ADMIN_LAST_NAME}

# SSL
ENABLE_SSL=${ENABLE_SSL}
DOMAIN=${DOMAIN}
SSL_EMAIL=${SSL_EMAIL}
EOF

    chmod 600 "$PROJECT_DIR/.env.production"
    print_step "Created .env.production configuration file"
}

# =============================================================================
# Create All-in-One Dockerfile
# =============================================================================

create_dockerfile() {
    print_info "Creating all-in-one Dockerfile..."

    cat > "$PROJECT_DIR/Dockerfile.allinone" << 'DOCKERFILE_EOF'
# =============================================================================
# FondSmena Intranet Portal - All-in-One Container
# =============================================================================
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql \
    postgresql-contrib \
    redis-server \
    python3 \
    python3-venv \
    python3-dev \
    python3-pip \
    build-essential \
    libpq-dev \
    nginx \
    curl \
    ca-certificates \
    gnupg \
    supervisor \
    sudo \
    cron \
    certbot \
    python3-certbot-nginx \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create application user
RUN useradd -m -s /bin/bash appuser

# Set up directories
WORKDIR /app
RUN mkdir -p /app/backend /app/frontend /app/data/postgres /app/data/redis /app/logs /var/www/html /var/www/static /var/www/media /etc/letsencrypt \
    && mkdir -p /run/postgresql /var/run/redis \
    && chown -R postgres:postgres /app/data/postgres /run/postgresql \
    && chown -R redis:redis /app/data/redis /var/run/redis

# Upgrade pip and install backend requirements with extended timeouts for slow connections
COPY backend/requirements.txt /app/backend/
RUN pip3 install --upgrade pip && \
    pip3 install --no-cache-dir \
    --timeout 300 \
    --retries 5 \
    -r /app/backend/requirements.txt

# Copy backend
COPY backend /app/backend/

# Copy frontend and build
COPY frontend/package*.json /app/frontend/
WORKDIR /app/frontend
RUN npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

COPY frontend /app/frontend/
RUN npm run build && cp -r dist/* /var/www/html/

WORKDIR /app

# Configure Redis
RUN sed -i 's/^daemonize yes/daemonize no/' /etc/redis/redis.conf 2>/dev/null || true \
    && echo "daemonize no" >> /etc/redis/redis.conf \
    && echo "dir /app/data/redis" >> /etc/redis/redis.conf \
    && echo "logfile \"\"" >> /etc/redis/redis.conf

# Copy configurations
COPY nginx/nginx-allinone.conf /etc/nginx/nginx.conf
COPY nginx/nginx-ssl.conf /etc/nginx/nginx-ssl.conf
RUN rm -f /etc/nginx/sites-enabled/default

# Copy supervisor config
COPY scripts/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy scripts
COPY scripts/entrypoint.sh /app/entrypoint.sh
COPY scripts/setup-ssl.sh /app/setup-ssl.sh
COPY scripts/renew-ssl.sh /app/renew-ssl.sh
RUN chmod +x /app/*.sh /app/scripts/*.sh 2>/dev/null || true

# Set permissions
RUN chown -R appuser:appuser /app/backend /app/logs /var/www

EXPOSE 80 443

VOLUME ["/app/data/postgres", "/app/data/redis", "/var/www/media", "/etc/letsencrypt"]

ENTRYPOINT ["/app/entrypoint.sh"]
DOCKERFILE_EOF

    print_step "Created Dockerfile.allinone"
}

# =============================================================================
# Create Supporting Scripts
# =============================================================================

create_scripts() {
    print_info "Creating supporting scripts..."

    mkdir -p "$PROJECT_DIR/scripts"

    # Supervisor configuration
    cat > "$PROJECT_DIR/scripts/supervisord.conf" << 'SUPERVISOR_EOF'
[supervisord]
nodaemon=true
user=root
logfile=/app/logs/supervisord.log
pidfile=/var/run/supervisord.pid
childlogdir=/app/logs

[program:postgresql]
command=/usr/lib/postgresql/14/bin/postgres -D /app/data/postgres
user=postgres
autostart=true
autorestart=true
priority=10
stdout_logfile=/app/logs/postgresql.log
stderr_logfile=/app/logs/postgresql-error.log

[program:redis]
command=/usr/bin/redis-server /etc/redis/redis.conf
user=redis
autostart=true
autorestart=true
priority=10
stdout_logfile=/app/logs/redis.log
stderr_logfile=/app/logs/redis-error.log

[program:django]
command=/usr/bin/python3 -m gunicorn --bind 127.0.0.1:8000 --workers 4 --timeout 120 config.wsgi:application
directory=/app/backend
user=appuser
autostart=true
autorestart=true
startsecs=10
priority=20
environment=DJANGO_SETTINGS_MODULE="config.settings.production",DATABASE_URL="postgres://%(ENV_POSTGRES_USER)s:%(ENV_POSTGRES_PASSWORD)s@localhost:5432/%(ENV_POSTGRES_DB)s",REDIS_URL="redis://localhost:6379/0",SECRET_KEY="%(ENV_SECRET_KEY)s",ALLOWED_HOSTS="%(ENV_ALLOWED_HOSTS)s",CORS_ALLOWED_ORIGINS="%(ENV_CORS_ALLOWED_ORIGINS)s",CORS_ALLOW_ALL="%(ENV_CORS_ALLOW_ALL)s",FRONTEND_URL="%(ENV_FRONTEND_URL)s"
stdout_logfile=/app/logs/django.log
stderr_logfile=/app/logs/django-error.log

[program:celery]
command=/usr/bin/python3 -m celery -A config worker -l info
directory=/app/backend
user=appuser
autostart=true
autorestart=true
startsecs=10
priority=30
environment=DJANGO_SETTINGS_MODULE="config.settings.production",DATABASE_URL="postgres://%(ENV_POSTGRES_USER)s:%(ENV_POSTGRES_PASSWORD)s@localhost:5432/%(ENV_POSTGRES_DB)s",REDIS_URL="redis://localhost:6379/0",SECRET_KEY="%(ENV_SECRET_KEY)s"
stdout_logfile=/app/logs/celery.log
stderr_logfile=/app/logs/celery-error.log

[program:celery-beat]
command=/usr/bin/python3 -m celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
directory=/app/backend
user=appuser
autostart=true
autorestart=true
startsecs=10
priority=30
environment=DJANGO_SETTINGS_MODULE="config.settings.production",DATABASE_URL="postgres://%(ENV_POSTGRES_USER)s:%(ENV_POSTGRES_PASSWORD)s@localhost:5432/%(ENV_POSTGRES_DB)s",REDIS_URL="redis://localhost:6379/0",SECRET_KEY="%(ENV_SECRET_KEY)s"
stdout_logfile=/app/logs/celery-beat.log
stderr_logfile=/app/logs/celery-beat-error.log

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
autostart=true
autorestart=true
priority=40
stdout_logfile=/app/logs/nginx.log
stderr_logfile=/app/logs/nginx-error.log

[program:cron]
command=/usr/sbin/cron -f
autostart=true
autorestart=true
priority=50
stdout_logfile=/app/logs/cron.log
stderr_logfile=/app/logs/cron-error.log
SUPERVISOR_EOF

    # Entrypoint script
    cat > "$PROJECT_DIR/scripts/entrypoint.sh" << 'ENTRYPOINT_EOF'
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
ENTRYPOINT_EOF

    # SSL Setup script
    cat > "$PROJECT_DIR/scripts/setup-ssl.sh" << 'SSL_SETUP_EOF'
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
SSL_SETUP_EOF

    # SSL Renewal script
    cat > "$PROJECT_DIR/scripts/renew-ssl.sh" << 'SSL_RENEW_EOF'
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
SSL_RENEW_EOF

    chmod +x "$PROJECT_DIR/scripts/"*.sh
    print_step "Created initialization scripts"
}

# =============================================================================
# Create Nginx Configurations
# =============================================================================

create_nginx_config() {
    print_info "Creating Nginx configurations..."

    mkdir -p "$PROJECT_DIR/nginx"

    # HTTP-only configuration
    cat > "$PROJECT_DIR/nginx/nginx-allinone.conf" << 'NGINX_EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /app/logs/nginx-error.log;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /app/logs/nginx-access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    server {
        listen 80;
        server_name _;

        root /var/www/html;
        index index.html;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/html;
        }

        # API requests -> Django
        location /api/ {
            proxy_pass http://127.0.0.1:8000;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_redirect off;
            proxy_buffering off;
            proxy_connect_timeout 300s;
            proxy_read_timeout 300s;
        }

        # Django admin (changed to /django-admin/ to avoid conflict with frontend /admin/ routes)
        location /django-admin/ {
            proxy_pass http://127.0.0.1:8000;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location /static/ {
            alias /var/www/static/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Media files
        location /media/ {
            alias /var/www/media/;
            expires 7d;
            add_header Cache-Control "public";
        }

        # Frontend assets
        location /assets/ {
            try_files $uri =404;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location = /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_EOF

    # SSL configuration
    cat > "$PROJECT_DIR/nginx/nginx-ssl.conf" << 'NGINX_SSL_EOF'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /app/logs/nginx-error.log;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';

    access_log /app/logs/nginx-access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

        # Let's Encrypt challenge
        location /.well-known/acme-challenge/ {
            root /var/www/html;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name DOMAIN_PLACEHOLDER www.DOMAIN_PLACEHOLDER;

        ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;

        root /var/www/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API requests -> Django
        location /api/ {
            proxy_pass http://127.0.0.1:8000;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_redirect off;
            proxy_buffering off;
            proxy_connect_timeout 300s;
            proxy_read_timeout 300s;
        }

        # Django admin (changed to /django-admin/ to avoid conflict with frontend /admin/ routes)
        location /django-admin/ {
            proxy_pass http://127.0.0.1:8000;
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
        }

        # Static files
        location /static/ {
            alias /var/www/static/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Media files
        location /media/ {
            alias /var/www/media/;
            expires 7d;
            add_header Cache-Control "public";
        }

        # Frontend assets
        location /assets/ {
            try_files $uri =404;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location = /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
NGINX_SSL_EOF

    print_step "Created Nginx configurations"
}

# =============================================================================
# Build Docker Image
# =============================================================================

build_docker_image() {
    print_header "Building Docker Image"

    print_info "This may take several minutes..."
    echo ""

    # Stop existing container if running
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_info "Stopping existing container..."
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME" 2>/dev/null || true
    fi

    # Build the image
    set +e
    docker build \
        -f "$PROJECT_DIR/Dockerfile.allinone" \
        -t "$IMAGE_NAME" \
        "$PROJECT_DIR" 2>&1 | tee "$PROJECT_DIR/build.log"
    BUILD_STATUS=${PIPESTATUS[0]}
    set -e

    if [ $BUILD_STATUS -ne 0 ]; then
        print_error "Docker build failed! Check build.log for details"
        exit 1
    fi
    print_step "Docker image built successfully"
}

# =============================================================================
# Run Container
# =============================================================================

run_container() {
    print_header "Starting Container"

    # Check if port 80 is in use
    if ss -tuln 2>/dev/null | grep -q ':80 '; then
        print_warning "Port 80 is in use. Attempting to free it..."
        sudo fuser -k 80/tcp 2>/dev/null || true
        sleep 2
    fi

    # Check if port 443 is in use (for SSL)
    if [ "$ENABLE_SSL" = true ]; then
        if ss -tuln 2>/dev/null | grep -q ':443 '; then
            print_warning "Port 443 is in use. Attempting to free it..."
            sudo fuser -k 443/tcp 2>/dev/null || true
            sleep 2
        fi
    fi

    # Create data directories
    mkdir -p "$PROJECT_DIR/data/postgres" "$PROJECT_DIR/data/redis" "$PROJECT_DIR/data/media" "$PROJECT_DIR/data/letsencrypt"

    # Determine CORS origins
    if [ "$ENABLE_SSL" = true ] && [ -n "$DOMAIN" ]; then
        CORS_ORIGINS="https://$DOMAIN,https://www.$DOMAIN,http://localhost"
        CORS_ALLOW_ALL="false"
        FRONTEND_URL="https://$DOMAIN"
    elif [ -n "$DOMAIN" ]; then
        CORS_ORIGINS="http://$DOMAIN,http://www.$DOMAIN,http://localhost"
        CORS_ALLOW_ALL="false"
        FRONTEND_URL="http://$DOMAIN"
    else
        # No domain - allow all origins for remote IP access
        CORS_ORIGINS="*"
        CORS_ALLOW_ALL="true"
        FRONTEND_URL="http://localhost"
    fi

    # Port mappings
    PORT_MAPPINGS="-p 80:80"
    if [ "$ENABLE_SSL" = true ]; then
        PORT_MAPPINGS="$PORT_MAPPINGS -p 443:443"
    fi

    # Run container
    docker run -d \
        --name "$CONTAINER_NAME" \
        --restart unless-stopped \
        $PORT_MAPPINGS \
        -v "$PROJECT_DIR/data/postgres:/app/data/postgres" \
        -v "$PROJECT_DIR/data/redis:/app/data/redis" \
        -v "$PROJECT_DIR/data/media:/var/www/media" \
        -v "$PROJECT_DIR/data/letsencrypt:/etc/letsencrypt" \
        -e POSTGRES_DB="$POSTGRES_DB" \
        -e POSTGRES_USER="$POSTGRES_USER" \
        -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
        -e SECRET_KEY="$SECRET_KEY" \
        -e ALLOWED_HOSTS="$ALLOWED_HOSTS" \
        -e CORS_ALLOWED_ORIGINS="$CORS_ORIGINS" \
        -e CORS_ALLOW_ALL="$CORS_ALLOW_ALL" \
        -e FRONTEND_URL="$FRONTEND_URL" \
        -e ADMIN_EMAIL="$ADMIN_EMAIL" \
        -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
        -e ADMIN_FIRST_NAME="$ADMIN_FIRST_NAME" \
        -e ADMIN_LAST_NAME="$ADMIN_LAST_NAME" \
        -e EMAIL_HOST="$EMAIL_HOST" \
        -e EMAIL_PORT="$EMAIL_PORT" \
        -e EMAIL_HOST_USER="$EMAIL_HOST_USER" \
        -e EMAIL_HOST_PASSWORD="$EMAIL_HOST_PASSWORD" \
        -e DEFAULT_FROM_EMAIL="$DEFAULT_FROM_EMAIL" \
        -e ENABLE_SSL="$ENABLE_SSL" \
        -e DOMAIN="$DOMAIN" \
        -e SSL_EMAIL="$SSL_EMAIL" \
        "$IMAGE_NAME"

    print_step "Container started"

    # Wait for services
    print_info "Waiting for services to initialize (up to 120 seconds)..."

    local max_attempts=120
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null | grep -q "200"; then
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    echo ""

    if [ $attempt -eq $max_attempts ]; then
        print_warning "Services may still be initializing. Check logs: docker logs $CONTAINER_NAME"
    else
        print_step "All services are running"
    fi
}

# =============================================================================
# Print Summary
# =============================================================================

print_summary() {
    print_header "Installation Complete!"

    # Determine access URL
    if [ "$ENABLE_SSL" = true ] && [ -n "$DOMAIN" ]; then
        ACCESS_URL="https://$DOMAIN"
    else
        ACCESS_URL="http://localhost"
    fi

    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  FondSmena Intranet Portal is now running!                     ${GREEN}║${NC}"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${CYAN}Access URL:${NC}        $ACCESS_URL"
    echo -e "${GREEN}║${NC}  ${CYAN}Admin Email:${NC}       $ADMIN_EMAIL"
    if [ "$AUTO_MODE" = true ]; then
    echo -e "${GREEN}║${NC}  ${CYAN}Admin Password:${NC}    $ADMIN_PASSWORD"
    echo -e "${GREEN}║${NC}  ${CYAN}DB Password:${NC}       $POSTGRES_PASSWORD"
    fi
    if [ "$ENABLE_SSL" = true ]; then
    echo -e "${GREEN}║${NC}  ${CYAN}SSL:${NC}               Enabled (auto-renewal configured)"
    fi
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}  ${YELLOW}Useful Commands:${NC}                                            ${GREEN}║${NC}"
    echo -e "${GREEN}║${NC}    View logs:       docker logs -f $CONTAINER_NAME"
    echo -e "${GREEN}║${NC}    Stop service:    docker stop $CONTAINER_NAME"
    echo -e "${GREEN}║${NC}    Start service:   docker start $CONTAINER_NAME"
    echo -e "${GREEN}║${NC}    Restart:         docker restart $CONTAINER_NAME"
    echo -e "${GREEN}║${NC}    Shell access:    docker exec -it $CONTAINER_NAME bash"
    echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Save credentials to file
    cat > "$PROJECT_DIR/credentials.txt" << EOF
FondSmena Intranet Portal Credentials
=====================================
Generated: $(date)

Access URL: $ACCESS_URL

Admin Email: $ADMIN_EMAIL
Admin Password: $ADMIN_PASSWORD

Database: $POSTGRES_DB
DB User: $POSTGRES_USER
DB Password: $POSTGRES_PASSWORD

Secret Key: $SECRET_KEY

SSL Enabled: $ENABLE_SSL
Domain: ${DOMAIN:-N/A}
EOF
    chmod 600 "$PROJECT_DIR/credentials.txt"
    print_info "Credentials saved to: $PROJECT_DIR/credentials.txt"
}

# =============================================================================
# Main
# =============================================================================

main() {
    clear
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}     ${BLUE}███████╗ ██████╗ ███╗   ██╗██████╗ ${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}     ${BLUE}██╔════╝██╔═══██╗████╗  ██║██╔══██╗${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}     ${BLUE}█████╗  ██║   ██║██╔██╗ ██║██║  ██║${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}     ${BLUE}██╔══╝  ██║   ██║██║╚██╗██║██║  ██║${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}     ${BLUE}██║     ╚██████╔╝██║ ╚████║██████╔╝${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}     ${BLUE}╚═╝      ╚═════╝ ╚═╝  ╚═══╝╚═════╝ ${NC}                       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}           ${GREEN}FondSmena Intranet Portal Installer${NC}                  ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                      ${YELLOW}Version 1.1.0${NC}                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                                ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    parse_args "$@"
    load_config
    check_requirements
    collect_configuration
    collect_admin_credentials
    create_env_file
    create_dockerfile
    create_scripts
    create_nginx_config
    build_docker_image
    run_container
    print_summary
}

# Run main function
main "$@"
