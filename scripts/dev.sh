#!/bin/bash

# Development script for Copilot MCP Server
set -e

echo "🚀 Starting development environment..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the project
echo "🏗️  Building project..."
npm run build

# Start in development mode
echo "🔄 Starting development server..."
npm run dev