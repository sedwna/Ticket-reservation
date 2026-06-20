FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod and source first, then download deps
COPY go.mod ./
COPY . .

# Download dependencies inside Docker (may route differently than host)
RUN go mod tidy && go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Tehran

COPY --from=builder /server /usr/local/bin/server
COPY .env .env

EXPOSE 8080

CMD ["server"]
