# AGY Command Center Inference Pod

This pod contains the AI inference services that power the AGY Command Center's intelligent capabilities.

## Components
- **LiteLLM Server**: Proxy for multiple LLM providers (Ollama, vLLM, HuggingFace, etc.)
- **Model Serving**: Optimized serving for various AI models
- **Embedding Services**: For semantic caching and similarity search
- **Evaluation Workers**: For continuous model evaluation
- **Tool Execution**: Secure execution of agent tools and commands

## Features Supported
- LLM Routing and Load Balancing
- Semantic Caching with Embedding Similarity
- Model Hot-Swapping and Versioning
- GPU Acceleration (when available)
- Batch Processing Optimization
- Token Streaming and Metrics Collection

## Technology Stack
- LiteLLM: Unified LLM API proxy
- Ollama/vLLM/TGI: Local model serving
- SentenceTransformers: Embedding generation
- FastAPI/Python: Custom services and workers
- Redis: Caching and message queuing
- Podman: Containerized deployment

## Model Management
Models are stored in the `models/` directory and can be:
- Pre-downloaded and stored locally
- Dynamically pulled from HuggingFace Hub
- Generated and saved during training
- Shared via volume mounts between pods

## Running the Inference Pod
```bash
# Build the container
podman build -t agy-inference:latest .

# Run the container (with GPU support if available)
podman run -d \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models:z \
  -v $(pwd)/logs:/app/logs:z \
  -e OLLAMA_HOST=0.0.0.0 \
  -e VLLM_PORT=8000 \
  --name agy-inference \
  agy-inference:latest
```

## Environment Variables
- `OLLAMA_HOST`: Host for Ollama service
- `VLLM_PORT`: Port for vLLM server
- `HF_HOME`: HuggingFace cache directory
- `REDIS_URL`: Connection string for Redis
- `LOG_LEVEL`: Logging verbosity

## Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run services
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Run evaluation workers
python -m workers.evaluator

# Test API endpoints
curl http://localhost:8000/health
```
