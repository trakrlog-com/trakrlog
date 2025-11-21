package auth

import (
	"github.com/gin-gonic/gin"
	"trakrlog.com/go-backend/container"
)

func Routes(route *gin.Engine) {
	h := NewAuthHandler(container.App.Config)

	auth := route.Group("/auth")
	{
		auth.GET("google", h.SignupWithGoogle)
		auth.GET("google/callback", h.HandleGoogleAuth)
		auth.GET("is-auth", h.GetAuthUser)
		auth.GET("login/failed", h.HandleUnauthorized)

	}

}
