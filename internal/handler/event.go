package handler

import (
	"net/http"
	"strconv"

	"trakrlog/internal/middleware"
	"trakrlog/internal/model"
	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type EventHandler struct {
	eventService *service.EventService
}

func NewEventHandler(eventService *service.EventService) *EventHandler {
	return &EventHandler{
		eventService: eventService,
	}
}

// CreateEvent handles POST /api/track
func (h *EventHandler) CreateEvent(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	var req struct {
		Project     string            `json:"project" binding:"required"`
		Channel     string            `json:"channel" binding:"required"`
		Title       string            `json:"title" binding:"required"`
		Description string            `json:"description"`
		Icon        string            `json:"icon"`
		Tags        map[string]string `json:"tags"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	event, err := h.eventService.CreateEvent(ctx.Request.Context(), userID, req.Project, req.Channel, req.Title, req.Description, req.Icon, req.Tags)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "channel not found" || err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error creating event",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Event created successfully",
		"data":    event,
	})
}

// GetChannelEvents handles GET /api/channels/:channelId/events
func (h *EventHandler) GetChannelEvents(ctx *gin.Context) {
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

	// Parse pagination params
	limit := int64(50)
	offset := int64(0)

	if limitStr := ctx.Query("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 64); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := ctx.Query("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 64); err == nil && o >= 0 {
			offset = o
		}
	}

	events, err := h.eventService.GetChannelEvents(ctx.Request.Context(), userID, channelID, limit, offset)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "channel not found" || err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error fetching events",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Events fetched successfully",
		"data":    events,
	})
}

// GetProjectEvents handles GET /api/projects/:projectId/events
func (h *EventHandler) GetProjectEvents(ctx *gin.Context) {
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

	// Parse pagination params
	limit := int64(50)
	offset := int64(0)

	if limitStr := ctx.Query("limit"); limitStr != "" {
		if l, err := strconv.ParseInt(limitStr, 10, 64); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := ctx.Query("offset"); offsetStr != "" {
		if o, err := strconv.ParseInt(offsetStr, 10, 64); err == nil && o >= 0 {
			offset = o
		}
	}

	events, err := h.eventService.GetProjectEvents(ctx.Request.Context(), userID, projectID, limit, offset)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error fetching events",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Events fetched successfully",
		"data":    events,
	})
}

// GetEvent handles GET /api/events/:id
func (h *EventHandler) GetEvent(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	eventID := ctx.Param("id")
	if eventID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Event ID required",
		})
		return
	}

	event, err := h.eventService.GetEventByID(ctx.Request.Context(), eventID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Event not found",
			"error":   err.Error(),
		})
		return
	}

	// Note: GetEventByID doesn't verify ownership, just returns the event
	_ = userID

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Event fetched successfully",
		"data":    event,
	})
}

// UpdateEvent handles PATCH /api/events/:id
func (h *EventHandler) UpdateEvent(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	eventID := ctx.Param("id")
	if eventID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Event ID required",
		})
		return
	}

	var req struct {
		Title       string            `json:"title"`
		Description string            `json:"description"`
		Icon        string            `json:"icon"`
		Tags        map[string]string `json:"tags"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	objectID, err := primitive.ObjectIDFromHex(eventID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid event ID",
		})
		return
	}

	event := &model.Event{
		ID:          objectID,
		Title:       req.Title,
		Description: req.Description,
		Icon:        req.Icon,
		Tags:        req.Tags,
	}

	if err := h.eventService.UpdateEvent(ctx.Request.Context(), userID, event); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "event not found" || err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error updating event",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Event updated successfully",
	})
}

// DeleteEvent handles DELETE /api/events/:id
func (h *EventHandler) DeleteEvent(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	eventID := ctx.Param("id")
	if eventID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Event ID required",
		})
		return
	}

	if err := h.eventService.DeleteEvent(ctx.Request.Context(), userID, eventID); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "unauthorized: project does not belong to user" {
			statusCode = http.StatusForbidden
		} else if err.Error() == "event not found" || err.Error() == "project not found" {
			statusCode = http.StatusNotFound
		}

		ctx.JSON(statusCode, gin.H{
			"success": false,
			"message": "Error deleting event",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Event deleted successfully",
	})
}
