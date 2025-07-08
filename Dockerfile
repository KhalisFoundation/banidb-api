FROM node:18.18.0

# Declare build arguments
ARG SSL_CA_LINK

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

ARG NODE_ENV
RUN echo "NODE_ENV is ${NODE_ENV}"

# install mysql client
RUN apt update
RUN apt install -y default-mysql-client

# Copy dependency definitions and install only production dependencies
RUN npm install --legacy-peer-deps

# Install pm2
RUN npm install -g pm2

# Install curl and download the Azure CA certificate from external URL
# update SSL_CA_LINK with the actual link 
RUN apt-get update && apt-get install -y curl && \
    mkdir -p /certs && \
    echo "SSL_CA_LINK last 12 chars: ${SSL_CA_LINK: -12}" && \
    curl -o /certs/azure.pem ${SSL_CA_LINK}

# Set the environment to production and expose your app port
EXPOSE 3000 3001

# Start the application
CMD ["pm2-runtime", "start", "--name", "banidb-api-prod-v2", "process.json"]
