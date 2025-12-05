package server

import (
	"log"
	"os"
)

// VapidConfig holds the VAPID configuration for Web Push notifications
type VapidConfig struct {
	PublicKey  string
	PrivateKey string
	Subject    string
}

// LoadVapidConfig loads VAPID configuration from environment variables
func LoadVapidConfig() *VapidConfig {
	config := &VapidConfig{
		PublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
		PrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
		Subject:    os.Getenv("VAPID_SUBJECT"),
	}

	// Validate VAPID configuration
	if config.PublicKey == "" || config.PrivateKey == "" || config.Subject == "" {
		log.Println("Warning: VAPID configuration incomplete. Push notifications will not be available.")
		log.Println("Run 'go run cmd/generate-vapid-keys/main.go' to generate VAPID keys.")
		return config
	}

	log.Println("[⚡️ Server]: VAPID configuration loaded successfully")
	return config
}

// IsValid returns whether the VAPID configuration is complete and valid
func (c *VapidConfig) IsValid() bool {
	return c.PublicKey != "" && c.PrivateKey != "" && c.Subject != ""
}
