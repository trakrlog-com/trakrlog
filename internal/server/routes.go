package server

import (
	"net/http"
	"os"
	"time"

	"trakrlog/internal/auth"
	"trakrlog/internal/handler"
	"trakrlog/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
)

func (s *Server) RegisterRouter() http.Handler {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4000", "https://trakrlog.com", "https://www.trakrlog.com", "https://api.trakrlog.com"}, // Add your frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-API-KEY"},
		AllowCredentials: true, // Enable cookies/auth
	}))

	sessionSectret := os.Getenv("SESSION_SECRET")
	if sessionSectret == "" {
		panic("[⚡️ Server]: SESSION_SECRET environment variable is not set")
	}

	s.setupGoth(sessionSectret)

	googleHandler := auth.NewGoogleHandler(sessionSectret, s.userService)
	githubHandler := auth.NewGitHubHandler(sessionSectret, s.userService)
	authGroup := router.Group("/auth")
	{
		// Google OAuth
		authGroup.GET("google", googleHandler.Signup)
		authGroup.GET("google/callback", googleHandler.HandleCallback)

		// GitHub OAuth
		authGroup.GET("github", githubHandler.Signup)
		authGroup.GET("github/callback", githubHandler.HandleCallback)

		// Common auth endpoints
		authGroup.GET("is-auth", googleHandler.GetAuthUser)
		authGroup.GET("login/failed", googleHandler.HandleUnauthorized)
	}

	// API routes - protected by authentication
	api := router.Group("/api")
	api.Use(middleware.RequireAuth(sessionSectret))
	{
		// User/Profile routes
		userHandler := handler.NewUserHandler(s.userService)
		api.GET("/user/providers", userHandler.GetLinkedProviders)
		api.DELETE("/user/providers/:provider", userHandler.UnlinkProvider)

		// Project routes
		projectHandler := handler.NewProjectHandler(s.projectService)
		api.GET("/projects", projectHandler.GetProjects)
		api.POST("/projects", projectHandler.CreateProject)
		api.GET("/projects/:projectId", projectHandler.GetProject)
		api.PATCH("/projects/:projectId", projectHandler.UpdateProject)
		api.DELETE("/projects/:projectId", projectHandler.DeleteProject)

		// Channel routes
		channelHandler := handler.NewChannelHandler(s.channelService)
		api.POST("/projects/:projectId/channels", channelHandler.CreateChannel)
		api.GET("/projects/:projectId/channels", channelHandler.GetProjectChannels)
		api.GET("/channels", channelHandler.GetAllChannels)
		api.GET("/channels/:channelId", channelHandler.GetChannel)
		api.PATCH("/channels/:channelId", channelHandler.UpdateChannel)
		api.DELETE("/channels/:channelId", channelHandler.DeleteChannel)

		// Event routes
		eventHandler := handler.NewEventHandler(s.eventService)
		api.GET("/channels/:channelId/events", eventHandler.GetChannelEvents)
		api.GET("/projects/:projectId/events", eventHandler.GetProjectEvents)
		api.GET("/events/:id", eventHandler.GetEvent)
		api.PATCH("/events/:id", eventHandler.UpdateEvent)
		api.DELETE("/events/:id", eventHandler.DeleteEvent)

		// Notification routes
		notificationHandler := handler.NewNotificationHandler(
			s.subscriptionService,
			s.notificationService,
			s.pushService,
		)
		api.POST("/notifications/subscriptions", notificationHandler.CreateSubscription)
		api.GET("/notifications/subscriptions", notificationHandler.GetSubscriptions)
		api.DELETE("/notifications/subscriptions/:id", notificationHandler.DeleteSubscription)
		api.PATCH("/notifications/subscriptions/:id", notificationHandler.UpdateSubscription)
		api.POST("/notifications/test", notificationHandler.SendTestNotification)
		api.GET("/notifications/logs", notificationHandler.GetNotificationLogs)
	}

	// Track endpoint - direct route to avoid trailing slash redirects
	trackEventHandler := handler.NewEventHandler(s.eventService)
	router.POST("/track", middleware.RequireAuthApiKey(s.userService), trackEventHandler.CreateEvent)

	// Legacy endpoint - keeping for backwards compatibility
	router.POST("/api/track", middleware.RequireAuthApiKey(s.userService), trackEventHandler.CreateEvent)

	// Dashboard routes
	dashboard := router.Group("/dashboard")
	dashboard.Use(middleware.RequireAuth(sessionSectret))
	dashboard.GET("/*any", func(c *gin.Context) {
		c.File("frontend/dist/index.html")
	})

	// Static files and SPA fallback
	router.Use(static.Serve("/", static.LocalFile("frontend/dist", true)))
	router.NoRoute(func(c *gin.Context) {
		c.File("frontend/dist/index.html")
	})

	return router
}

func (s *Server) setupGoth(sessionSecret string) {
	store := sessions.NewCookieStore([]byte(sessionSecret))
	store.MaxAge(int(12 * time.Hour / time.Second))
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = os.Getenv("APP_ENV") == "production"
	// store.Options.SameSite = http.SameSiteLaxMode // helps prevent CSRF

	gothic.Store = store

	goth.UseProviders(
		google.New(
			os.Getenv("GOOGLE_CLIENT_ID"),
			os.Getenv("GOOGLE_CLIENT_SECRET"),
			os.Getenv("GOOGLE_CALLBACK_URL"),
			"email", "profile",
		),
		github.New(
			os.Getenv("GITHUB_CLIENT_ID"),
			os.Getenv("GITHUB_CLIENT_SECRET"),
			os.Getenv("GITHUB_CALLBACK_URL"),
			"user:email",
		),
	)
}
