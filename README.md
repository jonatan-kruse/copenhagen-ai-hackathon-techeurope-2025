# Consultant Matching Web App

AI-powered web application for matching consultants to projects using semantic similarity search with Weaviate and OpenAI embeddings.

## Features

- **AI Chat Interface**: Interactive conversation to assemble teams and identify required roles
- **Vector Search Matching**: Semantic similarity matching using Weaviate and OpenAI embeddings
- **Resume Management**: Upload and manage consultant resumes via admin interface
- **Match Scoring**: Normalized match scores showing consultant relevance

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Setup

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Add your OPENAI_APIKEY to .env
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Initialize Weaviate schema:**
   ```bash
   docker-compose exec backend bash scripts/setup.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Weaviate: http://localhost:8080

## Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
bun install
bun run dev
```

**Run Tests:**
```bash
cd backend
pytest tests/ -v
```

## CI/CD

The project uses GitHub Actions for CI/CD:
- **Test job**: Runs Python tests in parallel with Docker builds
- **Build job**: Builds Docker images for frontend and backend
- **Deploy job**: Deploys to production only if both test and build jobs pass

Tests run automatically on push and pull requests to `main`.
