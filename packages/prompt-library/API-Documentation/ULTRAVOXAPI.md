## SDK

Ultravox SDK
The Ultravox REST API is used to create calls but you must use one of the Ultravox client SDKs to join and end calls. This page primarily uses examples in JavaScript. The concepts are the same across all the different SDK implementations.

Ultravox Session
The core of the SDK is the UltravoxSession. The session is used to join and leave calls.

JavaScript
Flutter
Kotlin
Python
import { UltravoxSession } from 'ultravox-client';

const session = new UltravoxSession();
session.joinCall('wss://your-call-join-url');

session.leaveCall();

Methods
The UltravoxSession contains methods for:

Joining/leaving a call
Sending text messages to the agent
Changing the output medium for how the agent replies
Registering client tools
Muting the microphone/speaker
joinCall()
joinCall(joinUrl: string): UltravoxSessionState

Joins a call. Requires a joinUrl (string). Returns an UltravoxSessionState.

leaveCall()
async leaveCall(): Promise<void>

Leaves the current call. Returns a promise (with no return value) that resolves when the call has successfully been left.

sendText()
sendText(text: string): void

Sends a text message to the agent. Requires inputting the text message (string).

setOutputMedium()
setOutputMedium(medium: Medium): void

Sets the agent’s output medium for future utterances. If the agent is currently speaking, this will take effect at the end of the agent’s utterance. Also see muteSpeaker and unmuteSpeaker below.

parameter	description
medium	How replies are communicated. Must be either 'text' or 'voice'.
registerToolImplementation()
registerToolImplementation(name: string, implementation: ClientToolImplementation): void

Registers a client tool implementation with the given name. If the call is started with a client-implemented tool, this implementation will be invoked when the model calls the tool.

parameter	description
name	String. The name of the tool. Must match what is defined in selectedTools during call creation. If nameOverride is set then must match that name. Otherwise must match modelToolName.
implementation	ClientToolImplementation function that implements the tool’s logic.
ClientToolImplementation

This is a function that:

Accepts parameters → An object containing key-value pairs for the tool’s parameters. The keys will be strings.

Returns → Either a string result, or an object with a result string and a responseType, or a Promise that resolves to one of these.

For example:

  const stock_price = (parameters) => {
    ...  // to be implemented
    return `Stock price is ${value}`;
  };

registerToolImplementations()
registerToolImplementations(implementationMap: { [name: string]: ClientToolImplementation }): void

Convenience batch wrapper for registerToolImplementation.

implementationMap → An object where each key (a string) represents the name of the tool and each value is a ClientToolImplementation function.

isMicMuted()
isMicMuted(): boolean

Returns a boolen indicating if the end user’s microphone is muted. This is scoped to the Ultravox SDK and does not detect muting done by the user outside of your application.

isSpeakerMuted()
isSpeakerMuted(): boolean

Returns a boolen indicating if the speaker (the agent’s voice output) is muted. This is scoped to the Ultravox SDK and does not detect muting done by the user outside of your application.

muteMic()
muteMic(): void

Mutes the end user’s microphone. This is scoped to the Ultravox SDK.

unmuteMic()
unmuteMic(): void

Unmutes the end user’s microphone. This is scoped to the Ultravox SDK.

muteSpeaker()
muteSpeaker(): void

Mutes the end user’s speaker (the agent’s voice output). This is scoped to the Ultravox SDK.

unmuteSpeaker()
unmuteSpeaker(): void

Unmutes the end user’s speaker (the agent’s voice output). This is scoped to the Ultravox SDK.

Client Tools
Ultravox has robust support for tools. The SDK has support for client tools. Client tools will be invoked in your client code and enable you to add interactivity in your app that is driven by user interactions with your agent. For example, your agent could choose to invoke a tool that would trigger some UI change.

Creating Client Tools
Client tools are defined just like “server” tools with three exceptions:

1. “client” not “http”
You don’t add the URL and HTTP method for client tools. Instead, you add "client": {} to the tool definition.

Using a Client Tool
{
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": ...
  "selectedTools": [
    "temporaryTool": {
      "modelToolName": "stock_price",
      "description": "Get the current stock price for a given symbol",
      "dynamicParameters": [
        {
          "name": "symbol",
          "location": "PARAMETER_LOCATION_BODY",
          "schema": {
            "type": "string",
            "description": "Stock symbol (e.g., AAPL for Apple Inc.)"
          },
          "required": true
        }
      ],
      "client": {}
    }
  ]
}

