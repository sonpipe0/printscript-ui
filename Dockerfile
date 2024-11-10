
# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy frontend source code
COPY . /app

# Label for metadata
LABEL org.opencontainers.image.source="https://github.com/your-repo/frontend"

# Use Docker secrets for environment variables (e.g., Auth0 credentials)
RUN --mount=type=secret,id=auth0_domain,env=VITE_AUTH0_DOMAIN,required \
    --mount=type=secret,id=auth0_client_id,env=VITE_AUTH0_CLIENT_ID,required \
    --mount=type=secret,id=backend_url,env=BACKEND_URL,required \
    npm install && npm run build

# Expose the port on which the app will run
EXPOSE 80

# Serve the built frontend
ENTRYPOINT ["npm", "run", "serve"]