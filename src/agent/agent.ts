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
import { InitPrompt } from './init-prompt.js';
import { SystemPrompt } from './system-prompt.js';
import { Serializer } from './serializer.js';
import { Tools } from './tools.js';

export type GentMessage = ModelMessage & { _uiHidden?: boolean };

export const ABORTED_MESSAGE = '[Aborted]';

type AgentOptions = {
  onUpdate?: () => void;
};

export class Agent {
  messages: GentMessage[] = [];
  readonly modelId: string;

  private onUpdate?: () => void;
  private languageModel: LanguageModel;
  private systemPrompt: string;
  private tools: Tools;
  private serializer = new Serializer();
  private controller: AbortController | null = null;

  constructor(options?: AgentOptions) {
    const config = new ConfigReader().read();
    this.modelId = config.model;
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

  async clear(beforeClear?: () => void): Promise<void> {
    this.abort(); // doesn't abort whole queue, but that's fine
    return this.serializer.submit(async () => {
      beforeClear?.();
      this.messages = [];
      this.notify();
    });
  }

  sendMessage(message: string): Promise<void> {
    return this.serializer.submit(async () => {
      if (!this.messages.length) {
        const initContent = new InitPrompt().build();
        if (initContent) {
          this.messages.push({ role: 'user', content: initContent, _uiHidden: true });
        }
      }

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
    });
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