Using a Server Tool
{
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": ...
  "selectedTools": [
    "temporaryTool": {
      "modelToolName": "stock_price",
      "description": "Get the current stock price for a given symbol",
      "dynamicParameters": [
        {
          "name": "symbol",
          "location": "PARAMETER_LOCATION_QUERY",
          "schema": {
            "type": "string",
            "description": "Stock symbol (e.g., AAPL for Apple Inc.)"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": "https://api.stockmarket.com/v1/price",
        "httpMethod": "GET"
      }
    }
  ]
}

2. Client Registration
Your client tool must be registered in your client code. Here’s a snippet that might be found in client code to register the client tool and implement the logic for the tool.

See SDK Methods for more information.

Registering a Client Tool
// Start up our Ultravox Session
uvSession = new UltravoxSession();

// Register our client-side tool
uvSession.registerToolImplementation(
  "stock_price",
  stock_price
);

uvSession.joinCall(joinUrl);

// Function that implements tool logic
const stock_price = (parameters) => {
  ...  // to be implemented
  return `Stock price is ${value}`;
};

3. Only Body Parameters
Unlike server tools (which accept parameters passed by path, header, body, etc.), client tools only allow parameters to be passed in the body of the request. That means client tools will always have parameter location set like this:

"location": "PARAMETER_LOCATION_BODY"

Session Status
The UltravoxSession exposes status. Based on the UltravoxSessionStatus enum, status can be one of the following:

status	description
disconnected	Session is not connected. This is the initial state prior to joinCall.
disconnecting	Session is in the process of disconnecting.
connecting	Session is establishing the connection.
idle	Session is connected but not yet active.
listening	Listening to the end user.
thinking	The model is processing/thinking.
speaking	The model is speaking.
Status Events
The status can be retrieved by adding an event listener to the session status. Building on what we did above:

JavaScript
Flutter
// Listen for status changing events
session.addEventListener('status', (event) => {
  console.log('Session status changed: ', session.status);
});

Transcripts
Sometimes you may want to augment the audio with text transcripts (e.g. if you want to show the end user the model’s output in real-time). Transcripts can be retrieved by adding an event listener:

import { UltravoxSession } from 'ultravox-client';

const session = new UltravoxSession();
session.joinCall('wss://your-call-join-url');

// Listen for transcripts changing events
session.addEventListener('transcripts', (event) => {
  console.log('Transcripts updated: ', session.transcripts);
});

session.leaveCall();

Transcripts are an array of transcript objects. Each transcript has the following properties:

property	type	definition
text	string	Text transcript of the speech from the end user or the agent.
isFinal	boolean	True if the transcript represents a complete utterance. False if it is a fragment of an utterance that is still underway.
speaker	Role	Either “user” or “agent”. Denotes who was speaking.
medium	Medium	Either “voice” or “text”. Denotes how the message was sent.
Debug Messages
No Guarantee

Debug messages from Ultravox should be treated as debug logs. They can change regularly and don’t have a contract. Relying on the specific structure or content should be avoided.

The UltravoxSession object also provides debug messages. Debug messages must be enabled when creating a new session and then are available via an event listener similar to status and transcripts:

import { UltravoxSession } from 'ultravox-client';

const debugMessages = new Set(["debug"]);
const session = new UltravoxSession({ experimentalMessages: debugMessages });
session.joinCall('wss://your-call-join-url');

// Listen for debug messages
session.addEventListener('experimental_message', (msg) => {
  console.log('Got a debug message: ', JSON.stringify(msg));
});

session.leaveCall();

Debug Message: Tool Call
When the agent invokes a tool, the message contains the function, all arguments, and an invocation ID:

Terminal window
LLM response: Tool calls: [FunctionCall(name='createProfile', args='{"firstName":"Ron","lastName":"Burgandy","organization":"Fixie.ai","useCase":"creating a talking AI news reporter"}', invocation_id='call_D2qQVS8OQc998aMEw5PRa9cF')]

Debug Message: Tool Call Result
When the tool call completes, the message contains an array of messages. Multiple tools can be invoked by the model. This message array will conatain all the calls followed by all the results. These messages are also available via List Call Messages.

Here’s an example of what we might see from a single tool invocation:

Terminal window
Tool call complete.

Result: [
  role: MESSAGE_ROLE_TOOL_CALL ordinal: 6 text: "{\"firstName\":\"Ron\",\"lastName\":\"Burgandy\",\"organization\":\"Fixie.ai\",\"useCase\":\"creating a talking AI news reporter\"}" tool_name: "createProfile" invocation_id: "call_D2qQVS8OQc998aMEw5PRa9cF" tool_id: "aa737e12-0989-4adb-9895-f387f40557d8" ,
  role: MESSAGE_ROLE_TOOL_RESULT ordinal: 7 text: "{\"firstName\":\"Ron\",\"lastName\":\"Burgandy\",\"emailAddress\":null,\"organization\":\"Fixie\",\"useCase\":\"creating a talking AI news reporter\"}" tool_name: "createProfile" invocation_id: "call_D2qQVS8OQc998aMEw5PRa9cF" tool_id: "aa737e12-0989-4adb-9895-f387f40557d8"
]

Quickstart
API Key Required

The Ultravox API (and the completion of this Quickstart) requires an API key.

You can sign-up for a free account that comes with 30 free minutes for creating calls.

Creating your first voice-powered AI agent with Ultravox is easy. This guide will walk you through the process of creating a simple voice-enabled AI agent.

There are three main steps to building a voice-enabled AI agent with the Ultravox API:

Create a Call → Construct a systemPrompt and choose a voice for your AI agent. This returns a joinUrl that you use to join the call.

Join the Call → Using the joinUrl from the previous step, join the call which starts a speech-to-speech conversation with your AI agent.

End the Call → When the conversation is complete, end the call to stop the conversation.

Create a Call
The first step is to create a call. This is done by doing a POST to the /calls endpoint. This call should be made from a server to prevent accidentally leaking your API key on the client. Here is what that looks like:

Terminal window
curl --location 'https://api.ultravox.ai/api/calls' \
--header 'Content-Type: application/json' \
--header 'X-API-Key: ••••••' \
--data '{
    "systemPrompt": "You are an expert on speech-to-speech communication.",
    "temperature": 0.8,
}'

This returns the following response:

{
    "callId": "9b74f1aa-0802-4198-a5f3-cfa89871aebb",
    "created": "2024-08-12T18:47:22.365692Z",
    "ended": null,
    "model": "fixie-ai/ultravox",
    "systemPrompt": "You are an expert on speech-to-speech communication.",
    "temperature": 0.8,
    "voice": null,
    "languageHint": null,
    "joinUrl": "wss://voice...app/calls/9b74f1aa-0802-4198-a5f3-cfa89871aebb"
}

We will ignore voice and languageHint for now.

The joinUrl will be used in the next step.

Join the Call
Now that we have a joinUrl, we can use the ultravox-client in our application to join the call. The ultravox-client is available for multiple languages. More info on the SDK page.

We need to reference the ultravox-client in our front-end, create an UltravoxSession, and then call the joinCall method:

<script type="module">
  import { UltravoxSession } from 'https://unpkg.com/ultravox-client/dist/esm/session.js?module';
  let UVSession = new UltravoxSession();
  const joinUrl = "wss://voice...app/calls/9b74f1aa-0802-4198-a5f3-cfa89871aebb" // From the POST to /calls
  UVSession.joinCall(joinUrl);
</script>

End the Call
When the call is over, simply use the endCall() method on the UltravoxSession object:

UVSession.leaveCall();

Examples
There are some examples you can fork and run.

Previous
Welcome

Tools in Ultravox
Tools in Ultravox are Different

Unlike using tools with single-generation LLM APIs, Ultravox actually calls your tool. This means you need to do a bit more work upfront in defining tools with the proper authentication and parameters.

“Server” vs. Client Tools

You can implement your tools as either server (the tool’s logic is exposed via a URL) or client (the tool’s logic is implemented in your client application) tools.

See Client Tools to learn how those are registered and used with the Ultravox SDK.

Temporary vs. Durable Tools
Ultravox supports two types of tools: temporary and durable. There is much more information below but there are a few things to consider right upfront:

Creation → Temporary tools are created in the request body when a new call is created. Durable tools are created using the Ultravox REST API.
No Functional Difference → There is no functional difference within the context of an Ultravox call between the two tool types.
Iteration Speed → Temporary tools are great when you are building out a new application and need to iterate.
Reuse & Collaboration → Durable tools are best when you have things dialed in and want to reuse tools across applications and/or work with a team and want to divide ownership of tools from the rest of your app.
Temporary Tools
Temporary tools are created each time you create a new Call and exist exclusively within the context of that call. (Temporary tools aren’t visible in the List Tools response for example.)

Iteration is faster when using temporary tools because you don’t have to create/update/delete tools as you build out your application. You can simply adjust the JSON in the request body and start a new call.

Creating & Using Temporary Tools
Temporary tools are defined and passed in the request body of the Create Call endpoint. They are available during the current call.

Creating an Ultravox Call with a Tool
{
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": ...
  "selectedTools": [
    "temporaryTool": {
      "modelToolName": "stock_price",
      "description": "Get the current stock price for a given symbol",
      "dynamicParameters": [
        {
          "name": "symbol",
          "location": "PARAMETER_LOCATION_QUERY",
          "schema": {
            "type": "string",
            "description": "Stock symbol (e.g., AAPL for Apple Inc.)"
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": "https://api.stockmarket.com/v1/price",
        "httpMethod": "GET"
      }
    }
  ]
}

Durable Tools
In addition to temporary tools, Ultravox supports the creation of durable tools. There is no functional difference between durable and temporary tools within the context of a call.

Durable tools are persisted and can be reused across calls or applications. They shine once you have things dialed in, when you want to share tools across multiple applications, or if you have split responsibilities on the team.

Creating Durable Tools
You create durable tools either by uploading an OpenAPI spec or via the request body in the Create Tool endpoint. Your OpenAPI spec must be either json or yaml format.

The /tools endpoint in the Ultravox API is for working with durable tools.

Using Durable Tools
To use a durable tool in a call, set the toolName or toolId field instead of temporaryTool. For example:

// Request body for creating an Ultravox call with a durable tool
{
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": ...
  "selectedTools": [
    "toolName": "stock_price",
  ]
}

Tool Authentication
Ultravox has rich support for tools auth. When creating a tool, you must specify what is required for successful auth to the backend service. Three methods for passing API keys are supported and are used when creating the tool:

Query Parameter → The API key will be passed via the query string. The name of the parameter must be provided when the tool is created.
Header → The API key will be passed via a custom header. The name of the header must be provided when the tool is created.
HTTP Authentication → The API key will be passed via the HTTP Authentication header. The name of the scheme (e.g. Bearer) must be provided when the tool is created.
You then pass in the key(s) in the authTokens property of selectedTools when creating a call.

Query Parameter
Header
HTTP Authentication
// Create a tool that uses a query parameter called 'apiKey'
{
  "name": "stock_price"
  "definition": {
    "description": "Get the current stock price for a given symbol",
    "requirements": {
      "httpSecurityOptions": {
        "options": [
          "requirements": {
            "mySeviceApiKey": {
              "queryApiKey": {
                "name": "apiKey"
              }
            }
          }
        ]
      }
    }
  }
}

// Pass the API key during call creation
{
  "model": "fixie-ai/ultravox-70B"
  "systemPrompt": ...
  "selectedTools": [
    {
      "toolName": "stock_price"
      "authTokens": {
        "myServiceApiKey": "your_token_here"
      }
    }
  ]
}

Tool Parameters
Tool parameters define what gets passed in to your backend service when the tool is called. When creating a tool, parameters are defined as one of three types:

Dynamic → The model will choose which values to pass. These are the parameters you’d use for a single-generation LLM API. Can be overridden (see below).
Static → Value is known when the tool is defined and is unconditionally set on invocations. Not exposed to or set by the model.
Automatic → Like “Static”, except that the value may not be known when the tool is defined but will instead be populated by the system when the tool is invoked.
Dynamic Parameters
Dynamic parameters will have their values set by the model. Creating a dynamic parameter on a tool looks like this:

// Adding a dynamic parameter to a stock price tool
{
  "name": "stock_price",
  "description": "Get the current stock price for a given symbol",
  "dynamicParameters": [
    {
      "name": "symbol",
      "location": "PARAMETER_LOCATION_QUERY",
      "schema": {
        "type": "string",
        "description": "Stock symbol (e.g., AAPL for Apple Inc.)"
      },
      "required": true
    }
  ]
}

Parameter Overrides
You can choose to set static values for dynamic parameters when you start a call. The model won’t see any parameters that you override. When creating a call simply pass in the overrides with each tool:

// Overriding dynamic parameter when starting a new call
// Always set the stock symbol to 'NVDA'
{
  "model": "fixie-ai/ultravox-70B",
  "systemPrompt": ...
  "selectedTools": [
    "toolName": "stock_price",
    "parameterOverrides": {
      "symbol": "NVDA"
    }
  ]
}

Parameter overrides don’t make sense for temporary tools. Instead of overriding a dynamic parameter, use a static parameter instead.

Static Parameters
If you have parameters that are known at the time you create the tool, static parameters can be used.

// Adding a static parameter that always sends utm=ultravox
{
  "name": "stock_price",
  "description": "Get the current stock price for a given symbol",
  "staticParameters": [
    {
      "name": "utm",
      "location": "PARAMETER_LOCATION_QUERY",
      "value": "ultravox"
    }
  ]
}

Automatic Parameters
Automatic parameters are used when you don’t want the model to specify the value and you don’t know the value when the tool is created. The primary use case for automatic parameters today is for using the call_id that is generated for the current call and then passing it as a unique identifier to your tool. Can also be used to get the current conversation history.

// Adding an automatic parameter to a profile creation tool
{
  "name": "create_profile",
  "description": "Creates a profile for the current caller",
  "automaticParameters": [
    {
      "name": "call_id",
      "location": "PARAMETER_LOCATION_QUERY",
      "knownValue": "KNOWN_PARAM_CALL_ID"
    }
  ]
}

Additional Information
Debugging
The Ultravox SDK enables viewing debug messages for any active call. These messages include tool calls. You can see a live demo of this on our website (make sure to toggle “Debug View” on at the bottom).

Tool Definition Schema
The definition object in the tool creation and update requests follows the BaseToolDefinition schema. Here’s a breakdown of its main components:

description (string): A clear, concise description of what the tool does.
dynamicParameters (array, optional): List of parameters that can be set by the AI model when using the tool. Each parameter is an object containining:
name (string): The name of the parameter.
location (string): Where the parameter is used (“PARAMETER_LOCATION_QUERY”, “PARAMETER_LOCATION_PATH”, “PARAMETER_LOCATION_HEADER”, “PARAMETER_LOCATION_BODY”).
schema (object): JSON Schema definition of the parameter. This typically includes things like type, description, enum values, format, other restrictions, etc.
required (boolean): Whether the parameter is required.
staticParameters (array, optional): List of parameters that are always set to a known, fixed value when the tool is used. These are unconditionally added when the tool is invoked. These parameters are not exposed to or set by the model. Example: you use an API for various things but want to track which requests come from your Ultravox app so you always append utm=ultravox to the query parameters.
automaticParameters (array, optional): Additional parameters automatically set by the system. Used when the value is not known when the tool is created but that will be known when the tool is called. Example: you want to use the unique call_id from ultravox as a key in your backend and you have the tool include call_id in the request body when your tool’s API is called.
requirements (object, optional): Any specific requirements for using the tool. Currently this is used for security (e.g. API keys or HTTP Auth).
http (object): Details for invoking the tool via HTTP. For server tools.
baseUrlPattern (string): The base URL pattern for the tool, possibly with placeholders for path parameters.
httpMethod (string): The HTTP method for the tool (e.g., “GET”, “POST”).
client (object): Declares the tool as a client tool. Exactly one of http or client must be set for a tool.
Best Practices for Creating Tools
Clear Naming: Choose a descriptive and unique name for your tool that clearly indicates its function.

Detailed Description: Provide a comprehensive description of what the tool does, including any important details about its usage or limitations. This and the name will help the model decide when and how to use your tool.

Precise Parameters: Define your dynamic parameters carefully, ensuring that the AI model has all the information it needs to use the tool effectively.

Error Handling: Consider how your tool will handle errors or unexpected inputs, and document this behavior in the tool’s description.

Iterate Faster: Use temporary tools when you are building your application. Persist durable tools in the system when things have stabilized.

Version Control: When updating tools, consider creating a new version (e.g., “stock_price_v2”) rather than modifying the existing tool. This allows testing of the new tool before impacting new calls made with the prior version of the tool.

Security: Be mindful of security when creating tools, especially when they interact with external APIs. Use appropriate authentication methods and avoid exposing sensitive information.

Testing: Thoroughly test your tools before deploying them in production conversations to ensure they function as expected.



Call Stages
The Ultravox API’s Call Stages functionality allows you to create dynamic, multi-stage conversations. Stages enable more complex and nuanced agent interactions, giving you fine-grained control over the conversation flow.

Each stage can have a new system prompt, a different set of tools, a new voice, an updated conversation history, and more.

Understanding Call Stages
Call Stages (“Stages”) provide a way to segment a conversation into distinct phases, each with its own system prompt and potentially different parameters. This enables interactions that can adapt and change focus as the conversation progresses.

Key points to understand about Stages:

Dynamic System Prompts → Stages allow you to give granular system prompts to the model as the conversation progresses.

Flexibility → You have full control to determine when and how you want the conversation to progress to the next stage.

Thoughtful Design → Implementing stages requires careful planning and consideration of the conversation structure. Consider how to handle stage transitions and test thoroughly to ensure a natural flow to the conversation.

Maintain Context → Think about how the agent will maintain context about the user between stages if you need to ensure a coherent conversation.

Advanced Feature

Stages require planning and careful implementation. Stages are likely not required for simple use cases.

Creating and Managing Stages
To implement Call Stages in your Ultravox application, follow these steps:

1. Plan Your Stages
Determine the different phases of your conversation and what prompts or parameters should change at each stage.

2. Implement a Stage Change Tool
Create a custom tool that will trigger stage changes when called. This tool should:

Respond with a new-stage response type. This creates the new stage. How you send the response depends on the tool type:
For server/HTTP tools, set the X-Ultravox-Response-Type header to new-stage.
For client tools, set responseType="new-stage" on your ClientToolResult object.
Provide the updated parameters (e.g., system prompt, tools, voice) for the new stage in the response body.
Unless overridden, stages inherit all properties of the existing call. See Stages Call Properties for the list of call properties that can be changed.

3. Configure Stage Transitions
Prompt the agent to use the stage change tool at appropriate points in the conversation.
Ensure the stage change tool is part of selectedTools when creating the call as well as during new stages (if needed).
Update your system prompt as needed to instruct the agent on when/how to use the stage change tool.
Things to Remember

New stages inherit all properties from the previous stage unless explicitly overridden.
Refer to Stages Call Properties to understand which call properties can be changed as part of a new stage.
Test your stage transitions thoroughly to ensure the conversation flows naturally.
Example Stage Change Implementation
Here’s a basic example of how to implement a new call stage.

First, we create a tool that is responsible for changing stages:

Basic stage change tool
function changeStage(requestBody) {
  const responseBody = {
    systemPrompt: "...", // new prompt
    ... // other properties
  };

  return {
    body: responseBody,
    headers: {
      'X-Ultravox-Response-Type': 'new-stage'
    }
  };
}

We also need to ensure that we have instructed our agent to use the tool and that we add the tool to our selectedTools during the creation of the call.

Updating our systemPrompt and selectedTools
// Instruct the agent on how to use the stage management tool
// Add the tool to selectedTools
{
  systemPrompt: "You are a helpful assistant...you have access to a tool called changeStage...",
  ...
  selectedTools: [
    {
      "temporaryTool": {
        "modelToolName": "changeStage",
        "description": ...,
        "dynamicParameters": [...],
      }
    }
  ]
}

Inheritance

New stages inherit all properties from the previous stage. You can selectively overwrite properties as needed when defining a new stage.

See Stages Call Properties for more.

Ultravox API Implications
If you are not using stages for a call, retrieving calls or call messages via the API (e.g. GET /api/calls) works as expected.

However, if you are using call stages then you most likely want to use the stage-centric API endpoints to get stage-specific settings, messages, etc.

Use GET /api/calls/{call_id}/stages to get all the stages for a given call.

Ultravox API	Description	Stage-Centric Equivalent	Description
/calls/{call_id}	Get a call	/calls/{call_id}/stages/{call_stage_id}	Get the call stage
/calls/{call_id}/messages	Get messages for a call	/calls/{call_id}/stages/{call_stage_id}/messages	Get message for the stage
/calls/{call_id}/tools	Get tools for a call	/calls/{call_id}/stages/{call_stage_id}/tools	Get tools for the stage
Stages Call Properties
Tip

The schema used for a Stages response body is a subset of the request body schema used when creating a new call. The response body must contain the new values for any properties you want to change in the new stage.

Unless overridden, stages inherit all properties of the existing call.

Here is the list of all call properties that can and cannot be changed during a new stage:

property	change with new stage?
systemPrompt	Yes
temperature	Yes
voice	Yes
languageHint	Yes
initialMessages	Yes
selectedTools	Yes
firstSpeaker	No
model	No
joinTimeout	No
maxDuration	No
timeExceededMessage	No
inactivityMessages	No
medium	No
initiator	No
recordingEnabled	No
Use Cases for Call Stages
Call Stages are particularly useful for complex conversational flows. Here are some example scenarios:

Data Gathering → Scenarios where the agent needs to collect a lot of data. Examples: job applications, medical intake forms, applying for a mortgage.

Here are potential stages for a Mortgage Application:

Stage 1: Greeting and basic information gathering
Stage 2: Financial assessment
Stage 3: Property evaluation
Stage 4: Presentation of loan options
Stage 5: Hand-off to loan officer
Switching Contexts → Scenarios where the agent needs to navigate different contexts. Examples: customer support escalation, triaging IT issues.

Let’s consider what the potential stages might be for Customer Support:

Stage 1: Initial greeting and problem identification
Stage 2: Troubleshooting
Stage 3: Resolution or escalation (to another stage or to a human support agent)
Conclusion
Call Stages in the Ultravox API give you the ability to create adaptive conversations for more complex scenarios like data gathering or switching contexts. By allowing granular control over system prompts and conversation parameters at different stages, you can create more dynamic and context-aware interactions.

Ultravox + Telephony
The Ultravox API allows you to create AI-powered voice applications that can interact with regular phone numbers. This enables Ultravox AI agents to make outgoing calls and receive incoming calls from traditional phone networks.

Twilio Support

We currently integrate with Twilio. Please let us know if there’s another integration you’d like to see.

This guide will walk you through the process of setting up and using the Ultravox API with Twilio for both outgoing and incoming phone calls.

Creating a Phone Call with Twilio
Prerequisites

Make sure you have:

An active Twilio account
A phone number purchased from Twilio
Creating an Ultravox call that works with Twilio is just like creating a WebRTC call, but there are two parameters to the Create Call command worth special attention:

medium	object	Tells Ultravox which protocol to use.
For Twilio, must be set to {"twilio": {}} and sets the call to use Twilio Media Streams. Defaults to {"webRtc": {}} which sets the protocol to WebRTC.
initiator	string	Tells Ultravox who started the call. For outgoing calls, typically set to "INITIATOR_AGENT". Default is "INITIATOR_USER".
Adding these to the request body when creating the call would look like this:

{
  "systemPrompt": "You are a helpful assistant...",
  ...
  "medium": {
    "twilio": {}
  },
  "initiator": "INITIATOR_AGENT"
}

Ultravox will return a joinUrl that can then be used with Twilio for outgoing or incoming calls.

Outgoing Calls
It only takes two steps to make an outgoing call to regular phone numbers through Twilio:

Create an Ultravox Call → Create a new call (see above), and get a joinUrl.

Initiate Twilio Phone call → Use the joinUrl with a Twilio <Stream>.

// Example using the twilio node library
const call = await client.calls.create({
    twiml: `<Response>
                <Connect>
                    <Stream url="${joinUrl}"/>
                </Connect>
            </Response>`,
    to: phoneNumber, // the number you are calling
    from: twilioPhoneNumber // your twilio number
});

See the twilio-outgoing-call example for more.

This example shows one of the many options Twilio provides for making outgoing calls. Consult the Twilio docs for more details.

Incoming Calls
Incoming calls require essentially the same two steps as outgoing calls:

Create an Ultravox Call → Create a new call (see above), and get a joinUrl. Note: for incoming calls you will want to keep initiator set to the default (“user”).

Receive Inbound Twilio Phone call → Use the joinUrl with a Twilio <Stream>.

<!-- Example using a TwiML Bin -->
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Connect>
        <Stream url="your_ultravox_join_url" />
    </Connect>
</Response>

The above shows how to create a TwiML Bin and use that for handling the inbound call. Consult the Twilio docs for more on all the options Twilio provides for handling phone calls.

Conclusion
By integrating the Ultravox API with Twilio, you can create powerful AI-driven voice applications that interact with regular phone networks. This opens up a wide range of possibilities for customer service, automated outreach, and other voice-based AI applications.

Tutorial: Building Interactive UI with Client Tools
This tutorial walks you through implementing client-side tools in Ultravox to create real-time, interactive UI elements. You’ll build a drive-thru order display screen that updates dynamically as customers place orders through an AI agent.

What you’ll learn:

How to define and implement client tools
Real-time UI updates using custom events
State management with React components
Integration with Ultravox’s AI agent system
Time to complete: 30 minutes

Prerequisites
Before starting this tutorial, make sure you have:

Basic knowledge of TypeScript and React
The starter code from our tutorial repository
Node.js 16+ installed on your machine
Understanding Client Tools
Client tools in Ultravox enable direct interaction between AI agents and your frontend application. Unlike server-side tools that handle backend operations, client tools are specifically designed for:

UI Updates → Modify interface elements in real-time
State Management → Handle application state changes
User Interaction → Respond to and process user actions
Event Handling → Dispatch and manage custom events
Project Overview: Dr Donut Drive-Thru
We’ll build a drive-thru order display for a fictional restaurant called “Dr. Donut”. The display will update in real-time as customers place orders through our AI agent.

Implementation Steps
Define the Tool → Create a schema for order updates
Implement Logic → Build the tool’s functionality
Register the Tool → Connect it to the Ultravox system
Create the UI → Build the order display component
Stuck?

If at any point you get lost, you can refer to the /final folder in the repo to get final versions of the various files you will create or edit.

Step 1: Define the Tool
First, we’ll define our updateOrder tool that the AI agent will use to modify the order display.

Modify .demo-config.ts:

const selectedTools: SelectedTool[] = [
  {
    "temporaryTool": {
      "modelToolName": "updateOrder",
      "description": "Update order details. Used any time items are added or removed or when the order is finalized. Call this any time the user updates their order.",
      "dynamicParameters": [
        {
          "name": "orderDetailsData",
          "location": ParameterLocation.BODY,
          "schema": {
            "description": "An array of objects contain order items.",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { "type": "string", "description": "The name of the item to be added to the order." },
                "quantity": { "type": "number", "description": "The quantity of the item for the order." },
                "specialInstructions": { "type": "string", "description": "Any special instructions that pertain to the item." },
                "price": { "type": "number", "description": "The unit price for the item." },
              },
              "required": ["name", "quantity", "price"]
            }
          },
          "required": true
        },
      ],
      "client": {}
    }
  },
];

Here’s what this is doing:

Defines a client tool called updateOrder and describes what it does and how to use it.
Defines a single, required parameter called orderDetailsData that:
Is passed in the request body
Is an array of objects where each object can contain name, quantity, specialInstructions, and price. Only specialInstructions is optional.
Update System Prompt
Now, we need to update the system prompt to tell the agent how to use the tool.

Update the sysPrompt variable:

sysPrompt = `
  # Drive-Thru Order System Configuration

  ## Agent Role
  - Name: Dr. Donut Drive-Thru Assistant
  - Context: Voice-based order taking system with TTS output
  - Current time: ${new Date()}

  ## Menu Items
    # DONUTS
    PUMPKIN SPICE ICED DOUGHNUT $1.29
    PUMPKIN SPICE CAKE DOUGHNUT $1.29
    OLD FASHIONED DOUGHNUT $1.29
    CHOCOLATE ICED DOUGHNUT $1.09
    CHOCOLATE ICED DOUGHNUT WITH SPRINKLES $1.09
    RASPBERRY FILLED DOUGHNUT $1.09
    BLUEBERRY CAKE DOUGHNUT $1.09
    STRAWBERRY ICED DOUGHNUT WITH SPRINKLES $1.09
    LEMON FILLED DOUGHNUT $1.09
    DOUGHNUT HOLES $3.99

    # COFFEE & DRINKS
    PUMPKIN SPICE COFFEE $2.59
    PUMPKIN SPICE LATTE $4.59
    REGULAR BREWED COFFEE $1.79
    DECAF BREWED COFFEE $1.79
    LATTE $3.49
    CAPPUCINO $3.49
    CARAMEL MACCHIATO $3.49
    MOCHA LATTE $3.49
    CARAMEL MOCHA LATTE $3.49

  ## Conversation Flow
  1. Greeting -> Order Taking -> Call "updateOrder" Tool -> Order Confirmation -> Payment Direction

  ## Tool Usage Rules
  - You must call the tool "updateOrder" immediately when:
    - User confirms an item
    - User requests item removal
    - User modifies quantity
  - Do not emit text during tool calls
  - Validate menu items before calling updateOrder

  ## Response Guidelines
  1. Voice-Optimized Format
    - Use spoken numbers ("one twenty-nine" vs "$1.29")
    - Avoid special characters and formatting
    - Use natural speech patterns

  2. Conversation Management
    - Keep responses brief (1-2 sentences)
    - Use clarifying questions for ambiguity
    - Maintain conversation flow without explicit endings
    - Allow for casual conversation

  3. Order Processing
    - Validate items against menu
    - Suggest similar items for unavailable requests
    - Cross-sell based on order composition:
      - Donuts -> Suggest drinks
      - Drinks -> Suggest donuts
      - Both -> No additional suggestions

  4. Standard Responses
    - Off-topic: "Um... this is a Dr. Donut."
    - Thanks: "My pleasure."
    - Menu inquiries: Provide 2-3 relevant suggestions

  5. Order confirmation
    - Call the "updateOrder" tool first
    - Only confirm the full order at the end when the customer is done

  ## Error Handling
  1. Menu Mismatches
    - Suggest closest available item
    - Explain unavailability briefly
  2. Unclear Input
    - Request clarification
    - Offer specific options
  3. Invalid Tool Calls
    - Validate before calling
    - Handle failures gracefully

  ## State Management
  - Track order contents
  - Monitor order type distribution (drinks vs donuts)
  - Maintain conversation context
  - Remember previous clarifications
  `;

Update Configuration + Import
Now we need to add the selectedTools to our call definition and update our import statement.

Add the tool to your demo configuration:

export const demoConfig: DemoConfig = {
  title: "Dr. Donut",
  overview: "This agent has been prompted to facilitate orders at a fictional drive-thru called Dr. Donut.",
  callConfig: {
    systemPrompt: getSystemPrompt(),
    model: "fixie-ai/ultravox-70B",
    languageHint: "en",
    selectedTools: selectedTools,
    voice: "Mark",
    temperature: 0.4
  }
};

Add ParameterLocation and SelectedTool to our import:

import { DemoConfig, ParameterLocation, SelectedTool } from "@/lib/types";

Step 2: Implement Tool Logic
Now that we’ve defined the updateOrder tool, we need to implement the logic for it.

Create /lib/clientTools.ts to handle the tool’s functionality:

import { ClientToolImplementation } from 'ultravox-client';

export const updateOrderTool: ClientToolImplementation = (parameters) => {
  const { ...orderData } = parameters;

  if (typeof window !== "undefined") {
    const event = new CustomEvent("orderDetailsUpdated", {
      detail: orderData.orderDetailsData,
    });
    window.dispatchEvent(event);
  }

  return "Updated the order details.";
};

We will do most of the heavy lifting in the UI component that we’ll build in step 4.

Step 3: Register the Tool
Next, we are going to register the client tool with the Ultravox client SDK.

Update /lib/callFunctions.ts:

import { updateOrderTool } from '@/lib/clientTools';

// Initialize Ultravox session
uvSession = new UltravoxSession({ experimentalMessages: debugMessages });

// Register tool
uvSession.registerToolImplementation(
    "updateOrder",
    updateOrderTool
);

// Handle call ending -- This allows clearing the order details screen
export async function endCall(): Promise<void> {
  if (uvSession) {
    uvSession.leaveCall();
    uvSession = null;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('callEnded'));
    }
  }
}

