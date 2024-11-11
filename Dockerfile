# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

COPY package*.json ./

RUN npm install

# Label for metadata
LABEL org.opencontainers.image.source=https://github.com/sonpipe0/printscript-ui

# Define build arguments
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG BACKEND_URL

# Set environment variables from build arguments
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV BACKEND_URL=$BACKEND_URL

# Build the application
COPY . .
RUN npm run build

# Stage 2: Serve the built files
FROM --platform=linux/amd64 node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist

RUN npm i -g serve

# Expose the port on which the app will run
EXPOSE 80

# Serve the built frontend
ENTRYPOINT ["serve", "-s", "dist", "-l", "80"]
