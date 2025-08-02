#!/bin/bash

# Install Fuse.js for advanced search functionality
echo "Installing Fuse.js for advanced search..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install Fuse.js
npm install fuse.js

# Install TypeScript types if available
npm install --save-dev @types/fuse.js 2>/dev/null || echo "TypeScript types for Fuse.js not available, using built-in types"

echo "Fuse.js installation completed!"
echo ""
echo "You can now use the advanced search features:"
echo "- Fuzzy search with Fuse.js"
echo "- Autocomplete suggestions"
echo "- Content recommendations"
echo "- Search analytics"
echo ""
echo "Visit /advanced-search to try the new features!"