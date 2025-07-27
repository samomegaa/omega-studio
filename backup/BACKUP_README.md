# Omega Studio Backup Guide

## Backup Contents
- Database dump (PostgreSQL)
- Environment variables (.env files)
- Nginx configuration
- PM2 configuration
- System information
- NPM package lists

## Restore Instructions

### 1. Database
```bash
sudo -u postgres psql omega_studio_prod < database_backup.sql
