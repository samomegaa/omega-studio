#!/bin/bash

# Backup script for Omega Studio
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/omega_backup_$DATE"
PROJECT_DIR="/var/www/omega-studio"

echo "Starting Omega Studio backup - $DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# 1. Backup database
echo "Backing up database..."
sudo -u postgres pg_dump omega_studio_prod > $BACKUP_DIR/database_backup.sql

# 2. Backup environment files
echo "Backing up environment files..."
cp $PROJECT_DIR/.env $BACKUP_DIR/
cp $PROJECT_DIR/client/.env $BACKUP_DIR/client_env

# 3. Backup nginx configuration
echo "Backing up nginx configuration..."
mkdir -p $BACKUP_DIR/nginx
sudo cp /etc/nginx/sites-available/omega-studio $BACKUP_DIR/nginx/
sudo cp /etc/nginx/nginx.conf $BACKUP_DIR/nginx/

# 4. Backup PM2 configuration
echo "Backing up PM2 configuration..."
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_dump.pm2

# 5. Create a system info file
echo "Creating system info file..."
cat > $BACKUP_DIR/system_info.txt << EOF
Backup Date: $DATE
Node Version: $(node -v)
NPM Version: $(npm -v)
PM2 Version: $(pm2 -v)
Nginx Version: $(nginx -v 2>&1)
PostgreSQL Version: $(sudo -u postgres psql --version)
OS Info: $(lsb_release -a 2>/dev/null || cat /etc/os-release)
EOF

# 6. List of installed npm packages
echo "Saving package lists..."
cd $PROJECT_DIR && npm list --depth=0 > $BACKUP_DIR/npm_packages.txt
cd $PROJECT_DIR/client && npm list --depth=0 > $BACKUP_DIR/client_npm_packages.txt

# 7. Create archive
echo "Creating backup archive..."
cd /tmp
tar -czf omega_backup_$DATE.tar.gz omega_backup_$DATE/

echo "Backup completed: /tmp/omega_backup_$DATE.tar.gz"
echo "Size: $(du -h /tmp/omega_backup_$DATE.tar.gz | cut -f1)"

# Cleanup
rm -rf $BACKUP_DIR
