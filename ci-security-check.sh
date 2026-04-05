#!/bin/bash
# Security Audit Script for CI/CD

set -e

echo "════════════════════════════════════════"
echo "SECURITY AUDIT - Production Build"
echo "════════════════════════════════════════"

cd client

echo ""
echo "Step 1: Installing production dependencies only..."
npm ci --omit=dev

echo ""
echo "Step 2: Auditing production dependencies..."
if npm audit --omit=dev; then
    echo "✅ Production audit PASSED - 0 vulnerabilities"
else
    echo "❌ Production audit FAILED"
    exit 1
fi

echo ""
echo "Step 3: Running build..."
npm run build

echo ""
echo "════════════════════════════════════════"
echo "✅ ALL SECURITY CHECKS PASSED"
echo "════════════════════════════════════════"
echo ""
echo "Safe to deploy!"
