#!/usr/bin/env node
/**
 * MCP server for fetching user stories from third-party APIs
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const API_URL = "https://tools-backend.dev.opengig.work";
/**
 * Create an MCP server with capabilities for tools
 */
const server = new Server(
  {
    name: "user-stories-tool",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);
/**
 * Handler that lists available tools.
 * Exposes a single "fetch_user_stories" tool that fetches user stories from the API.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fetch_user_stories",
        description: "Fetch user stories by project name",
        inputSchema: {
          type: "object",
          properties: {
            project_name: {
              type: "string",
              description: "The name of the project to fetch stories for",
            },
          },
          required: ["project_name"],
        },
      },
      {
        name: "get_technical_design",
        description: "Fetch Technical design by project name",
        inputSchema: {
          type: "object",
          properties: {
            project_name: {
              type: "string",
              description:
                "The name of the project to fetch technical design for",
            },
          },
          required: ["project_name"],
        },
      },
    ],
  };
});
/**
 * Handler for the fetch_user_stories tool.
 * Fetches user stories from the API and returns them.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "fetch_user_stories": {
      try {
        const args = request.params.arguments;
        if (!args || typeof args !== "object" || !("project_name" in args)) {
          return {
            content: [
              {
                type: "text",
                text: "Error: arguments must contain a valid project_name string",
              },
            ],
            isError: true,
          };
        }
        const { project_name } = args;
        if (!project_name) {
          return {
            content: [
              {
                type: "text",
                text: "Error: project_name parameter is required",
              },
            ],
            isError: true,
          };
        }
        const response = await axios.get(
          `${API_URL}/integrations/stories/${encodeURIComponent(project_name)}`,
          {
            headers: {
              "x-api-key": process.env.API_KEY,
            },
          }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Unknown error";
        if (axios.isAxiosError(error)) {
          errorMessage = `Error fetching from ${error.config?.url}: ${error.response?.status} ${error.response?.statusText}`;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        return {
          content: [
            {
              type: "text",
              text: `Error fetching user stories: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
    case "get_technical_design": {
      const args = request.params.arguments;
      const project_name = args?.project_name;
      if (!project_name) {
        return {
          content: [
            {
              type: "text",
              text: "Error: project_name parameter is required",
            },
          ],
          isError: true,
        };
      }
      try {
        const response = await axios.get(
          `${API_URL}/integrations/technical-design/${encodeURIComponent(
            project_name
          )}`,
          {
            headers: {
              "x-api-key": process.env.API_KEY,
            },
          }
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        return {
          content: [
            {
              type: "text",
              text: `Error fetching technical design: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    }
    default:
      throw new Error("Unknown tool");
  }
});
/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
