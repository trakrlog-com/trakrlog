package server

import (
	"net/http"
	"os"
	"time"

	"trakrlog/internal/auth"
	"trakrlog/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/sessions"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/google"
)

func (s *Server) RegisterRouter() http.Handler {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4000", "https://trakrlog.com", "https://www.trakrlog.com"}, // Add your frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true, // Enable cookies/auth
	}))

	sessionSectret := os.Getenv("SESSION_SECRET")
	if sessionSectret == "" {
		panic("SESSION_SECRET environment variable is not set")
	}

	s.setupGoth(sessionSectret)

	googleHandler := auth.NewGoogleHandler(sessionSectret, s.userService)
	authGroup := router.Group("/auth")
	authGroup.GET("google", googleHandler.Signup)
	authGroup.GET("google/callback", googleHandler.HandleCallback)
	authGroup.GET("is-auth", googleHandler.GetAuthUser)
	authGroup.GET("login/failed", googleHandler.HandleUnauthorized)

	// Serve static files from the React app build directory
	router.Use(static.Serve("/", static.LocalFile("frontend/dist", true)))

	// The dashboard routes
	dashboard := router.Group("/dashboard")
	dashboard.Use(middleware.RequireAuth(sessionSectret))
	dashboard.GET("/*any", func(c *gin.Context) {
		c.File("frontend/dist/index.html")
	})

	// Serve React app for client-side routes (SPA fallback) - only for non-dashboard routes
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
		// github.New(
		// 	os.Getenv("GITHUB_CLIENT_ID"),
		// 	os.Getenv("GITHUB_CLIENT_SECRET"),
		// 	os.Getenv("GITHUB_CALLBACK_URL"),
		// ),
	)
}
