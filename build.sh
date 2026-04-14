#!/usr/bin/env bash
set -e

# Install Python dependencies
pip install -r requirements.txt

# Build React frontend
cd frontend
npm ci
CI=false npm run build
cd ..

# Move build to where Flask expects it
cp -r frontend/build ./build
