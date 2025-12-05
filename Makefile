# Simple Makefile for a Go project

# Build the application
all: build test

build:
	@echo "Building frontend..."
	
	@npm run build --prefix ./frontend
	@echo "Building backend..."
	@go build -o main cmd/api/main.go
	@echo "Building... done."

# Run the application
run:
	@go run cmd/api/main.go 

# Run the application with environment variables from .env.local
run-local:
	@export $$(cat .env.local | grep -v '^#' | xargs) && go run cmd/api/main.go

# Run the local containerized application
docker-run:
	@sudo docker compose -f docker-compose.local.yml --env-file .env.local up --build

# Shutdown the local containerized application
docker-down:
	@sudo docker compose -f docker-compose.local.yml down

# Test the application
test:
	@echo "Testing..."
	@go test ./... -v

# Integration Tests (requires Docker)
itest:
	@echo "Running integration tests..."
	@go test ./internal/database -v

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
	@if command -v air > /dev/null; then \
            air; \
            echo "Watching...";\
        else \
            read -p "Go's 'air' is not installed on your machine. Do you want to install it? [Y/n] " choice; \
            if [ "$$choice" != "n" ] && [ "$$choice" != "N" ]; then \
                go install github.com/air-verse/air@latest; \
                air; \
                echo "Watching...";\
            else \
                echo "You chose not to install air. Exiting..."; \
                exit 1; \
            fi; \
        fi

.PHONY: all build run test clean watch docker-run docker-down itest
