import { TavilySearch } from "@langchain/tavily";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { getGraphPng } from "./util";


// Create a model and give it access to the tools
const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
});

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
  .addEdge("llm", "__end__");

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();
await getGraphPng(app, "./graphState.png");
// Use the agent
const finalState = await app.invoke({
  messages: [new HumanMessage("hello my name is sk! how are you ?")],
});
console.log(finalState.messages[finalState.messages.length - 1]?.content);