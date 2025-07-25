#!/bin/bash
echo "=== Security Monitor ==="
echo "Checking for suspicious activity..."
echo ""
echo "Recent 404s (potential scans):"
pm2 logs omega-studio --nostream --lines 1000 | grep "404 Request" | tail -10
echo ""
echo "Blocked security scans:"
pm2 logs omega-studio --nostream --lines 1000 | grep "Security scan blocked" | tail -10
