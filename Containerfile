FROM node:25-bookworm

# Install Python and other useful tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Install pnpm for faster package management (optional)
# RUN npm install -g pnpm

# Expose common ports
EXPOSE 3000 8000 8080

# Default command
CMD ["bash"]
