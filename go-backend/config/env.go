package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	SessionSecret      string
	GoogleClientID     string
	GoogleClientSecret string
	CallbackURL        string
	MongoDBURL         string
}

// LoadEnv reads .env file and returns a Config object
func LoadEnv() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		return nil, err
	}

	cfg := &Config{
		SessionSecret:      os.Getenv("SESSION_SECRET"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		CallbackURL:        os.Getenv("CALLBACK_URL"),
		MongoDBURL:         os.Getenv("MONGODB_URL"),
	}

	// Set default callback URL if not provided
	if cfg.CallbackURL == "" {
		cfg.CallbackURL = "http://localhost:4000/auth/google/callback"
	}

	// Validate required fields
	if cfg.SessionSecret == "" {
		return nil, fmt.Errorf("SESSION_SECRET is required")
	}
	if cfg.GoogleClientID == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_ID is required")
	}
	if cfg.GoogleClientSecret == "" {
		return nil, fmt.Errorf("GOOGLE_CLIENT_SECRET is required")
	}
	if cfg.MongoDBURL == "" {
		return nil, fmt.Errorf("MONGODB_URL is required")
	}

	return cfg, nil
}
