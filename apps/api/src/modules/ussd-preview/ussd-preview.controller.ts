import { Body, Controller, Get, Post } from "@nestjs/common";
import { buildUssdSessionState } from "@ndjar/domain";
import { z } from "zod";

import { parseRequestBody } from "../../services/request-validation.js";

const ussdPreviewSessionSchema = z.object({
  sessionId: z.string().trim().min(1),
  phoneNumber: z.string().trim().min(3),
  route: z.array(z.string().trim().min(1)).default([]),
});

@Controller("ussd-preview")
export class UssdPreviewController {
  @Get()
  getPreviewMenu() {
    return {
      phase: "phase_2_placeholder",
      integration: "not_connected",
      menu: {
        screen: "home",
        text: "N'djar\n1. Culturas\n2. Calendario\n3. Perguntar ao Medico Agricola\n4. Sincronizar",
        options: [
          { input: "1", label: "Culturas" },
          { input: "2", label: "Calendario" },
          { input: "3", label: "Perguntar ao Medico Agricola" },
          { input: "4", label: "Sincronizar" },
        ],
      },
    };
  }

  @Post("sessions")
  previewSession(@Body() body: unknown) {
    const input = parseRequestBody(ussdPreviewSessionSchema, body);

    return {
      phase: "phase_2_placeholder",
      integration: "not_connected",
      session: buildUssdSessionState(input),
    };
  }
}
