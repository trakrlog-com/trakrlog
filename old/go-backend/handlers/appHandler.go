package handlers

import (
	"go.mongodb.org/mongo-driver/mongo"
	"trakrlog.com/go-backend/config"
)

// Container holds all application dependencies
type AppHandler struct {
	Config   *config.Config
	DbClient *mongo.Client
}

// New creates and initializes the container with all dependencies
func NewAppHandler(cfg *config.Config, dbClient *mongo.Client) *AppHandler {
	App := &AppHandler{
		Config:   cfg,
		DbClient: dbClient,
	}
	return App
}
