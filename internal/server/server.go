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
	"trakrlog/internal/repository"
	"trakrlog/internal/service"
)

type Server struct {
	port           int
	db             database.Service
	userService    *service.UserService
	projectService *service.ProjectService
	channelService *service.ChannelService
}

func New() *http.Server {
	// Load .env file explicitly
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
		panic(err)
	}

	port, _ := strconv.Atoi(os.Getenv("PORT"))
	log.Printf("Starting server on port %d\n", port)

	// Initialize database
	db := database.New()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	channelRepo := repository.NewChannelRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	projectService := service.NewProjectService(projectRepo, userRepo)
	channelService := service.NewChannelService(channelRepo, projectRepo)

	NewServer := &Server{
		port:           port,
		db:             db,
		userService:    userService,
		projectService: projectService,
		channelService: channelService,
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
	log.Printf("Database health check: %v\n", healthRes)

	return server
}
