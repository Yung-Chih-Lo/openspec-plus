.PHONY: verify backend-test frontend-build

verify: backend-test frontend-build

backend-test:
	cd apps/api && uv run pytest -q

frontend-build:
	cd apps/web && pnpm run build
