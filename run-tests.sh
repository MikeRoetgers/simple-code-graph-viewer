#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

# Install coverage provider if not already present
if ! npm ls @vitest/coverage-v8 >/dev/null 2>&1; then
  echo "Installing @vitest/coverage-v8..."
  npm install --save-dev @vitest/coverage-v8@^4.0.0
fi

# Run tests with LCOV coverage output
npx vitest run --coverage --coverage.reporter=lcov --coverage.reportsDirectory=coverage

echo ""
echo "Coverage report written to coverage/lcov.info"
