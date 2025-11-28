package server

import (
	"fmt"
	"net/http"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"trakrlog/internal/database"
)

type Server struct {
	port int

	db database.Service
}

func NewServer() *http.Server {
	port := 4000 // strconv.Atoi(os.Getenv("PORT"))
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

	return server
}
