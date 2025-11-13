package config

import "os"

type Config struct {
	DBPath    string
	Port      string
	JWTSecret string
}

func Load() *Config {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/pos.db"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		// Dev default; change in production via environment variable
		jwtSecret = "dev-secret-change-me"
	}

	return &Config{
		DBPath:    dbPath,
		Port:      port,
		JWTSecret: jwtSecret,
	}
}
