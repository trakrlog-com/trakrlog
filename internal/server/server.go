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
	port                int
	db                  database.Service
	userService         *service.UserService
	projectService      *service.ProjectService
	channelService      *service.ChannelService
	eventService        *service.EventService
	subscriptionService *service.SubscriptionService
	notificationService *service.NotificationService
	pushService         *service.PushService
	vapidConfig         *VapidConfig
}

func New() *http.Server {
	// Load .env file explicitly (optional in Docker)
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	port, _ := strconv.Atoi(os.Getenv("PORT"))
	log.Printf("[⚡️ Server]: Starting server on port %d\n", port)

	// Load VAPID configuration
	vapidConfig := LoadVapidConfig()

	// Initialize database
	db := database.New()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	projectRepo := repository.NewProjectRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	eventRepo := repository.NewEventRepository(db)
	subscriptionRepo := repository.NewNotificationSubscriptionRepository(db)
	logRepo := repository.NewNotificationLogRepository(db)

	// Initialize services
	userService := service.NewUserService(userRepo)
	projectService := service.NewProjectService(projectRepo, userRepo)
	channelService := service.NewChannelService(channelRepo, projectRepo)
	eventService := service.NewEventService(eventRepo, channelRepo, projectRepo)

	// Initialize subscription service
	subscriptionService := service.NewSubscriptionService(subscriptionRepo)

	// Initialize push notification service
	pushService := service.NewPushService(
		subscriptionRepo,
		logRepo,
		vapidConfig.PublicKey,
		vapidConfig.PrivateKey,
		vapidConfig.Subject,
	)

	// Initialize notification service
	notificationService := service.NewNotificationService(
		pushService,
		projectService,
		channelService,
	)

	NewServer := &Server{
		port:                port,
		db:                  db,
		userService:         userService,
		projectService:      projectService,
		channelService:      channelService,
		eventService:        eventService,
		subscriptionService: subscriptionService,
		notificationService: notificationService,
		pushService:         pushService,
		vapidConfig:         vapidConfig,
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
	log.Printf("[⚡️ Server]: Database health check: %v\n", healthRes["message"])

	return server
}
