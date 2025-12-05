package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// NotificationSubscription stores user's browser push subscription information
type NotificationSubscription struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID     primitive.ObjectID `bson:"user_id" json:"userId"`
	Endpoint   string             `bson:"endpoint" json:"endpoint"` // Web Push endpoint URL
	P256dh     string             `bson:"p256dh" json:"p256dh"`     // Public key for encryption
	Auth       string             `bson:"auth" json:"auth"`         // Auth secret for encryption
	UserAgent  string             `bson:"user_agent,omitempty" json:"userAgent,omitempty"`
	Enabled    bool               `bson:"enabled" json:"enabled"`
	CreatedAt  time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updatedAt"`
	LastUsedAt *time.Time         `bson:"last_used_at,omitempty" json:"lastUsedAt,omitempty"`
}

// NotificationLog tracks sent notifications for debugging and analytics
type NotificationLog struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID         primitive.ObjectID `bson:"user_id" json:"userId"`
	EventID        primitive.ObjectID `bson:"event_id" json:"eventId"`
	SubscriptionID primitive.ObjectID `bson:"subscription_id" json:"subscriptionId"`
	Status         string             `bson:"status" json:"status"` // "sent", "failed"
	Error          string             `bson:"error,omitempty" json:"error,omitempty"`
	SentAt         time.Time          `bson:"sent_at" json:"sentAt"`
}
