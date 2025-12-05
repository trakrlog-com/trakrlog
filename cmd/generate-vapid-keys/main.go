package main

import (
	"fmt"
	"log"

	"trakrlog/internal/auth"
)

func main() {
	// Generate VAPID keys
	keys, err := auth.GenerateVAPIDKeys()
	if err != nil {
		log.Fatalf("Failed to generate VAPID keys: %v", err)
	}

	fmt.Println("=== VAPID Keys Generated ===")
	fmt.Println("\nAdd these to your environment variables (.env file):")
	fmt.Println()
	fmt.Printf("VAPID_PUBLIC_KEY=%s\n", keys.PublicKey)
	fmt.Printf("VAPID_PRIVATE_KEY=%s\n", keys.PrivateKey)
	fmt.Printf("VAPID_SUBJECT=mailto:your-email@example.com\n")
	fmt.Println()
	fmt.Println("Note: Replace 'your-email@example.com' with your actual email or website URL")
	fmt.Println("Example: mailto:admin@trakrlog.com or https://trakrlog.com")
}
