package handlers

import (
	"net/http"
	"github.com/sedwna/Ticket-reservation/internal/services"

	"github.com/gin-gonic/gin"
)

type TicketHandler struct {
	Service *services.TicketService
}

func NewTicketHandler(service *services.TicketService) *TicketHandler {
	return &TicketHandler{Service: service}
}

func (h *TicketHandler) GetTickets(c *gin.Context) {
	userID := c.GetInt64("user_id") // از JWT Middleware
	tickets, err := h.Service.GetTicketsByUser(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch tickets"})
		return
	}
	c.JSON(http.StatusOK, tickets)
}

func (h *TicketHandler) CreateTicket(c *gin.Context) {
	userID := c.GetInt64("user_id")
	var input struct {
		Title string `json:"title"`
		Date  string `json:"date"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	ticket, err := h.Service.CreateTicket(userID, input.Title, input.Date)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create ticket"})
		return
	}
	c.JSON(http.StatusOK, ticket)
}
