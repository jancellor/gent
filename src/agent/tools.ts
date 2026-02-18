import type { JSONValue, ToolSet } from 'ai';
import { ExecuteTool } from './execute-tool.js';

export class Tools {
  private executeTool = new ExecuteTool();

  definitions(): ToolSet {
    return {
      [this.executeTool.name]: this.executeTool.definition(),
    };
  }

  execute(name: string, args: unknown): Promise<JSONValue> {
    switch (name) {
      case this.executeTool.name:
        return this.executeTool.execute(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
