/**
 * Microservices Generator
 * Scaffolds complete microservices architecture
 */

class MicroservicesGenerator {
  /**
   * Generate microservice scaffold
   */
  generateService(name, port = 3000) {
    return {
      'package.json': this.generatePackageJson(name),
      'app.js': this.generateServiceApp(name, port),
      'docker-compose.yml': this.generateCompose(name, port),
      'Dockerfile': this.generateDockerfile(),
      '.env': this.generateEnv(name, port)
    };
  }

  /**
   * Generate package.json for service
   */
  generatePackageJson(name) {
    return {
      name,
      version: '0.1.0',
      description: `Microservice: ${name}`,
      main: 'app.js',
      scripts: {
        start: 'node app.js',
        dev: 'nodemon app.js',
        test: 'jest'
      },
      dependencies: {
        express: '^4.18.0',
        'express-health-check': '^0.0.6',
        axios: '^1.4.0',
        'dotenv': '^16.0.0'
      }
    };
  }

  /**
   * Generate service application code
   */
  generateServiceApp(name, port) {
    return `const express = require('express');
const healthCheck = require('express-health-check');

const app = express();
app.use(express.json());

// Health check endpoint
app.use('/_health', healthCheck());

// Service routes
app.get('/info', (req, res) => {
  res.json({ service: '${name}', version: '0.1.0' });
});

// TODO: Add service endpoints

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || ${port};
app.listen(PORT, () => {
  console.log(\`${name} service running on port \${PORT}\`);
});
`;
  }

  /**
   * Generate docker-compose for services
   */
  generateCompose(mainService, mainPort) {
    return `version: '3.9'

services:
  ${mainService}:
    build: .
    ports:
      - "${mainPort}:${mainPort}"
    environment:
      PORT: ${mainPort}
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    networks:
      - microservices

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: vibe_db
      POSTGRES_USER: vibe
      POSTGRES_PASSWORD: vibe
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - microservices

  redis:
    image: redis:7-alpine
    networks:
      - microservices

  api-gateway:
    image: nginx:latest
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - ${mainService}
    networks:
      - microservices

volumes:
  postgres_data:

networks:
  microservices:
    driver: bridge
`;
  }

  /**
   * Generate Dockerfile
   */
  generateDockerfile() {
    return `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
`;
  }

  /**
   * Generate .env
   */
  generateEnv(name, port) {
    return `SERVICE_NAME=${name}
PORT=${port}
NODE_ENV=production
LOG_LEVEL=info

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=vibe_db
DB_USER=vibe
DB_PASSWORD=vibe

# Cache
REDIS_HOST=redis
REDIS_PORT=6379

# Service Discovery
SERVICE_REGISTRY=http://api-gateway:8080
`;
  }

  /**
   * Generate nginx configuration
   */
  generateNginxConfig() {
    return `user nginx;
worker_processes auto;

events {
  worker_connections 1024;
}

http {
  upstream services {
    least_conn;
    server app:3000;
  }

  server {
    listen 80;
    server_name _;

    location / {
      proxy_pass http://services;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    location /_health {
      proxy_pass http://services/_health;
      access_log off;
    }
  }
}
`;
  }

  /**
   * Generate kubernetes deployment
   */
  generateK8sDeployment(name, image, replicas = 3) {
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: ${image}
        ports:
        - containerPort: 3000
        env:
        - name: PORT
          value: "3000"
        livenessProbe:
          httpGet:
            path: /_health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /_health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: ${name}-service
spec:
  selector:
    app: ${name}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
`;
  }
}

export { MicroservicesGenerator };
