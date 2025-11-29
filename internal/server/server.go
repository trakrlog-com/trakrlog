package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"

	"trakrlog/internal/database"
)

type Server struct {
	port int

	db database.Service
}

func NewServer() *http.Server {
	// Load .env file explicitly
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
		panic(err)
	}

	port, _ := strconv.Atoi(os.Getenv("PORT"))
	fmt.Printf("Starting server on port %d\n", port)
	NewServer := &Server{
		port: port,

		db: database.New(),
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", NewServer.port),
		Handler:      NewServer.RegisterRouter(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	healthRes := NewServer.db.Health()
	fmt.Printf("Database health check: %v\n", healthRes)

	return server
}
