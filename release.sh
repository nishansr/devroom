#!/bin/bash

# DevRoom Release Script
# Usage: ./release.sh [patch|minor|major]

set -e

# Check if version type is provided
VERSION_TYPE=${1:-patch}

echo "📦 Starting release process..."

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Bump version
echo "Bumping $VERSION_TYPE version..."
npm version $VERSION_TYPE --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "New version: $NEW_VERSION"

# Build the extension
echo "🔨 Building extension..."
npm run build

# Commit changes
echo "📝 Committing changes..."
git add package.json package-lock.json
git commit -m "chore: bump version to $NEW_VERSION"

# Create and push tag
echo "🏷️  Creating tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"

echo "⬆️  Pushing to GitHub..."
git push origin main
git push origin "v$NEW_VERSION"

echo "✅ Release v$NEW_VERSION created!"
echo "GitHub Actions will automatically build and publish the release."
echo "Check: https://github.com/nishansr/devroom/actions"
