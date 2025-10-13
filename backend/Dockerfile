FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random \
    PORT=7007

# Install system dependencies (Graphviz + essentials)
RUN apt-get update && apt-get install -y --no-install-recommends \
    graphviz \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

RUN pip install --upgrade pip uv

# Copy dependency files
COPY pyproject.toml uv.lock* ./

# Install uv and dependencies (system-wide)

RUN uv pip install --system .

# Copy application code
COPY src ./src

# Expose port
EXPOSE $PORT

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

ENV PYTHONPATH=/app/src


# Run the FastAPI app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "7007"]
