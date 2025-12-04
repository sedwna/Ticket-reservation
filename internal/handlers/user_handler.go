package handlers

import (
    "net/http"
    "github.com/sedwna/Ticket-reservation/internal/services"

    "github.com/gin-gonic/gin"
)

type UserHandler struct {
    Service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
    return &UserHandler{Service: service}
}

func (h *UserHandler) GetAllUsers(c *gin.Context) {
    users, err := h.Service.GetAllUsers()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, users)
}
