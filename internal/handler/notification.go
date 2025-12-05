package handler

import (
	"net/http"
	"time"

	"trakrlog/internal/middleware"
	"trakrlog/internal/model"
	"trakrlog/internal/service"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type NotificationHandler struct {
	subscriptionService *service.SubscriptionService
	notificationService *service.NotificationService
	pushService         *service.PushService
}

func NewNotificationHandler(
	subscriptionService *service.SubscriptionService,
	notificationService *service.NotificationService,
	pushService *service.PushService,
) *NotificationHandler {
	return &NotificationHandler{
		subscriptionService: subscriptionService,
		notificationService: notificationService,
		pushService:         pushService,
	}
}

// CreateSubscription handles POST /api/notifications/subscriptions
func (h *NotificationHandler) CreateSubscription(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	var req struct {
		Endpoint  string `json:"endpoint" binding:"required"`
		P256dh    string `json:"p256dh" binding:"required"`
		Auth      string `json:"auth" binding:"required"`
		UserAgent string `json:"userAgent"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	// Convert userID string to ObjectID
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid user ID",
		})
		return
	}

	// Create subscription object
	subscription := &model.NotificationSubscription{
		UserID:    userObjID,
		Endpoint:  req.Endpoint,
		P256dh:    req.P256dh,
		Auth:      req.Auth,
		UserAgent: req.UserAgent,
	}

	// Save to database
	if err := h.subscriptionService.CreateSubscription(ctx.Request.Context(), subscription); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create subscription",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"success":      true,
		"message":      "Subscription created successfully",
		"subscription": subscription,
	})
}

// GetSubscriptions handles GET /api/notifications/subscriptions
func (h *NotificationHandler) GetSubscriptions(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	subscriptions, err := h.subscriptionService.GetSubscriptions(ctx.Request.Context(), userID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to fetch subscriptions",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":       true,
		"subscriptions": subscriptions,
	})
}

// DeleteSubscription handles DELETE /api/notifications/subscriptions/:id
func (h *NotificationHandler) DeleteSubscription(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	subscriptionID := ctx.Param("id")

	// Verify subscription exists and belongs to user
	subscription, err := h.subscriptionService.GetSubscriptionByID(ctx.Request.Context(), subscriptionID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Subscription not found",
		})
		return
	}

	// Verify ownership
	if subscription.UserID.Hex() != userID {
		ctx.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You don't have permission to delete this subscription",
		})
		return
	}

	// Delete subscription
	if err := h.subscriptionService.DeleteSubscription(ctx.Request.Context(), subscriptionID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to delete subscription",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Subscription deleted successfully",
	})
}

// UpdateSubscription handles PATCH /api/notifications/subscriptions/:id
func (h *NotificationHandler) UpdateSubscription(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	subscriptionID := ctx.Param("id")

	var req struct {
		Enabled *bool `json:"enabled"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Invalid request",
			"error":   err.Error(),
		})
		return
	}

	// Verify subscription exists and belongs to user
	subscription, err := h.subscriptionService.GetSubscriptionByID(ctx.Request.Context(), subscriptionID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{
			"success": false,
			"message": "Subscription not found",
		})
		return
	}

	// Verify ownership
	if subscription.UserID.Hex() != userID {
		ctx.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": "You don't have permission to update this subscription",
		})
		return
	}

	// Update enabled status if provided
	if req.Enabled != nil {
		subscription.Enabled = *req.Enabled
	}

	// Save to database
	if err := h.subscriptionService.UpdateSubscription(ctx.Request.Context(), subscription); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to update subscription",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success":      true,
		"message":      "Subscription updated successfully",
		"subscription": subscription,
	})
}

// SendTestNotification handles POST /api/notifications/test
func (h *NotificationHandler) SendTestNotification(ctx *gin.Context) {
	userID, ok := middleware.GetAuthUserID(ctx)
	if !ok {
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Unauthorized",
		})
		return
	}

	// Create test notification payload
	payload := &model.NotificationPayload{
		Title: "Test Notification",
		Body:  "This is a test notification from TrakrLog",
		Icon:  "🔔",
		Data: map[string]interface{}{
			"test":      true,
			"timestamp": time.Now().Format(time.RFC3339),
		},
		Tag: "trakrlog-test",
	}

	// Send to all active subscriptions for the user
	err := h.pushService.SendToUser(ctx.Request.Context(), userID, payload, "")
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to send test notification",
			"error":   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Test notification sent successfully",
	})
}
