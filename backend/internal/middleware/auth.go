package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/internal/models"
	"ticket-reservation-system/pkg/utils"
)

type userAccessReader interface {
	FindByID(id uuid.UUID) (*models.User, error)
}

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

func AdminMiddleware(users userAccessReader) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("userID")
		id, err := uuid.Parse(stringValue(userID))
		if !exists || err != nil {
			utils.Unauthorized(c, "هویت کاربر نامعتبر است")
			return
		}

		user, err := users.FindByID(id)
		if err != nil || !user.IsActive || !user.IsAdmin() {
			utils.Forbidden(c, "دسترسی غیرمجاز - این بخش فقط برای مدیران قابل دسترسی است")
			return
		}

		// Refresh authorization data from the database so a stale token cannot
		// preserve admin access after a role or status change.
		c.Set("userRole", user.Role)
		c.Next()
	}
}

func stringValue(value any) string {
	text, _ := value.(string)
	return text
}
