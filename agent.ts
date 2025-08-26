import { TavilySearch } from "@langchain/tavily";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { printGraph } from "./util";

// Define the tools for the agent to use
const tools = [new TavilySearch({ maxResults: 3 })];
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we stop (reply to the user) using the special "__end__" node
  return "__end__";
}

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("llm", callModel)
  .addEdge("__start__", "llm") // __start__ is a special name for the entrypoint
  .addNode("tools", toolNode)
  .addEdge("tools", "llm")
  .addConditionalEdges("llm", shouldContinue);
  
// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();
//we print our custom graph
await printGraph(app, "./graphState.png");
// Use the agent
const finalState = await app.invoke({
  messages: [new HumanMessage("what is the temperature in mumbai?")],
});
console.log(finalState.messages[finalState.messages.length - 1]?.content);