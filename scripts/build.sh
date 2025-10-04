#!/bin/bash
# Build script for the Electron app

echo "🔨 Building Electron application..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the build
echo "🏗️ Creating distributable..."
npm run build

echo "✅ Build completed! Check the 'dist' folder for output."
