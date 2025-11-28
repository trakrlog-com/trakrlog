package server

import (
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func (s *Server) RegisterRouter() http.Handler {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4000", "https://trakrlog.com", "https://www.trakrlog.com"}, // Add your frontend URL
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true, // Enable cookies/auth
	}))

	// Serve static files from the React app build directory
	router.Use(static.Serve("/", static.LocalFile("frontend/dist", true)))

	// Serve React app for client-side routes (SPA fallback) - only for non-dashboard routes
	router.NoRoute(func(c *gin.Context) {
		c.File("frontend/dist/index.html")
	})

	return router
}

// func (s *Server) HelloWorldHandler(c *gin.Context) {
// 	resp := make(map[string]string)
// 	resp["message"] = "Hello World"

// 	c.JSON(http.StatusOK, resp)
// }
