package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/markbates/goth/gothic"
)

// RequireAuth is a middleware that checks if the user is authenticated
func RequireAuth(sessionSecret string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		// Retrieve the session
		session, err := gothic.Store.Get(ctx.Request, sessionSecret)
		if err != nil {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid session",
			})
			return
		}

		// Check if user_id exists in session
		userID, ok := session.Values["user_id"].(string)
		if !ok || userID == "" {
			ctx.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Not authenticated",
			})
			return
		}

		// Store user_id in context for use in handlers
		ctx.Set("user_id", userID)

		// Continue to next handler
		ctx.Next()
	}
}

// GetAuthUserID extracts the authenticated user ID from the Gin context
// Should only be called after RequireAuth middleware
func GetAuthUserID(ctx *gin.Context) (string, bool) {
	userID, exists := ctx.Get("user_id")
	if !exists {
		return "", false
	}

	userIDStr, ok := userID.(string)
	return userIDStr, ok
}
