package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

func RequireAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// gets the user session from the request
		_, err := gothic.Store.Get(ctx.Request, "your-session-key")
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Unauthorized User",
				"error":   err.Error(),
			})
			return
		}

		// calls the next middleware or handler
		ctx.Next()
	}
}
