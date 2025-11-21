package container

import (
	"trakrlog.com/go-backend/config"
)

// Container holds all application dependencies
type Container struct {
	Config *config.Config
}

var App *Container

// New creates and initializes the container with all dependencies
func New(cfg *config.Config) *Container {
	App = &Container{
		Config: cfg,
	}
	return App
}
