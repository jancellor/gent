import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  generateText,
  type LanguageModel,
  type ModelMessage,
  type ToolContent,
  type ToolSet,
  type TypedToolCall,
} from 'ai';
import { ConfigReader } from './config.js';
import { SystemPrompt } from './system-prompt.js';
import { Tools } from './tools.js';

export type { ModelMessage };

export const ABORTED_MESSAGE = '[Aborted]';

type AgentOptions = {
  onUpdate?: () => void;
};

export class Agent {
  messages: ModelMessage[] = [];

  private onUpdate?: () => void;
  private languageModel: LanguageModel;
  private systemPrompt: string;
  private tools: Tools;
  private previousSendMessageResult: Promise<void> = Promise.resolve();
  private controller: AbortController | null = null;

  constructor(options?: AgentOptions) {
    const config = new ConfigReader().read();
    const provider = createOpenAICompatible({
      name: 'gent',
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    this.languageModel = provider(config.model);
    this.systemPrompt = new SystemPrompt().build();
    this.tools = new Tools();
    this.onUpdate = options?.onUpdate;
  }

  private notify(): void {
    this.onUpdate?.();
  }

  abort(): void {
    this.controller?.abort();
  }

  sendMessage(message: string): Promise<void> {
    const previous = this.previousSendMessageResult;
    const run = (async () => {
      try {
        await previous;
      } catch {
        // ignore and continue queue processing
      }
      await this.sendMessageNoWait(message);
    })();

    this.previousSendMessageResult = run;
    return run;
  }

  private async sendMessageNoWait(message: string): Promise<void> {
    this.messages.push({ role: 'user', content: message });
    this.notify();

    this.controller = new AbortController();
    const { signal } = this.controller;

    try {
      while (true) {
        const result = await generateText({
          model: this.languageModel,
          system: this.systemPrompt,
          messages: this.messages,
          tools: this.tools.definitions(),
          abortSignal: signal,
        });

        this.messages.push(...result.response.messages);
        this.notify();

        if (result.toolCalls.length === 0) break;

        const toolResults = await this.callTools(result.toolCalls, signal);
        this.messages.push({ role: 'tool', content: toolResults });
        this.notify();
      }
    } catch (e) {
      if (!signal.aborted) throw e;
      const lastMessage = this.messages.at(-1);
      if (lastMessage && lastMessage.role !== 'assistant') {
        this.messages.push({ role: 'assistant', content: ABORTED_MESSAGE });
        this.notify();
      }
    } finally {
      this.controller = null;
    }
  }

  private async callTools(
    toolCalls: Array<TypedToolCall<ToolSet>>,
    signal: AbortSignal,
  ): Promise<ToolContent> {
    return await Promise.all(
      toolCalls.map(async (toolCall) => ({
        type: 'tool-result',
        toolCallId: toolCall.toolCallId,
        toolName: toolCall.toolName,
        output: {
          type: 'json',
          value: await this.tools.execute(
            toolCall.toolName,
            toolCall.input,
            signal,
          ),
        },
      })),
    );
  }
}
