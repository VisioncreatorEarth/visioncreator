export const selectedTools = [
  {
    "temporaryTool": {
      "modelToolName": "switchView",
      "description": "Switch the current UI view based on user intent. Call this whenever the user expresses interest in viewing different content or functionality.",
      "dynamicParameters": [
        {
          "name": "view",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "type": "string",
            "enum": ["banking", "todos", "profile", "none"],
            "description": "The view to switch to based on user intent"
          },
          "required": true
        },
        {
          "name": "context",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "type": "object",
            "description": "Additional context data specific to the view",
            "properties": {
              "reason": {
                "type": "string",
                "description": "Why this view was selected based on user intent"
              },
              "additionalData": {
                "type": "object",
                "description": "Any additional data needed for the view"
              }
            }
          },
          "required": false
        }
      ],
      "client": {}
    }
  }
];
