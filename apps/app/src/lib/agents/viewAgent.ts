import type { Anthropic } from '@anthropic-ai/sdk';

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
        "style": 'p-4 max-w-8xl mx-auto'
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
    console.log('viewAgent called with request:', JSON.stringify(request, null, 2));
    try {
        const userMessage = request.agentInput?.task || request.messages[request.messages.length - 1].content;
        console.log('User message for viewAgent:', userMessage);

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            messages: [
                { role: 'user', content: userMessage }
            ],
            system: SYSTEM_PROMPT,
            temperature: 0.7,
            top_p: 1
        });

        console.log('Received response from Anthropic:', JSON.stringify(response, null, 2));

        let viewConfiguration = null;
        if (response.content && response.content.length > 0) {
            for (const content of response.content) {
                if (content.type === 'text') {
                    const match = content.text.match(/<compose-view>([\s\S]*?)<\/compose-view>/);
                    if (match) {
                        viewConfiguration = JSON.parse(match[1]);
                        break;
                    }
                }
            }
        }

        if (viewConfiguration) {
            console.log('Generated view configuration:', JSON.stringify(viewConfiguration, null, 2));
            return {
                type: 'tool_result',
                tool_use_id: request.tool_use_id,
                content: JSON.stringify(viewConfiguration)
            };
        }

        console.log('Could not generate a valid view configuration');
        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: "I couldn't generate a valid view configuration. Here's what I got:\n\n" + response.content[0].text,
            is_error: true
        };
    } catch (error) {
        console.error('Error in viewAgent:', error);
        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: 'An error occurred while processing your request in the viewAgent.',
            is_error: true
        };
    }
}
