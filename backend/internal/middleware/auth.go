package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"

	"ticket-reservation-system/pkg/utils"
)

func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "توکن احراز هویت یافت نشد")
			return
		}

		// Remove "Bearer " prefix
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			utils.Unauthorized(c, "فرمت توکن نامعتبر است")
			return
		}

		// Validate JWT token
		claims, err := utils.ValidateToken(tokenString, jwtSecret)
		if err != nil {
			utils.Unauthorized(c, "توکن نامعتبر یا منقضی شده است")
			return
		}

		// Set user info in context
		c.Set("userID", claims.UserID)
		c.Set("userRole", claims.Role)
		c.Set("userEmail", claims.Email)
		c.Set("userName", claims.Name)

		c.Next()
	}
}

func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists || role != "ADMIN" {
			utils.Forbidden(c, "دسترسی غیرمجاز - این بخش فقط برای مدیران قابل دسترسی است")
			return
		}
		c.Next()
	}
}
