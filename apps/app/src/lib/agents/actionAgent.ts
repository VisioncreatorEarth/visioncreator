import type { Anthropic } from '@anthropic-ai/sdk';
import { view as updateNameView } from '$lib/views/UpdateName';
import { view as sendMailView } from '$lib/views/SendMail';

const SYSTEM_PROMPT = `
You are an AI assistant specialized in handling action-based form interactions. Your task is to interpret user requests and return the appropriate form view configuration.

Available Actions:
1. "updateName" - For updating user names
2. "sendMail" - For sending email messages

When a user requests an action, return the configuration wrapped in <action-view> tags:
<action-view>
{
    "action": "[actionName]",
    "view": [viewConfiguration]
}
</action-view>

Do not modify the view configurations. Use them exactly as provided.
`;

const actionViews = {
    updateName: updateNameView,
    sendMail: sendMailView
};

export async function actionAgent(anthropic: Anthropic, request: any) {
    try {
        const userMessage = request.agentInput?.task || request.messages[request.messages.length - 1].content;
        console.log('Action agent processing message:', userMessage);

        let action = '';
        if (userMessage.toLowerCase().includes('update') && userMessage.toLowerCase().includes('name')) {
            action = 'updateName';
        } else if (userMessage.toLowerCase().includes('send') && userMessage.toLowerCase().includes('mail')) {
            action = 'sendMail';
        }

        if (action && actionViews[action]) {
            const actionConfig = {
                action: action,
                view: actionViews[action]
            };

            console.log('Action agent returning config:', JSON.stringify(actionConfig, null, 2));
            return {
                type: 'tool_result',
                tool_use_id: request.tool_use_id,
                content: actionConfig
            };
        }

        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: "I couldn't determine the appropriate action for your request.",
            is_error: true
        };
    } catch (error) {
        console.error('Error in actionAgent:', error);
        return {
            type: 'tool_result',
            tool_use_id: request.tool_use_id,
            content: 'An error occurred while processing your request in the actionAgent.',
            is_error: true
        };
    }
}
