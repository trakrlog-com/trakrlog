package handler

import (
	"net/http"

	"trakrlog/internal/middleware"
	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// GetLinkedProviders returns list of OAuth providers linked to user
func (h *UserHandler) GetLinkedProviders(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	providers, err := h.userService.GetLinkedProviders(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to get linked providers",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    providers,
	})
}

// UnlinkProvider removes an OAuth provider from user account
func (h *UserHandler) UnlinkProvider(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	providerName := ctx.Param("provider")
	if providerName == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Provider name required",
		})
		return
	}

	if err := h.userService.UnlinkProvider(ctx.Request.Context(), userID, providerName); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Failed to unlink provider",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Provider unlinked successfully",
	})
}
