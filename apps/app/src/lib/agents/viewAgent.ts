import { conversationManager } from '$lib/stores/intentStore';
import type { Message } from '$lib/stores/intentStore';

// Helper functions
function extractViewConfig(text: string): any {
    try {
        const match = text.match(/<compose-view>([\s\S]*?)<\/compose-view>/);
        if (!match) {
            console.error('No view config found in response');
            return null;
        }
        const config = JSON.parse(match[1]);
        console.log('Extracted config:', config);
        return config;
    } catch (error) {
        console.error('Error extracting view config:', error);
        return null;
    }
}

// Constants
const AVAILABLE_COMPONENTS = ['HelloEarth', 'Bring', 'Banking', 'AirBNB', 'Splitwise', 'Kanban'];

const viewSystemPrompt = `You are Vroni, the View Agent. Your role is to analyze user requests and return appropriate view configurations.

Available components (always prepend with "o-"):
- o-HelloEarth
- o-Bring
- o-Banking
- o-AirBNB
- o-Splitwise
- o-Kanban

Always return the JSON configuration wrapped in <compose-view> tags, like this:
<compose-view>
{
    "id": "MainContainer",
    "layout": {
        "areas": "'content'",
        "columns": "1fr",
        "rows": "1fr",
        "overflow": "auto",
        "style": "p-4 max-w-7xl mx-auto"
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
Do not include any explanations or other text outside these tags.`;

export const viewAgentTools = [
    {
        name: 'extractViewAction',
        description: 'Extract view navigation intent from user messages',
        input_schema: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    enum: ['showView'],
                    description: 'The type of view action to perform'
                },
                view: {
                    type: 'string',
                    enum: AVAILABLE_COMPONENTS,
                    description: 'The view to navigate to (without o- prefix)'
                }
            },
            required: ['action', 'view']
        }
    }
];

// Main agent implementation
export const viewAgent = async (request: { task: string; context: Message[] }) => {
    try {
        const userMessage = request.task;
        console.log('Processing view request:', userMessage);

        conversationManager.addMessage(
            "Processing view request...",
            'vroni',
            'pending'
        );

        const response = await fetch('/local/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: viewSystemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0
            })
        });

        const data = await response.json();
        console.log('Vroni response:', data);

        const viewConfig = extractViewConfig(data.content[0].text);

        if (!viewConfig) {
            throw new Error('Invalid view configuration');
        }

        const message = `Navigating to ${viewConfig.children[0].component} view...`;

        conversationManager.addMessage(
            message,
            'vroni',
            'complete',
            {
                type: 'view',
                view: viewConfig,
                action: 'showView'
            }
        );

        return {
            success: true,
            message: {
                agent: 'vroni',
                content: message,
                payload: {
                    type: 'view',
                    view: viewConfig,
                    action: 'showView'
                }
            }
        };

    } catch (error) {
        console.error('View Agent Error:', error);
        conversationManager.addMessage(
            'Sorry, I could not process that view request.',
            'vroni',
            'error'
        );
        throw error;
    }
};
