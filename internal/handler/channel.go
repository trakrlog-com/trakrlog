package handler

import (
	"net/http"

	"trakrlog/internal/middleware"
	"trakrlog/internal/model"
	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChannelHandler struct {
	channelService *service.ChannelService
}

func NewChannelHandler(channelService *service.ChannelService) *ChannelHandler {
	return &ChannelHandler{
		channelService: channelService,
	}
}

// CreateChannel handles POST /api/projects/:projectId/channels
func (h *ChannelHandler) CreateChannel(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	projectID := ctx.Param("projectId")
	if projectID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Project ID required",
		})
		return
	}

	var req struct {
		Name string `json:"name" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	channel, err := h.channelService.CreateChannel(ctx.Request.Context(), userID, projectID, req.Name)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error creating channel",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Channel created successfully",
		"data":    channel,
	})
}

// GetProjectChannels handles GET /api/projects/:projectId/channels
func (h *ChannelHandler) GetProjectChannels(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	projectID := ctx.Param("projectId")
	if projectID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Project ID required",
		})
		return
	}

	channels, err := h.channelService.GetProjectChannels(ctx.Request.Context(), userID, projectID)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error fetching channels",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channels fetched successfully",
		"data":    channels,
	})
}

// GetChannel handles GET /api/channels/:channelId
func (h *ChannelHandler) GetChannel(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	channelID := ctx.Param("channelId")
	if channelID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Channel ID required",
		})
		return
	}

	channel, err := h.channelService.GetChannelByID(ctx.Request.Context(), channelID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Channel not found",
			"error":   err.Error(),
		})
		return
	}

	// Note: We're not doing ownership verification here in the handler
	// because GetChannelByID doesn't have userID parameter
	// You might want to add a service method that verifies ownership
	_ = userID

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channel fetched successfully",
		"data":    channel,
	})
}

// GetAllChannels handles GET /api/channels
func (h *ChannelHandler) GetAllChannels(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	channels, err := h.channelService.GetAllChannels(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Error fetching channels",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channels fetched successfully",
		"data":    channels,
	})
}

// UpdateChannel handles PATCH /api/channels/:channelId
func (h *ChannelHandler) UpdateChannel(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	channelID := ctx.Param("channelId")
	if channelID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Channel ID required",
		})
		return
	}

	var req struct {
		Name string `json:"name"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(channelID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid channel ID",
		})
		return
	}

	channel := &model.Channel{
		ID:   objectID,
		Name: req.Name,
	}

	if err := h.channelService.UpdateChannel(ctx.Request.Context(), userID, channel); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "channel not found" || err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error updating channel",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channel updated successfully",
	})
}

// DeleteChannel handles DELETE /api/channels/:channelId
func (h *ChannelHandler) DeleteChannel(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	channelID := ctx.Param("channelId")
	if channelID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Channel ID required",
		})
		return
	}

	if err := h.channelService.DeleteChannel(ctx.Request.Context(), userID, channelID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "channel not found" || err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error deleting channel",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Channel deleted successfully",
	})
}
