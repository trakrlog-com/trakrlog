package database

import (
	"context"
	"log"
	"os"
	"testing"

	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/mongodb"
)

func mustStartMongoContainer() (func(context.Context, ...testcontainers.TerminateOption) error, string, error) {
	dbContainer, err := mongodb.Run(context.Background(), "mongo:7")
	if err != nil {
		return nil, "", err
	}

	dbHost, err := dbContainer.Host(context.Background())
	if err != nil {
		return dbContainer.Terminate, "", err
	}

	dbPort, err := dbContainer.MappedPort(context.Background(), "27017/tcp")
	if err != nil {
		return dbContainer.Terminate, "", err
	}

	dbUrl := "mongodb://" + dbHost + ":" + dbPort.Port()

	return dbContainer.Terminate, dbUrl, nil
}

func TestMain(m *testing.M) {
	// Skip tests if running in environment without Docker access
	if os.Getenv("SKIP_DOCKER_TESTS") != "" {
		log.Println("Skipping database tests (SKIP_DOCKER_TESTS is set)")
		os.Exit(0)
	}

	teardown, mongoURL, err := mustStartMongoContainer()
	if err != nil {
		log.Fatalf("could not start mongodb container: %v", err)
	}

	// Set environment variables for tests
	os.Setenv("MONGODB_URL", mongoURL)
	os.Setenv("MONGODB_DATABASE", "test_db")

	exitCode := m.Run()

	if teardown != nil {
		if err := teardown(context.Background()); err != nil {
			log.Fatalf("could not teardown mongodb container: %v", err)
		}
	}

	os.Exit(exitCode)
}

func TestNew(t *testing.T) {
	srv := New()
	if srv == nil {
		t.Fatal("New() returned nil")
	}
}

func TestHealth(t *testing.T) {
	srv := New()

	stats := srv.Health()

	if stats["message"] != "It's healthy" {
		t.Fatalf("expected message to be 'It's healthy', got %s", stats["message"])
	}
}
