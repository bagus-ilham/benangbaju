#!/bin/bash
echo "Installing dependencies..."
npm ci

echo "Resetting database..."
npm run db:reset

echo "Generating TypeScript types..."
npm run db:types

echo "Setup complete! You can now run 'npm run dev'."
