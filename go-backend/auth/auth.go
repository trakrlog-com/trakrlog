package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Routes(route *gin.Engine) {
	auth := route.Group("/auth")
	{
		auth.GET("/login", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "GET auth login"})
		})
		auth.POST("/login", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "POST auth login"})
		})
	}
}
