import { BadRequestException } from "@nestjs/common";

import type { z } from "zod";

export function parseRequestBody<TSchema extends z.ZodType>(
  schema: TSchema,
  body: unknown,
): z.infer<TSchema> {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  throw new BadRequestException({
    message: "Invalid request payload",
    issues: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}
