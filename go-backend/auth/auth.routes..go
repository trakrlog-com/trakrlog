package auth

import (
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/handlers"
)

func Routes(route *gin.Engine, appHandler *handlers.AppHandler) {
	h := NewHandler(appHandler.Config)

	auth := route.Group("/auth")
	{
		auth.GET("google", h.SignupWithGoogle)
		auth.GET("google/callback", h.HandleGoogleAuth)
		auth.GET("is-auth", h.GetAuthUser)
		auth.GET("login/failed", h.HandleUnauthorized)
	}
}
