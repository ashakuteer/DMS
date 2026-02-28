#!/bin/bash

# Pre-deployment Checklist Script
# Run this before deploying to catch common issues

echo "🔍 Running pre-deployment checks..."
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "❌ Git not initialized. Run: git init"
    exit 1
else
    echo "✅ Git initialized"
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "⚠️  node_modules not found. Run: npm install"
else
    echo "✅ Dependencies installed"
fi

# Check if .env.example files exist
if [ -f apps/api/.env.example ]; then
    echo "✅ API .env.example exists"
else
    echo "❌ apps/api/.env.example missing"
fi

if [ -f apps/web/.env.example ]; then
    echo "✅ Web .env.example exists"
else
    echo "❌ apps/web/.env.example missing"
fi

# Check if Dockerfile exists
if [ -f apps/api/Dockerfile ]; then
    echo "✅ API Dockerfile exists"
else
    echo "❌ apps/api/Dockerfile missing"
fi

# Check if railway.json exists
if [ -f railway.json ]; then
    echo "✅ railway.json exists"
else
    echo "❌ railway.json missing"
fi

# Check if vercel.json exists
if [ -f vercel.json ]; then
    echo "✅ vercel.json exists"
else
    echo "❌ vercel.json missing"
fi

# Check if Prisma schema exists
if [ -f apps/api/prisma/schema.prisma ]; then
    echo "✅ Prisma schema exists"
else
    echo "❌ Prisma schema missing"
fi

# Check package.json scripts
if grep -q "\"build\"" apps/api/package.json; then
    echo "✅ API build script exists"
else
    echo "❌ API build script missing"
fi

if grep -q "\"build\"" apps/web/package.json; then
    echo "✅ Web build script exists"
else
    echo "❌ Web build script missing"
fi

echo ""
echo "📋 Pre-deployment checklist:"
echo ""
echo "Before deploying, ensure you have:"
echo "  [ ] Created a GitHub repository"
echo "  [ ] Pushed your code to GitHub"
echo "  [ ] Created accounts on Railway and Vercel"
echo "  [ ] Generated strong JWT secrets"
echo "  [ ] Reviewed environment variables"
echo ""
echo "Ready to deploy? Follow QUICK_START.md"
