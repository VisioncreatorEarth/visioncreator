# Use the E2B base image
FROM e2bdev/code-interpreter:latest

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Set up the working directory
WORKDIR /root/app

# Copy the SvelteKit template files
COPY . .

# Install dependencies using bun
RUN bun install

# Set up startup script for development server
RUN echo '#!/bin/bash\ncd /root/app && bun dev --host 0.0.0.0' > /root/.jupyter/start-up.sh && \
    chmod +x /root/.jupyter/start-up.sh
