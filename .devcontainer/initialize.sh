#!/bin/bash

# Install project dependencies
# get root directory path
ROOT_DIR=$(pwd)
PROJECT_NAME=$(basename "$ROOT_DIR")
pnpm install

# Fetch environment variables from API and update .env
echo "Fetching environment variables..."
curl -s -H "x-api-key: ldbrkfioyfsxvxuf" \
  "https://tools-backend.dev.opengig.work/integrations/env/$PROJECT_NAME" \
  >> $ROOT_DIR/.env
if [ $? -eq 0 ]; then
  echo "Environment variables updated successfully"
else
  echo "Failed to fetch environment variables" >&2
fi

# Create necessary directories
# mkdir -p /home/node/.vscode-server/data/User/globalStorage/saoudrizwan.claude-dev/settings
mkdir -p /home/node/.vscode-remote/data/User/globalStorage/saoudrizwan.claude-dev/settings

# Setup user-stories server
if [ -d "$ROOT_DIR/user-stories-server" ]; then
    # Build the project
    cd $ROOT_DIR/user-stories-server
    pnpm install
    # Start the server in a new terminal
    mkdir -p $ROOT_DIR/.vscode
    cat > $ROOT_DIR/.vscode/tasks.json <<EOF
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start User Stories Server",
      "type": "shell",
      "command": "cd $ROOT_DIR/user-stories-server && node index.js",
      "isBackground": true,
      "problemMatcher": {
        "pattern": {
          "regexp": "^.*$",
          "file": 1,
          "location": 2,
          "message": 3
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "^.*Server starting.*$",
          "endsPattern": "^.*Server started.*$"
        }
      },
      "presentation": {
        "reveal": "always",
        "panel": "new",
        "group": "servers"
      }
    }
  ]
}
EOF

    # Create MCP settings file
    cat > /home/node/.vscode-remote/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json <<EOF
{
  "mcpServers": {
    "user-stories": {
      "command": "node",
      "args": ["$ROOT_DIR/user-stories-server/index.js"],
      "env": {
        "API_KEY": "ldbrkfioyfsxvxuf"
      }
    }
  }
}
EOF

    # Set proper permissions
    chmod 644 /home/node/.vscode-remote/data/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
    
    # Start the server automatically
    nohup node $ROOT_DIR/user-stories-server/index.js
    
    echo "User Stories server started. Check logs at /home/codespace/user-stories.log"
fi
