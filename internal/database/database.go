package database

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Service interface {
	Health() map[string]string
	GetDB() *mongo.Database
	GetCollection(name string) *mongo.Collection
}

type service struct {
	db *mongo.Client
}

func New() Service {

	if err := godotenv.Load(); err != nil {
		log.Println("[⚡️ Server]: .env file not found, using system environment variables")
	}

	dbUrl := os.Getenv("MONGODB_URL")

	log.Println("[⚡️ Server]:Connecting to MongoDB at", dbUrl)
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(dbUrl))

	if err != nil {
		log.Fatal(err)
	}

	s := &service{
		db: client,
	}

	// Create indexes on startup
	if err := s.CreateIndexes(); err != nil {
		log.Printf("Warning: Index creation failed: %v", err)
	}

	return s
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	err := s.db.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("[⚡️ Server]: MongoDB is down: %v", err)
	}

	return map[string]string{
		"message": "It's healthy",
	}
}

// GetDB returns the MongoDB database instance
func (s *service) GetDB() *mongo.Database {
	dbName := os.Getenv("MONGODB_DATABASE")
	if dbName == "" {
		dbName = "trakrlog" // default database name
	}
	return s.db.Database(dbName)
}

// GetCollection returns a specific collection from the database
func (s *service) GetCollection(name string) *mongo.Collection {
	return s.GetDB().Collection(name)
}
