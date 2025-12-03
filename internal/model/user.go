package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Provider represents an OAuth provider linked to a user account
type Provider struct {
	Name         string    `bson:"name" json:"name"`                 // "google", "github", etc.
	ProviderID   string    `bson:"provider_id" json:"providerId"`    // OAuth provider's user ID
	Email        string    `bson:"email" json:"email"`               // Email from this provider
	AccessToken  string    `bson:"access_token,omitempty" json:"-"`  // Never send to client
	RefreshToken string    `bson:"refresh_token,omitempty" json:"-"` // Never send to client
	LinkedAt     time.Time `bson:"linked_at" json:"linkedAt"`
	LastUsedAt   time.Time `bson:"last_used_at,omitempty" json:"lastUsedAt,omitempty"`
}

type APIKey struct {
	Key       string    `bson:"key" json:"key"`
	Name      string    `bson:"name" json:"name"`
	CreatedAt time.Time `bson:"created_at" json:"createdAt"`
	LastUsed  time.Time `bson:"last_used,omitempty" json:"lastUsed,omitempty"`
}

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email"` // Primary email
	Name      string             `bson:"name" json:"name"`
	Avatar    string             `bson:"avatar,omitempty" json:"avatar,omitempty"`
	Providers []Provider         `bson:"providers" json:"providers"` // Linked OAuth accounts
	APIKeys   []APIKey           `bson:"api_keys,omitempty" json:"apiKeys,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}

// GetProvider returns a pointer to the provider if it exists, nil otherwise
func (u *User) GetProvider(providerName string) *Provider {
	for i := range u.Providers {
		if u.Providers[i].Name == providerName {
			return &u.Providers[i]
		}
	}
	return nil
}

// HasProvider checks if a user has a specific OAuth provider linked
func (u *User) HasProvider(providerName string) bool {
	return u.GetProvider(providerName) != nil
}
