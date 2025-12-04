package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sedwna/Ticket-reservation/internal/db"
	"github.com/sedwna/Ticket-reservation/internal/handlers"
)

func main() {
	godotenv.Load()
	dbConn, err := db.NewDBFromEnv()
	if err != nil {
		log.Fatal(err)
	}

	r := gin.Default()

	handlers.RegisterAuthRoutes(r, dbConn)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