Step 4: Build the UI
Create a new React component to display order details. This component will:

Listen for order updates
Format currency and order items
Handle order clearing when calls end
Create /components/OrderDetails.tsx:

'use client';

import React, { useState, useEffect } from 'react';
import { OrderDetailsData, OrderItem } from '@/lib/types';

// Function to calculate order total
function prepOrderDetails(orderDetailsData: string): OrderDetailsData {
  try {
    const parsedItems: OrderItem[] = JSON.parse(orderDetailsData);
    const totalAmount = parsedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Construct the final order details object with total amount
    const orderDetails: OrderDetailsData = {
      items: parsedItems,
      totalAmount: Number(totalAmount.toFixed(2))
    };

    return orderDetails;
  } catch (error) {
    throw new Error(`Failed to parse order details: ${error}`);
  }
}

const OrderDetails: React.FC = () => {
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData>({
    items: [],
    totalAmount: 0
  });

  useEffect(() => {
    // Update order details as things change
    const handleOrderUpdate = (event: CustomEvent<string>) => {
      console.log(`got event: ${JSON.stringify(event.detail)}`);

      const formattedData: OrderDetailsData = prepOrderDetails(event.detail);
      setOrderDetails(formattedData);
    };

    // Clear out order details when the call ends so it's empty for the next call
    const handleCallEnded = () => {
      setOrderDetails({
        items: [],
        totalAmount: 0
      });
    };

    window.addEventListener('orderDetailsUpdated', handleOrderUpdate as EventListener);
    window.addEventListener('callEnded', handleCallEnded as EventListener);

    return () => {
      window.removeEventListener('orderDetailsUpdated', handleOrderUpdate as EventListener);
      window.removeEventListener('callEnded', handleCallEnded as EventListener);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatOrderItem = (item: OrderItem, index: number) => (
    <div key={index} className="mb-2 pl-4 border-l-2 border-gray-200">
      <div className="flex justify-between items-center">
        <span className="font-medium">{item.quantity}x {item.name}</span>
        <span className="text-gray-600">{formatCurrency(item.price * item.quantity)}</span>
      </div>
      {item.specialInstructions && (
        <div className="text-sm text-gray-500 italic mt-1">
          Note: {item.specialInstructions}
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-10">
      <h1 className="text-xl font-bold mb-4">Order Details</h1>
      <div className="shadow-md rounded p-4">
        <div className="mb-4">
          <span className="text-gray-400 font-mono mb-2 block">Items:</span>
          {orderDetails.items.length > 0 ? (
            orderDetails.items.map((item, index) => formatOrderItem(item, index))
          ) : (
            <span className="text-gray-500 text-base font-mono">No items</span>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center font-bold">
            <span className="text-gray-400 font-mono">Total:</span>
            <span>{formatCurrency(orderDetails.totalAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

Add to Main Page
Update the main page (page.tsx) to include the new component:

import OrderDetails from '@/components/OrderDetails';

// In the JSX:
{/* Call Status */}
<CallStatus status={agentStatus}>
    <OrderDetails />
</CallStatus>

Testing Your Implementation
Start the development server:

Terminal window
pnpm run dev

Navigate to http://localhost:3000

Start a call and place an order. You should see:

Real-time updates to the order display
Formatted prices and item details
Special instructions when provided
Order clearing when calls end
Next Steps
Now that you’ve implemented basic client tools, you can:

Add additional UI features like order modification or nutritional information
Add animations for updates
Enhance the display with customer and/or vehicle information

Tutorial: Customer Escalation with Call Stages
Learn how to implement customer service escalation in Ultravox using call stages to handle customer complaints by transferring them to a manager.

What you’ll learn:

How to implement an escalation tool
How to use call stages to switch conversation context
How to handle manager takeover with a new system prompt
Testing escalation scenarios
Time to complete: 25 minutes

Prerequisites
Before starting this tutorial, make sure you have:

Basic knowledge of TypeScript and React
The starter code from our tutorial repository
Node.js 16+ installed on your machine
ngrok installed on your machine
Understanding Call Stages
Call stages in Ultravox enable dynamic changes to an ongoing conversation by:

Switching system prompts mid-conversation
Changing voice personalities
Maintaining conversation context
Handling role transitions seamlessly
In this tutorial, we’ll use call stages to transfer angry customers to a manager who can better handle their complaints.

Project Overview: Dr. Donut Manager Escalation
We’ll build an escalation system for our Dr. Donut drive-thru that allows the AI agent to transfer difficult situations to a manager. The system will:

Recognize when a customer needs manager assistance
Collect complaint details
Switch to a manager persona with authority to resolve issues
Implementation Steps
Set Up ngrok → Enable external access to our escalation endpoint
Define the Tool → Create a schema for escalation requests
Create Manager Handler → Build the API route for manager takeover
Update System Prompt → Add escalation rules to the base prompt
Test the System → Verify escalation flows
Stuck?

If at any point you get lost, you can refer to the /final folder in the repo to get final versions of the various files you will create or edit.

Debugging

During testing, watch your terminal for ngrok request logs to verify the escalation endpoint is being called correctly.

Step 1: Set Up ngrok
First, we need to make our escalation endpoint accessible to Ultravox.

Start your development server:
Terminal window
pnpm run dev

In a new terminal, start ngrok:
Terminal window
ngrok http 3000

Copy the HTTPS URL from ngrok (it will look like https://1234-56-78-910-11.ngrok-free.app)

Update toolsBaseUrl in demo-config.ts:

const toolsBaseUrl = 'https://your-ngrok-url-here';

Step 2: Define the Escalation Tool
We’ll define an escalateToManager tool that the AI agent will use to transfer difficult customers.

Update the selectedTools array in demo-config.ts and add to our call definition:

const selectedTools: SelectedTool[] = [
  {
    "temporaryTool": {
      "modelToolName": "escalateToManager",
      "description": "Escalate to the manager in charge. Use this tool if a customer becomes irate, asks for a refund, or complains about the food.",
      "dynamicParameters": [
        {
          "name": "complaintDetails",
          "location": ParameterLocation.BODY,
          "schema": {
            "description": "An object containing details about the nature of the complaint or issue.",
            "type": "object",
            "properties": {
              "complaintType": {
                "type": "string",
                "enum": ["refund", "food", "price", "other"],
                "description": "The type of complaint."
              },
              "complaintDetails": {
                "type": "string",
                "description": "The details of the complaint."
              },
              "desiredResolution": {
                "type": "string",
                "description": "The resolution the customer is seeking."
              },
              "firstName": {
                "type": "string",
                "description": "Customer first name."
              },
              "lastName": {
                "type": "string",
                "description": "Customer last name."
              }
            },
            "required": ["complaintType", "complaintDetails"]
          },
          "required": true
        }
      ],
      "http": {
        "baseUrlPattern": `${toolsBaseUrl}/api/managerEscalation`,
        "httpMethod": "POST"
      }
    }
  }
];

// Update call definition to add selectedTools
export const demoConfig: DemoConfig = {
  title: "Dr. Donut",
  overview: "This agent has been prompted to facilitate orders at a fictional drive-thru called Dr. Donut.",
  callConfig: {
    systemPrompt: getSystemPrompt(),
    model: "fixie-ai/ultravox-70B",
    languageHint: "en",
    voice: "Mark",
    temperature: 0.4,
    selectedTools: selectedTools
  }
};

Step 3: Create Manager Handler
Create a new file at app/api/managerEscalation/route.ts to handle the escalation:

import { NextRequest, NextResponse } from 'next/server';

const managerPrompt: string = `
  # Drive-Thru Order System Configuration

  ## Agent Role
  - Name: Dr. Donut Drive-Thru Manager
  - Context: Voice-based order taking system with TTS output
  - Current time: ${new Date()}

  ## Menu Items
    [Menu items section - same as base prompt]

  ## Conversation Flow
  1. Greeting -> Apologize for Situation -> Offer Resolution -> Order Confirmation -> End

  ## Response Guidelines
  1. Voice-Optimized Format
    - Use spoken numbers ("one twenty-nine" vs "$1.29")
    - Avoid special characters and formatting
    - Use natural speech patterns

  2. Conversation Management
    - Keep responses brief (1-2 sentences)
    - Use clarifying questions for ambiguity
    - Maintain conversation flow without explicit endings
    - Allow for casual conversation

  3. Greeting
    - Tell the customer that you are the manager
    - Inform the customer you were just informed of the issue
    - Then move to the apology

  4. Apology
    - Acknowledge customer concern
    - Apologize and reaffirm Dr. Donut's commitment to quality and customer happiness

  5. Resolving Customer Concern
    - Offer reasonable remedy
    - Maximum refund amount equal to purchase amount
    - Offer $10 or $20 gift cards for more extreme issues

  [Rest of guidelines section]
`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log(`Got escalation!`);

  // Set-up escalation
  const responseBody = {
    systemPrompt: managerPrompt,
    voice: 'Jessica'  // Different voice for manager
  };
  const response = NextResponse.json(responseBody);
  // Set our custom header for starting a new call stage
  response.headers.set('X-Ultravox-Response-Type', 'new-stage');

  return response;
}

Step 4: Update System Prompt
Add escalation rules to your base system prompt in demo-config.ts:

## Response Guidelines
  [Previous guidelines...]

  6. Angry Customers or Complaints
    - You must escalate to your manager for angry customers, refunds, or big problems
    - Before you escalate, ask the customer if they would like to talk to your manager
    - If the customer wants the manager, you MUST call the tool "escalateToManager"

  ## State Management
    [Previous instructions...]
  - Use the "escalateToManager" tool for any complaints or angry customers

Testing Your Implementation
Here are three scenarios to test the escalation system:

Scenario 1: Food Quality Issue
Customer: "I just found hair in my donuts! This is disgusting!"
Expected: Agent should offer manager assistance and escalate with complaint type "food"

Scenario 2: Out of Stock Frustration
Customer: "You don't have the Magic Rainbow donuts in stock and this is the third time I drove down here this week for them! This is ridiculous!"
Expected: Agent should offer manager assistance and escalate with complaint type "other"

Scenario 3: Product and Refund
Customer: "This coffee is cold and I want a refund right now!"
Expected: Agent should offer manager assistance and escalate with complaint type "refund"

For each scenario, verify:

The agent offers manager assistance
The escalation tool is called with appropriate details
The manager persona takes over with the new voice
The manager follows the resolution guidelines
Common Issues
ngrok URL Not Working

Make sure ngrok is running
Check the URL is correctly copied to demo-config.ts
Verify no trailing slash in the URL
Escalation Not Triggering

Check the system prompt includes escalation guidelines
Verify the complaint is clearly expressed
Try using keywords like “manager”, “refund”, or “complaint”
Manager Voice Not Changing

Verify the X-Ultravox-Response-Type header is set
Check the voice parameter in the response body
Next Steps
Now that you’ve implemented basic escalation, you can:

Implement different manager personalities for different situations
Create a complaint logging system
Add resolution tracking and follow-up mechanisms




## REST API

openapi: 3.0.3
info:
  title: Ultravox
  version: 0.1.0
  description: API for the Ultravox service.
paths:
  /api/accounts:
    get:
      operationId: accounts_list
      tags:
      - accounts
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Account'
          description: ''
  /api/accounts/me:
    get:
      operationId: accounts_me_retrieve
      tags:
      - accounts
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Account'
          description: ''
  /api/api_keys:
    get:
      operationId: api_keys_list
      description: Gets the current user's API keys.
      parameters:
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - api_keys
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedAPIKeyList'
          description: ''
    post:
      operationId: api_keys_create
      description: Creates a new API key.
      tags:
      - api_keys
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/APIKeyCreate'
        required: true
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/APIKeyCreate'
          description: ''
  /api/api_keys/{api_key_prefix}:
    get:
      operationId: api_keys_retrieve
      description: Gets an API key.
      parameters:
      - in: path
        name: api_key_prefix
        schema:
          type: string
        required: true
      tags:
      - api_keys
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/APIKey'
          description: ''
    put:
      operationId: api_keys_update
      description: Updates an API key.
      parameters:
      - in: path
        name: api_key_prefix
        schema:
          type: string
        required: true
      tags:
      - api_keys
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/APIKey'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/APIKey'
          description: ''
    patch:
      operationId: api_keys_partial_update
      description: Updates an API key.
      parameters:
      - in: path
        name: api_key_prefix
        schema:
          type: string
        required: true
      tags:
      - api_keys
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatchedAPIKey'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/APIKey'
          description: ''
    delete:
      operationId: api_keys_destroy
      description: Deletes an API key.
      parameters:
      - in: path
        name: api_key_prefix
        schema:
          type: string
        required: true
      tags:
      - api_keys
      responses:
        '204':
          description: No response body
  /api/calls:
    get:
      operationId: calls_list
      parameters:
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedCallList'
          description: ''
    post:
      operationId: calls_create
      parameters:
      - in: query
        name: priorCallId
        schema:
          type: string
          format: uuid
        description: The UUID of a prior call. When specified, the new call will use
          the same properites as the prior call unless overriden in this request's
          body. The new call will also use the prior call's message history as its
          own initial_messages. (It's illegal to also set initial_messages in the
          body.)
      tags:
      - calls
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ultravox.v1.StartCallRequest'
      security:
      - apiKeyAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Call'
          description: ''
  /api/calls/{call_id}:
    get:
      operationId: calls_retrieve
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Call'
          description: ''
    delete:
      operationId: calls_destroy
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '204':
          description: No response body
  /api/calls/{call_id}/messages:
    get:
      operationId: calls_messages_list
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Paginatedultravox.v1.MessageList'
          description: ''
  /api/calls/{call_id}/recording:
    get:
      operationId: calls_recording_retrieve
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          description: No response body
  /api/calls/{call_id}/stages:
    get:
      operationId: calls_stages_list
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedCallStageList'
          description: ''
  /api/calls/{call_id}/stages/{call_stage_id}:
    get:
      operationId: calls_stages_retrieve
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      - in: path
        name: call_stage_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CallStage'
          description: ''
  /api/calls/{call_id}/stages/{call_stage_id}/messages:
    get:
      operationId: calls_stages_messages_list
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      - in: path
        name: call_stage_id
        schema:
          type: string
          format: uuid
        required: true
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Paginatedultravox.v1.MessageList'
          description: ''
  /api/calls/{call_id}/stages/{call_stage_id}/tools:
    get:
      operationId: calls_stages_tools_list
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      - in: path
        name: call_stage_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CallTool'
          description: ''
  /api/calls/{call_id}/tools:
    get:
      operationId: calls_tools_list
      parameters:
      - in: path
        name: call_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - calls
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/CallTool'
          description: ''
  /api/schema/:
    get:
      operationId: schema_retrieve
      description: |-
        OpenApi3 schema for this API. Format can be selected via content negotiation.

        - YAML: application/vnd.oai.openapi
        - JSON: application/vnd.oai.openapi+json
      parameters:
      - in: query
        name: format
        schema:
          type: string
          enum:
          - json
          - yaml
      - in: query
        name: lang
        schema:
          type: string
          enum:
          - af
          - ar
          - ar-dz
          - ast
          - az
          - be
          - bg
          - bn
          - br
          - bs
          - ca
          - ckb
          - cs
          - cy
          - da
          - de
          - dsb
          - el
          - en
          - en-au
          - en-gb
          - eo
          - es
          - es-ar
          - es-co
          - es-mx
          - es-ni
          - es-ve
          - et
          - eu
          - fa
          - fi
          - fr
          - fy
          - ga
          - gd
          - gl
          - he
          - hi
          - hr
          - hsb
          - hu
          - hy
          - ia
          - id
          - ig
          - io
          - is
          - it
          - ja
          - ka
          - kab
          - kk
          - km
          - kn
          - ko
          - ky
          - lb
          - lt
          - lv
          - mk
          - ml
          - mn
          - mr
          - ms
          - my
          - nb
          - ne
          - nl
          - nn
          - os
          - pa
          - pl
          - pt
          - pt-br
          - ro
          - ru
          - sk
          - sl
          - sq
          - sr
          - sr-latn
          - sv
          - sw
          - ta
          - te
          - tg
          - th
          - tk
          - tr
          - tt
          - udm
          - ug
          - uk
          - ur
          - uz
          - vi
          - zh-hans
          - zh-hant
      tags:
      - schema
      security:
      - apiKeyAuth: []
      - {}
      responses:
        '200':
          content:
            application/vnd.oai.openapi:
              schema:
                type: object
                additionalProperties: {}
            application/yaml:
              schema:
                type: object
                additionalProperties: {}
            application/vnd.oai.openapi+json:
              schema:
                type: object
                additionalProperties: {}
            application/json:
              schema:
                type: object
                additionalProperties: {}
          description: ''
  /api/tools:
    get:
      operationId: tools_list
      parameters:
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - tools
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedToolList'
          description: ''
    post:
      operationId: tools_create
      tags:
      - tools
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Tool'
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                  description: An OpenAPI schema file in either JSON or YAML format.
              required:
              - file
      security:
      - apiKeyAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Tool'
          description: ''
  /api/tools/{tool_id}:
    get:
      operationId: tools_retrieve
      parameters:
      - in: path
        name: tool_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - tools
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Tool'
          description: ''
    put:
      operationId: tools_update
      parameters:
      - in: path
        name: tool_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - tools
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Tool'
        required: true
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Tool'
          description: ''
    delete:
      operationId: tools_destroy
      parameters:
      - in: path
        name: tool_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - tools
      security:
      - apiKeyAuth: []
      responses:
        '204':
          description: No response body
  /api/voices:
    get:
      operationId: voices_list
      parameters:
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - voices
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedVoiceList'
          description: ''
    post:
      operationId: voices_create
      tags:
      - voices
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                  description: An audio file containing a sample of the voice to clone.
              required:
              - file
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Voice'
          description: ''
  /api/voices/{voice_id}:
    get:
      operationId: voices_retrieve
      parameters:
      - in: path
        name: voice_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - voices
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Voice'
          description: ''
    delete:
      operationId: voices_destroy
      parameters:
      - in: path
        name: voice_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - voices
      security:
      - apiKeyAuth: []
      responses:
        '204':
          description: No response body
  /api/webhooks:
    get:
      operationId: webhooks_list
      parameters:
      - name: cursor
        required: false
        in: query
        description: The pagination cursor value.
        schema:
          type: string
      tags:
      - webhooks
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedWebhookList'
          description: ''
    post:
      operationId: webhooks_create
      tags:
      - webhooks
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
        required: true
      security:
      - apiKeyAuth: []
      responses:
        '201':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Webhook'
          description: ''
  /api/webhooks/{webhook_id}:
    get:
      operationId: webhooks_retrieve
      parameters:
      - in: path
        name: webhook_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - webhooks
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Webhook'
          description: ''
    put:
      operationId: webhooks_update
      parameters:
      - in: path
        name: webhook_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - webhooks
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Webhook'
        required: true
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Webhook'
          description: ''
    patch:
      operationId: webhooks_partial_update
      parameters:
      - in: path
        name: webhook_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - webhooks
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PatchedWebhook'
      security:
      - apiKeyAuth: []
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Webhook'
          description: ''
    delete:
      operationId: webhooks_destroy
      parameters:
      - in: path
        name: webhook_id
        schema:
          type: string
          format: uuid
        required: true
      tags:
      - webhooks
      security:
      - apiKeyAuth: []
      responses:
        '204':
          description: No response body
components:
  schemas:
    APIKey:
      type: object
      properties:
        prefix:
          type: string
          readOnly: true
        created:
          type: string
          format: date-time
          readOnly: true
        creator:
          type: string
          readOnly: true
          nullable: true
        name:
          type: string
          readOnly: true
          description: A free-form name for the API key. Need not be unique. 50 characters
            max.
        expiryDate:
          type: string
          format: date-time
          readOnly: true
          nullable: true
          title: Expires
          description: Once API key expires, clients cannot use it anymore.
        revoked:
          type: boolean
          description: If the API key is revoked, clients cannot use it anymore. (This
            cannot be undone.)
      required:
      - created
      - creator
      - expiryDate
      - name
      - prefix
    APIKeyCreate:
      type: object
      properties:
        prefix:
          type: string
          readOnly: true
        created:
          type: string
          format: date-time
          readOnly: true
        creator:
          type: string
          readOnly: true
          nullable: true
        secret:
          type: string
          readOnly: true
          description: The API key itself. Will be generated on creation but not returned
            in future requests.
        revoked:
          type: boolean
          readOnly: true
          description: If the API key is revoked, clients cannot use it anymore. (This
            cannot be undone.)
        name:
          type: string
          description: A free-form name for the API key. Need not be unique. 50 characters
            max.
          maxLength: 50
        expiryDate:
          type: string
          format: date-time
          nullable: true
          title: Expires
          description: Once API key expires, clients cannot use it anymore.
      required:
      - created
      - creator
      - name
      - prefix
      - revoked
      - secret
    Account:
      type: object
      properties:
        name:
          type: string
          readOnly: true
        billingUrl:
          type: string
          readOnly: true
        freeTimeUsed:
          type: string
          readOnly: true
          description: How much free time has been used by previous (or ongoing) calls.
        freeTimeRemaining:
          type: string
          readOnly: true
          description: How much free call time this account has remaining. (This could
            increase if an existing call ends without using its maximum duration or
            an unjoined call times out.)
        hasActiveSubscription:
          type: boolean
          description: Whether the account has an active subscription.
      required:
      - billingUrl
      - freeTimeRemaining
      - freeTimeUsed
      - hasActiveSubscription
      - name
    Call:
      type: object
      properties:
        callId:
          type: string
          format: uuid
          readOnly: true
        clientVersion:
          type: string
          readOnly: true
          nullable: true
          description: The version of the client that joined this call.
        created:
          type: string
          format: date-time
          readOnly: true
        ended:
          type: string
          format: date-time
          readOnly: true
          nullable: true
        endReason:
          readOnly: true
          nullable: true
          description: |-
            The reason the call ended.

            * `unjoined` - Client never joined
            * `hangup` - Client hung up
            * `timeout` - Call timed out
          oneOf:
          - $ref: '#/components/schemas/EndReasonEnum'
          - $ref: '#/components/schemas/NullEnum'
        firstSpeaker:
          allOf:
          - $ref: '#/components/schemas/FirstSpeakerEnum'
          readOnly: true
          description: Who was supposed to talk first when the call started. Typically
            set to FIRST_SPEAKER_USER for outgoing calls and left as the default (FIRST_SPEAKER_AGENT)
            otherwise.
        inactivityMessages:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.TimedMessage'
          description: Messages spoken by the agent when the user is inactive for
            the specified duration. Durations are cumulative, so a message m > 1 with
            duration 30s will be spoken 30 seconds after message m-1.
        initialOutputMedium:
          allOf:
          - $ref: '#/components/schemas/InitialOutputMediumEnum'
          readOnly: true
          description: The medium used initially by the agent. May later be changed
            by the client.
        joinTimeout:
          type: string
          default: 60s
        joinUrl:
          type: string
          nullable: true
          readOnly: true
        languageHint:
          type: string
          nullable: true
          description: BCP47 language code that may be used to guide speech recognition.
          maxLength: 16
        maxDuration:
          type: string
          default: 3600s
        medium:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.CallMedium'
          nullable: true
        model:
          type: string
          default: fixie-ai/ultravox
        recordingEnabled:
          type: boolean
          writeOnly: true
          default: false
        systemPrompt:
          type: string
          nullable: true
        temperature:
          type: number
          format: double
          maximum: 1.0
          minimum: 0.0
          default: 0.0
        timeExceededMessage:
          type: string
          nullable: true
        voice:
          type: string
          nullable: true
        transcriptOptional:
          type: boolean
          default: true
          description: Indicates whether a transcript is optional for the call.
      required:
      - callId
      - clientVersion
      - created
      - endReason
      - ended
      - firstSpeaker
      - initialOutputMedium
      - joinUrl
    CallStage:
      type: object
      properties:
        callId:
          type: string
          format: uuid
          readOnly: true
        callStageId:
          type: string
          format: uuid
          readOnly: true
        created:
          type: string
          format: date-time
          readOnly: true
        inactivityMessages:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.TimedMessage'
          description: Messages spoken by the agent when the user is inactive for
            the specified duration. Durations are cumulative, so a message m > 1 with
            duration 30s will be spoken 30 seconds after message m-1.
        languageHint:
          type: string
          nullable: true
          description: BCP47 language code that may be used to guide speech recognition.
          maxLength: 16
        model:
          type: string
          readOnly: true
        recordingEnabled:
          type: boolean
          writeOnly: true
          default: false
        systemPrompt:
          type: string
          nullable: true
        temperature:
          type: number
          format: double
          readOnly: true
        timeExceededMessage:
          type: string
          nullable: true
        voice:
          type: string
          nullable: true
      required:
      - callId
      - callStageId
      - created
      - model
      - temperature
    CallTool:
      type: object
      properties:
        callToolId:
          type: string
          format: uuid
          readOnly: true
        toolId:
          type: string
          format: uuid
          readOnly: true
          nullable: true
        name:
          type: string
          readOnly: true
          description: The possibly overridden name of the tool.
        definition:
          $ref: '#/components/schemas/ultravox.v1.CallTool'
      required:
      - callToolId
      - definition
      - name
      - toolId
    EndReasonEnum:
      enum:
      - unjoined
      - hangup
      - timeout
      type: string
      description: |-
        * `unjoined` - Client never joined
        * `hangup` - Client hung up
        * `timeout` - Call timed out
    EventsEnum:
      enum:
      - call.started
      - call.ended
      type: string
      description: |-
        * `call.started` - Fired when a call starts
        * `call.ended` - Fired when a call ends
    FirstSpeakerEnum:
      enum:
      - FIRST_SPEAKER_AGENT
      - FIRST_SPEAKER_USER
      type: string
    InitialOutputMediumEnum:
      enum:
      - MESSAGE_MEDIUM_VOICE
      - MESSAGE_MEDIUM_TEXT
      type: string
    NullEnum:
      enum:
      - null
    PaginatedAPIKeyList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/APIKey'
    PaginatedCallList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/Call'
    PaginatedCallStageList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/CallStage'
    PaginatedToolList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/Tool'
    PaginatedVoiceList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/Voice'
    PaginatedWebhookList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/Webhook'
    Paginatedultravox.v1.MessageList:
      type: object
      required:
      - results
      properties:
        next:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cD00ODY%3D"
        previous:
          type: string
          nullable: true
          format: uri
          example: http://api.example.org/accounts/?cursor=cj0xJnA9NDg3
        results:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.Message'
    PatchedAPIKey:
      type: object
      properties:
        prefix:
          type: string
          readOnly: true
        created:
          type: string
          format: date-time
          readOnly: true
        creator:
          type: string
          readOnly: true
          nullable: true
        name:
          type: string
          readOnly: true
          description: A free-form name for the API key. Need not be unique. 50 characters
            max.
        expiryDate:
          type: string
          format: date-time
          readOnly: true
          nullable: true
          title: Expires
          description: Once API key expires, clients cannot use it anymore.
        revoked:
          type: boolean
          description: If the API key is revoked, clients cannot use it anymore. (This
            cannot be undone.)
    PatchedWebhook:
      type: object
      properties:
        webhookId:
          type: string
          format: uuid
          readOnly: true
        created:
          type: string
          format: date-time
          readOnly: true
        url:
          type: string
          format: uri
          maxLength: 200
        secrets:
          type: array
          items:
            type: string
            maxLength: 120
        events:
          type: array
          items:
            $ref: '#/components/schemas/EventsEnum'
    Tool:
      type: object
      properties:
        toolId:
          type: string
          format: uuid
          readOnly: true
        name:
          type: string
          maxLength: 40
        created:
          type: string
          format: date-time
          readOnly: true
        definition:
          $ref: '#/components/schemas/ultravox.v1.BaseToolDefinition'
      required:
      - created
      - definition
      - name
      - toolId
    Voice:
      type: object
      properties:
        voiceId:
          type: string
          format: uuid
          readOnly: true
        name:
          type: string
          readOnly: true
        description:
          type: string
          readOnly: true
          nullable: true
        previewUrl:
          type: string
          format: uri
          readOnly: true
          nullable: true
      required:
      - description
      - name
      - previewUrl
      - voiceId
    Webhook:
      type: object
      properties:
        webhookId:
          type: string
          format: uuid
          readOnly: true
        created:
          type: string
          format: date-time
          readOnly: true
        url:
          type: string
          format: uri
          maxLength: 200
        secrets:
          type: array
          items:
            type: string
            maxLength: 120
        events:
          type: array
          items:
            $ref: '#/components/schemas/EventsEnum'
      required:
      - created
      - events
      - url
      - webhookId
    ultravox.v1.Message:
      type: object
      properties:
        role:
          enum:
          - MESSAGE_ROLE_UNSPECIFIED
          - MESSAGE_ROLE_USER
          - MESSAGE_ROLE_AGENT
          - MESSAGE_ROLE_TOOL_CALL
          - MESSAGE_ROLE_TOOL_RESULT
          type: string
          description: The message's role.
          format: enum
        text:
          type: string
          description: The message text for user and agent messages, tool arguments
            for tool_call messages, tool results for tool_result messages.
        invocationId:
          type: string
          description: The invocation ID for tool messages. Used to pair tool calls
            with their results.
        toolName:
          type: string
          description: The tool name for tool messages.
        errorDetails:
          type: string
          description: |-
            For failed tool calls, additional debugging information. While the text field is
             presented to the model so it can respond to failures gracefully, the full details
             are only exposed via the Ultravox REST API.
      description: A message exchanged during a call.
    google.protobuf.Value:
      description: Represents a dynamically typed value which can be either null,
        a number, a string, a boolean, a recursive struct value, or a list of values.
    ultravox.v1.AutomaticParameter:
      type: object
      properties:
        name:
          type: string
          description: The name of the parameter.
        location:
          enum:
          - PARAMETER_LOCATION_UNSPECIFIED
          - PARAMETER_LOCATION_QUERY
          - PARAMETER_LOCATION_PATH
          - PARAMETER_LOCATION_HEADER
          - PARAMETER_LOCATION_BODY
          type: string
          description: Where the parameter is used.
          format: enum
        knownValue:
          enum:
          - KNOWN_PARAM_UNSPECIFIED
          - KNOWN_PARAM_CALL_ID
          - KNOWN_PARAM_CONVERSATION_HISTORY
          type: string
          description: The value to set for the parameter.
          format: enum
      description: A parameter that is automatically set by the system.
    ultravox.v1.BaseClientToolDetails:
      type: object
      properties: {}
      description: Details for invoking a tool expected to be implemented by the client.
    ultravox.v1.BaseHttpToolDetails:
      type: object
      properties:
        baseUrlPattern:
          type: string
          description: The base URL pattern for the tool, possibly with placeholders
            for path parameters.
        httpMethod:
          type: string
          description: The HTTP method for the tool.
      description: Details for invoking a tool via HTTP.
    ultravox.v1.BaseToolDefinition:
      type: object
      properties:
        modelToolName:
          type: string
          description: The name of the tool, as presented to the model. Must match
            ^[a-zA-Z0-9_-]{1,64}$.
        description:
          type: string
          description: The description of the tool.
        dynamicParameters:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.DynamicParameter'
          description: The parameters that the tool accepts.
        staticParameters:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.StaticParameter'
          description: The static parameters added when the tool is invoked.
        automaticParameters:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.AutomaticParameter'
          description: Additional parameters that are automatically set by the system
            when the tool is invoked.
        requirements:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.ToolRequirements'
          description: Requirements that must be fulfilled when creating a call for
            the tool to be used.
        http:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.BaseHttpToolDetails'
          description: Details for an HTTP tool.
        client:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.BaseClientToolDetails'
          description: |-
            Details for a client-implemented tool. Only body parameters are allowed
             for client tools.
      description: |-
        The base definition of a tool that can be used during a call. Exactly one
         implementation (http or client) should be set.
    ultravox.v1.CallMedium:
      type: object
      properties:
        webRtc:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.CallMedium_WebRtcMedium'
          description: |-
            The call will use WebRTC with the Ultravox client SDK.
             This is the default.
        twilio:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.CallMedium_TwilioMedium'
          description: |-
            The call will use Twilio's "Media Streams" protocol.
             Once you have a join URL from starting a call, include it in your
             TwiML like so:
             <Connect><Stream url=${your-join-url} /></Connect>
             This works for both inbound and outbound calls.
        serverWebSocket:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.CallMedium_WebSocketMedium'
          description: |-
            The call will use a plain websocket connection. This is unlikely to yield an acceptable user
             experience if used from a browser or mobile client, but may be suitable for a
             server-to-server connection. This option provides a simple way to connect your own server to
             an Ultravox inference instance.
      description: |-
        Details about a call's protocol. By default, calls occur over WebRTC using
         the Ultravox client SDK. Setting a different call medium will prepare the
         server for a call using a different protocol.
         At most one call medium may be set.
    ultravox.v1.CallMedium_TwilioMedium:
      type: object
      properties: {}
      description: Details for a Twilio call.
    ultravox.v1.CallMedium_WebRtcMedium:
      type: object
      properties: {}
      description: Details for a WebRTC call.
    ultravox.v1.CallMedium_WebSocketMedium:
      type: object
      properties:
        inputSampleRate:
          type: integer
          description: The sample rate for input (user) audio. Required.
          format: int32
        outputSampleRate:
          type: integer
          description: The desired sample rate for output (agent) audio. If unset,
            defaults to the input_sample_rate.
          format: int32
        clientBufferSizeMs:
          type: integer
          description: |-
            The size of the client-side audio buffer in milliseconds. Smaller buffers allow for faster
             interruptions but may cause audio underflow if network latency fluctuates too greatly. For
             the best of both worlds, set this to some large value (e.g. 30000) and implement support for
             playback_clear_buffer messages. Defaults to 60.
          format: int32
      description: Details for a WebSocket call.
    ultravox.v1.CallTool:
      type: object
      properties:
        description:
          type: string
          description: The description of the tool.
        dynamicParameters:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.DynamicParameter'
          description: The parameters presented to the model.
        staticParameters:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.StaticParameter'
          description: Parameters added unconditionally when the tool is invoked.
        automaticParameters:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.AutomaticParameter'
          description: Parameters automatically set by the system.
        http:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.HttpCallToolDetails'
          description: Details for an HTTP tool.
        client:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.ClientCallToolDetails'
          description: |-
            Details for a client-implemented tool. Only body parameters are allowed
             for client tools.
      description: A tool as used for a particular call (omitting auth details).
    ultravox.v1.ClientCallToolDetails:
      type: object
      properties: {}
      description: Details for a CallTool implemented by the client.
    ultravox.v1.DynamicParameter:
      type: object
      properties:
        name:
          type: string
          description: The name of the parameter.
        location:
          enum:
          - PARAMETER_LOCATION_UNSPECIFIED
          - PARAMETER_LOCATION_QUERY
          - PARAMETER_LOCATION_PATH
          - PARAMETER_LOCATION_HEADER
          - PARAMETER_LOCATION_BODY
          type: string
          description: Where the parameter is used.
          format: enum
        schema:
          type: object
          description: |-
            The JsonSchema definition of the parameter. This typically
             includes things like type, description, enum values, format,
             other restrictions, etc.
        required:
          type: boolean
          description: Whether the parameter is required.
      description: A dynamic parameter the tool accepts that may be set by the model.
    ultravox.v1.HeaderApiKeyRequirement:
      type: object
      properties:
        name:
          type: string
          description: The name of the header.
      description: A security requirement that will cause an API key to be added to
        the header.
    ultravox.v1.HttpAuthRequirement:
      type: object
      properties:
        scheme:
          type: string
          description: The scheme of the HTTP authentication, e.g. "Bearer".
      description: A security requirement that will cause an HTTP authentication header
        to be added.
    ultravox.v1.HttpCallToolDetails:
      type: object
      properties:
        baseUrlPattern:
          type: string
          description: The base URL pattern for the tool, possibly with placeholders
            for path parameters.
        httpMethod:
          type: string
          description: The HTTP method for the tool.
        authHeaders:
          type: array
          items:
            type: string
          description: Auth headers added when the tool is invoked.
        authQueryParams:
          type: array
          items:
            type: string
          description: Auth query parameters added when the tool is invoked.
      description: Details for a CallTool implemented via HTTP requests.
    ultravox.v1.QueryApiKeyRequirement:
      type: object
      properties:
        name:
          type: string
          description: The name of the query parameter.
      description: A security requirement that will cause an API key to be added to
        the query string.
    ultravox.v1.SecurityOptions:
      type: object
      properties:
        options:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.SecurityRequirements'
          description: |-
            The options for security. Only one must be met. The first one that can be
             satisfied will be used in general. The single exception to this rule is
             that we always prefer a non-empty set of requirements over an empty set
             unless no non-empty set can be satisfied.
      description: The different options for satisfying a tool's security requirements.
    ultravox.v1.SecurityRequirement:
      type: object
      properties:
        queryApiKey:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.QueryApiKeyRequirement'
          description: An API key must be added to the query string.
        headerApiKey:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.HeaderApiKeyRequirement'
          description: An API key must be added to a custom header.
        httpAuth:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.HttpAuthRequirement'
          description: The HTTP authentication header must be added.
      description: |-
        A single security requirement that must be met for a tool to be available. Exactly one
         of query_api_key, header_api_key, or http_auth should be set.
    ultravox.v1.SecurityRequirements:
      type: object
      properties:
        requirements:
          type: object
          additionalProperties:
            $ref: '#/components/schemas/ultravox.v1.SecurityRequirement'
          description: Requirements keyed by name.
      description: The security requirements for a request. All requirements must
        be met.
    ultravox.v1.SelectedTool:
      type: object
      properties:
        toolId:
          type: string
          description: The ID of an existing base tool.
        toolName:
          type: string
          description: The name of an existing base tool. The name must uniquely identify
            the tool.
        temporaryTool:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.BaseToolDefinition'
          description: |-
            A temporary tool definition, available only for this call (and subsequent
             calls created using priorCallId without overriding selected tools).
        nameOverride:
          type: string
          description: |-
            An override for the model_tool_name. This is primarily useful when using
             multiple instances of the same durable tool (presumably with different
             parameter overrides.) The set of tools used within a call must have a unique
             set of model names and every name must match this pattern: ^[a-zA-Z0-9_-]{1,64}$.
        authTokens:
          type: object
          additionalProperties:
            type: string
          description: Auth tokens used to satisfy the tool's security requirements.
        parameterOverrides:
          type: object
          additionalProperties:
            $ref: '#/components/schemas/google.protobuf.Value'
          description: |-
            Static values to use in place of dynamic parameters. Any parameter included
             here will be hidden from the model and the static value will be used instead.
             Some tools may require certain parameters to be overridden, but any parameter
             can be overridden regardless of whether it is required to be.
      description: |-
        A tool selected for a particular call. Exactly one of tool_id, tool_name, or
         temporary_tool should be set.
    ultravox.v1.StartCallRequest:
      type: object
      properties:
        systemPrompt:
          type: string
          description: The system prompt provided to the model during generations.
        temperature:
          type: number
          description: The model temperature, between 0 and 1. Defaults to 0.
          format: float
        model:
          type: string
          description: The model used for generations. Defaults to fixie-ai/ultravox.
        voice:
          type: string
          description: The ID (or name if unique) of the voice the agent should use
            for this call.
        languageHint:
          type: string
          description: A BCP47 language code that may be used to guide speech recognition
            and synthesis.
        initialMessages:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.Message'
          description: The conversation history to start from for this call.
        joinTimeout:
          pattern: ^-?(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,9})?s$
          type: string
          description: A timeout for joining the call. Defaults to 5 minutes.
        maxDuration:
          pattern: ^-?(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,9})?s$
          type: string
          description: The maximum duration of the call. Defaults to 1 hour.
        timeExceededMessage:
          type: string
          description: What the agent should say immediately before hanging up if
            the call's time limit is reached.
        inactivityMessages:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.TimedMessage'
          description: |-
            Messages spoken by the agent when the user is inactive for the specified duration.
             Durations are cumulative, so a message m > 1 with duration 30s will be spoken 30 seconds after message m-1.
        selectedTools:
          type: array
          items:
            $ref: '#/components/schemas/ultravox.v1.SelectedTool'
          description: The tools available to the agent for (the first stage of) this
            call.
        medium:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.CallMedium'
          description: The medium used for this call.
        initiator:
          enum:
          - INITIATOR_UNSPECIFIED
          - INITIATOR_USER
          - INITIATOR_AGENT
          type: string
          description: |-
            Who was responsible for staring this call. Typically set to agent for outgoing calls and left as the default (user) otherwise.
             DEPRECATED: Use first_speaker instead. Will be removed in November 2024.
          format: enum
        recordingEnabled:
          type: boolean
          description: Whether the call should be recorded.
        firstSpeaker:
          enum:
          - FIRST_SPEAKER_UNSPECIFIED
          - FIRST_SPEAKER_AGENT
          - FIRST_SPEAKER_USER
          type: string
          description: |-
            Who should talk first when the call starts. Typically set to FIRST_SPEAKER_USER for outgoing
             calls and left as the default (FIRST_SPEAKER_AGENT) otherwise.
          format: enum
        transcriptOptional:
          type: boolean
          description: Indicates whether a transcript is optional for the call.
        initialOutputMedium:
          enum:
          - MESSAGE_MEDIUM_UNSPECIFIED
          - MESSAGE_MEDIUM_VOICE
          - MESSAGE_MEDIUM_TEXT
          type: string
          description: |-
            The medium to use for the call initially. May be altered by the client later.
             Defaults to voice.
          format: enum
      description: A request to start a call.
    ultravox.v1.StaticParameter:
      type: object
      properties:
        name:
          type: string
          description: The name of the parameter.
        location:
          enum:
          - PARAMETER_LOCATION_UNSPECIFIED
          - PARAMETER_LOCATION_QUERY
          - PARAMETER_LOCATION_PATH
          - PARAMETER_LOCATION_HEADER
          - PARAMETER_LOCATION_BODY
          type: string
          description: Where the parameter is used.
          format: enum
        value:
          allOf:
          - $ref: '#/components/schemas/google.protobuf.Value'
          description: The value of the parameter.
      description: |-
        A static parameter that is unconditionally added when the tool is invoked. This
         parameter is not exposed to or set by the model.
    ultravox.v1.TimedMessage:
      type: object
      properties:
        duration:
          pattern: ^-?(?:0|[1-9][0-9]{0,11})(?:\.[0-9]{1,9})?s$
          type: string
          description: The duration after which the message should be spoken.
        message:
          type: string
          description: The message to speak.
        endBehavior:
          enum:
          - END_BEHAVIOR_UNSPECIFIED
          - END_BEHAVIOR_HANG_UP_SOFT
          - END_BEHAVIOR_HANG_UP_STRICT
          type: string
          description: The behavior to exhibit when the message is finished being
            spoken.
          format: enum
      description: |-
        A message the agent should say after some duration. The duration's meaning
         varies depending on the context.
    ultravox.v1.ToolRequirements:
      type: object
      properties:
        httpSecurityOptions:
          allOf:
          - $ref: '#/components/schemas/ultravox.v1.SecurityOptions'
          description: Security requirements for an HTTP tool.
        requiredParameterOverrides:
          type: array
          items:
            type: string
          description: Dynamic parameters that must be overridden with an explicit
            (static) value.
      description: The requirements for using a tool, which must be satisfied when
        creating a call with the tool.
  securitySchemes:
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      description: API key
servers:
- url: https://api.ultravox.ai
