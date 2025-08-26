import { writeFileSync } from "node:fs";


export const printGraph = async (app: any, filePath: string) => {
    //Visualize the agent workflow using Mermaid
    //Graphical representation of agent workflow
    const drawableGraphGraphState = await app.getGraphAsync();
    const graphStateImage = await drawableGraphGraphState.drawMermaidPng();
    const graphStateArrayBuffer = await graphStateImage.arrayBuffer();
    //Write the graphState to local png file
    writeFileSync(filePath, new Uint8Array(graphStateArrayBuffer));
}
