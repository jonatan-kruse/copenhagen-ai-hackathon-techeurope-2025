# Consultant Matching Web App

A web application for consulting firm managers to find matching consultants for their projects using AI-powered vector search. The app uses semantic similarity matching with OpenAI embeddings to find the best consultants based on project requirements.

## Features

- **AI Chat Interface**: Interactive conversation to assemble teams and identify required roles
- **Vector Search Matching**: Semantic similarity matching using Weaviate and OpenAI embeddings
- **Resume Management**: Upload and manage consultant resumes via admin interface
- **Match Scoring**: Normalized match scores showing consultant relevance

## Installation & Running

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (for embeddings)

### Quick Start

1. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Add your OPENAI_APIKEY to .env
   ```

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Initialize Weaviate schema:**
   ```bash
   docker-compose exec backend bash scripts/setup.sh
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173 (or check docker-compose port mapping)
   - Backend API: http://localhost:8000
   - Weaviate: http://localhost:8080

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
bun install
bun run dev
```
