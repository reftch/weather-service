.PHONY: dev build
.SILENT:

dev:
	$(MAKE) -j2 api web

api:
	cd apps/api && PORT=8083 cargo watch -x run

api-build:
	cd apps/api && cargo build --release

web:
	@if [ ! -d apps/web/node_modules ]; then \
		echo "Installing web dependencies..."; \
		cd apps/web && bun install; \
	fi
	cd apps/web && bun run dev

web-build:
	@if [ ! -d apps/web/node_modules ]; then \
		echo "Installing web dependencies..."; \
		cd apps/web && bun install; \
	fi
	cd apps/web && bun run build

web-install:
	cd apps/web && bun install


build:
	$(MAKE) -j2 web-build api-build
	mkdir -p build && cp -r apps/api/target/release/weather-service build/ && cp -r apps/api/assets build/

clean:
	rm -rf apps/api/assets/ui
	rm -rf apps/api/target
	rm -rf apps/web/node_modules
	rm -rf build
