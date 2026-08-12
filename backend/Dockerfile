FROM golang:1.21-alpine AS builder

WORKDIR /app

ENV GOPROXY=https://goproxy.cn
ENV GOSUMDB=off

# Install git for go module VCS operations
RUN apk update && apk add --no-cache git

# Copy go.mod and source first, then download deps
COPY go.mod ./
COPY . .

# Download dependencies inside Docker (may route differently than host)
RUN go env -w GOPROXY=https://goproxy.cn && \
    go env -w GOSUMDB=off && \
    go env GOPROXY GOSUMDB && \
    GOPROXY=https://goproxy.cn GOSUMDB=off go mod tidy && \
    GOPROXY=https://goproxy.cn GOSUMDB=off go mod download

RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

FROM alpine:3.19

RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Tehran

COPY --from=builder /server /usr/local/bin/server

EXPOSE 8080

CMD ["server"]
