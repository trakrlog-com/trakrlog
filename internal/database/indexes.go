package database

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// CreateIndexes creates all necessary database indexes
func (s *service) CreateIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	db := s.GetDB()

	// Users collection indexes
	usersCollection := db.Collection("users")

	// Index on email (unique)
	emailIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	// Compound index on provider name + provider ID (unique, sparse)
	providerIndex := mongo.IndexModel{
		Keys: bson.D{
			{Key: "providers.name", Value: 1},
			{Key: "providers.provider_id", Value: 1},
		},
		Options: options.Index().SetUnique(true).SetSparse(true),
	}

	// API key index for fast lookups
	apiKeyIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "api_keys.key", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	if _, err := usersCollection.Indexes().CreateMany(ctx, []mongo.IndexModel{
		emailIndex,
		providerIndex,
		apiKeyIndex,
	}); err != nil {
		log.Printf("Warning: Failed to create user indexes: %v", err)
		return err
	}

	// Projects collection indexes
	projectsCollection := db.Collection("projects")
	projectUserIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "user_id", Value: 1}},
	}

	if _, err := projectsCollection.Indexes().CreateOne(ctx, projectUserIndex); err != nil {
		log.Printf("Warning: Failed to create project indexes: %v", err)
		return err
	}

	// Channels collection indexes
	channelsCollection := db.Collection("channels")
	channelProjectIndex := mongo.IndexModel{
		Keys: bson.D{{Key: "project_id", Value: 1}},
	}

	if _, err := channelsCollection.Indexes().CreateOne(ctx, channelProjectIndex); err != nil {
		log.Printf("Warning: Failed to create channel indexes: %v", err)
		return err
	}

	// Events collection indexes
	eventsCollection := db.Collection("events")
	eventIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "channel_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "project_id", Value: 1},
				{Key: "created_at", Value: -1},
			},
		},
	}

	if _, err := eventsCollection.Indexes().CreateMany(ctx, eventIndexes); err != nil {
		log.Printf("Warning: Failed to create event indexes: %v", err)
		return err
	}

	log.Println("[⚡️ Database]: All indexes created successfully")
	return nil
}
