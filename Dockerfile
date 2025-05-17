FROM node:18.18.0

# Set working directory
WORKDIR /app

# Copy application code
COPY . .

ARG NODE_ENV = $NODE_ENV
ENV NODE_ENV = $NODE_ENV

RUN echo "NODE_ENV is $NODE_ENV"

# install mysql client
RUN apt update
RUN apt install -y default-mysql-client

# Copy dependency definitions and install only production dependencies
RUN npm install --legacy-peer-deps

# Install pm2
RUN npm install -g pm2

# Copy the certificate file into a directory (e.g., /certs)
# Make sure the file skysql-ca.pem is in your project root
# COPY aws_skysql_chain.pem /certs/aws_skysql_chain.pem
COPY DigiCertGlobalRootCA.crt.pem /certs/DigiCertGlobalRootCA.crt.pem 

# Set the environment to production and expose your app port
EXPOSE 3000 3001

# Start the application
CMD ["pm2-runtime", "start", "--name", "banidb-api-prod-v2", "process.json"]
