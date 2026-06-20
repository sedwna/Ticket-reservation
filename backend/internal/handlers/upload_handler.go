package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"ticket-reservation-system/pkg/utils"
)

type UploadHandler struct {
	UploadDir string
}

func NewUploadHandler(uploadDir string) *UploadHandler {
	os.MkdirAll(uploadDir, 0755)
	return &UploadHandler{UploadDir: uploadDir}
}

// UploadPoster handles poster image upload
func (h *UploadHandler) UploadPoster(c *gin.Context) {
	file, header, err := c.Request.FormFile("poster")
	if err != nil {
		utils.BadRequest(c, "لطفاً یک فایل تصویر انتخاب کنید")
		return
	}
	defer file.Close()

	// Validate file type
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowedExts[ext] {
		utils.BadRequest(c, "فرمت فایل باید jpg، png یا webp باشد")
		return
	}

	// Max 5MB
	if header.Size > 5*1024*1024 {
		utils.BadRequest(c, "حجم فایل نباید بیش از ۵ مگابایت باشد")
		return
	}

	// Generate unique filename
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().UnixMilli(), ext)
	destPath := filepath.Join(h.UploadDir, filename)

	dst, err := os.Create(destPath)
	if err != nil {
		utils.InternalError(c, "خطا در ذخیره فایل")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		utils.InternalError(c, "خطا در ذخیره فایل")
		return
	}

	// Return the accessible URL
	posterURL := fmt.Sprintf("/uploads/%s", filename)
	utils.SuccessMessage(c, http.StatusCreated, "پوستر با موفقیت آپلود شد", gin.H{
		"poster_url": posterURL,
		"filename":   filename,
	})
}
