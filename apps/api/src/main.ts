import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const port = Number.parseInt(process.env.PORT ?? "3333", 10);
  await app.listen(port);
}

await bootstrap();
