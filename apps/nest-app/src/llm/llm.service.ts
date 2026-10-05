import { openai } from '@ai-sdk/openai';
import { Injectable } from '@nestjs/common';
import { generateText as aiSdkGenerateText, Output } from 'ai';
import z from 'zod';

export interface GenerateTextParams {
  prompt: string;
  system?: string;
}

export interface GenerateObjectParams<
  T extends z.ZodType,
> extends GenerateTextParams {
  schema: T;
}

@Injectable()
export class LlmService {
  async generateText(params: GenerateTextParams): Promise<string> {
    const res = await aiSdkGenerateText({
      model: openai('gpt-4o-mini'),
      system: params.system,
      prompt: params.prompt,
    });

    return res.text;
  }

  async generateObject<T extends z.ZodType>(
    params: GenerateObjectParams<T>,
  ): Promise<z.infer<T>> {
    const res = await aiSdkGenerateText({
      model: openai('gpt-4o-mini'),
      system: params.system,
      prompt: params.prompt,
      output: Output.object({
        schema: params.schema,
      }),
    });

    return params.schema.parse(res.output);
  }
}
