#!/bin/bash
# Development script

echo "🚀 Starting development server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start in development mode
npm run dev
