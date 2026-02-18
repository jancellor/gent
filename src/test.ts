import { Agent } from './agent/index.js';

const agent = new Agent();
await agent.sendMessage('ls files in this dir');
console.log(JSON.stringify(agent.messages, null, 2));
