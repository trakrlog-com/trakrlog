package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"
	"trakrlog/internal/server"

	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func gracefulShutdown(apiServer *http.Server, done chan bool) {
	// Create context that listens for the interrupt signal from the OS.
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Listen for the interrupt signal.
	<-ctx.Done()

	log.Println("shutting down gracefully, press Ctrl+C again to force")
	stop() // Allow Ctrl+C to force shutdown

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := apiServer.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown with error: %v", err)
	}

	log.Println("Server exiting")

	// Notify the main goroutine that the shutdown is complete
	done <- true
}

func main() {

	server := server.NewServer()

	// store := sessions.NewCookieStore([]byte(appHandler.Config.SessionSecret))
	// // Configure session options
	// store.MaxAge(int(12 * time.Hour / time.Second)) // session expiration time
	// store.Options.Path = "/"
	// store.Options.HttpOnly = true
	// store.Options.Secure = false                  // set to true in production (HTTPS)
	// store.Options.SameSite = http.SameSiteLaxMode // helps prevent CSRF

	// Serve static files
	var router = server.Handler.(*gin.Engine)
	router.Use(static.Serve("/", static.LocalFile("../apps/frontend/dist", true)))

	// Serve React app for client-side routes (SPA fallback) - only for non-dashboard routes
	router.NoRoute(func(c *gin.Context) {
		c.File("../apps/frontend/dist/index.html")
	})

	// Create a done channel to signal when the shutdown is complete
	done := make(chan bool, 1)

	// Run graceful shutdown in a separate goroutine
	go gracefulShutdown(server, done)

	// Start the server
	log.Println("Starting server on localhost:4000")
	err := server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		panic(fmt.Sprintf("http server error: %s", err))
	}

	// Wait for the graceful shutdown to complete
	<-done
	log.Println("Graceful shutdown complete.")
}
