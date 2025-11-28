package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
	"trakrlog.com/go-backend/auth"
	"trakrlog.com/go-backend/config"
	"trakrlog.com/go-backend/db"
	"trakrlog.com/go-backend/handlers"
)

func main() {

	// Load configuration from .env file
	cfg, err := config.LoadEnv()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize dependency container
	client, err := db.ConnectMongoDb(cfg.MongoDBURL)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	appHandler := handlers.NewAppHandler(cfg, client)

	var router *gin.Engine = gin.Default()

	store := sessions.NewCookieStore([]byte(appHandler.Config.SessionSecret))
	// Configure session options
	store.MaxAge(int(12 * time.Hour / time.Second)) // session expiration time
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = false                  // set to true in production (HTTPS)
	store.Options.SameSite = http.SameSiteLaxMode // helps prevent CSRF

	// Assign the store to Gothic
	gothic.Store = store

	// Register Google as an authentication provider
	goth.UseProviders(
		google.New(
			appHandler.Config.GoogleClientID,
			appHandler.Config.GoogleClientSecret,
			appHandler.Config.CallbackURL,
		),
	)

	auth.Routes(router, appHandler)

	// dashboard should use the RequireAuth middleware
	dashboard := router.Group("/dashboard")
	dashboard.Use(auth.RequireAuth())
	dashboard.GET("/*any", func(c *gin.Context) {
		c.File("../apps/frontend/dist/index.html")
	})

	// Serve static files
	router.Use(static.Serve("/", static.LocalFile("../apps/frontend/dist", true)))

	// Serve React app for client-side routes (SPA fallback) - only for non-dashboard routes
	router.NoRoute(func(c *gin.Context) {
		c.File("../apps/frontend/dist/index.html")
	})

	router.Run("localhost:4000")

}
