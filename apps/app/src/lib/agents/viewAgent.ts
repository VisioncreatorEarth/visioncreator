import type { Anthropic } from '@anthropic-ai/sdk';
import type { Message, ToolResultType } from '$lib/agentStore';


const SYSTEM_PROMPT = `
You are an AI assistant specialized in creating view configurations for a dynamic Svelte component system called Composer. Your task is to interpret user requests and generate appropriate JSON configurations for the Composer.svelte component.

Key points about the Composer system:
1. It uses a hierarchical structure to define layouts and components.
2. Each component (composer) can have its own layout, children, and associated data.
3. The system supports dynamic component loading and rendering based on configuration.
4. It uses CSS Grid for flexible layouts, defined in the 'layout' property.
5. Data fetching is handled through the 'map' property, which can include static data or dynamic queries.

When generating a view configuration:
1. Always include an 'id' for each composer.
2. Use the 'layout' property to define grid layouts.
3. Specify components using the 'component' property.
4. Use the 'slot' property for positioning within parent grids.
5. Include 'children' for nested components.
6. Use the 'map' property for data requirements and transformations.

Available components (always prepend with "o-"):
- HelloEarth
- Bring
- Banking
- AirBNB
- Splitwise
- Kanban

Instructions for component selection:
1. Analyze the user's request to determine which component best fits their needs.
2. Select the most appropriate component from the available list.
3. If the user explicitly requests a specific component, use that one.
4. If the user's request is ambiguous, choose the component that best matches their intent.
5. Always prepend the selected component name with "o-" in the configuration.

Always return the JSON configuration wrapped in <compose-view> tags, like this:
<compose-view>
{
    "id": "MainContainer",
    "layout": {
        "areas": "'content'",
        "columns": "1fr",
        "rows": "1fr",
        "overflow": "auto",
        "style": 'p-4 max-w-7xl mx-auto'
    },
    "children": [
        {
            "id": "ContentArea",
            "component": "o-[SelectedComponent]",
            "slot": "content"
        }
    ]
}
</compose-view>

Replace [SelectedComponent] with the appropriate component name based on the user's request.
Do not include any explanations or other text outside these tags.
`;

export async function viewAgent(anthropic: Anthropic, request: any) {
    try {
        const userMessage = request.agentInput?.task || request.messages[request.messages.length - 1].content;

        console.log('🎯 ViewAgent processing:', userMessage);

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 4000,
            messages: [{ role: 'user', content: userMessage }],
            system: SYSTEM_PROMPT,
            temperature: 0.7
        });

        const viewConfig = extractViewConfig(response.content[0].text);
        console.log('🎨 Generated view config:', viewConfig);

        const message = createAgentMessage(response.content[0].text, viewConfig, request.tool_use_id);

        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: viewConfig ? JSON.stringify(viewConfig) : null,
            is_error: !viewConfig,
            message
        };
    } catch (error) {
        console.error('❌ ViewAgent error:', error);
        return createErrorResponse(error, request.tool_use_id);
    }
}

function extractViewConfig(text: string) {
    const match = text.match(/<compose-view>([\s\S]*?)<\/compose-view>/);
    return match ? JSON.parse(match[1]) : null;
}

function createAgentMessage(content: string, viewConfig: any, toolUseId: string): Message {
    return {
        role: 'viewAgent',
        content,
        timestamp: Date.now(),
        toolResult: viewConfig ? {
            type: 'view',
            data: viewConfig,
            tool_use_id: toolUseId
        } : undefined
    };
}
