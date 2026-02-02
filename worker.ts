/// <reference types="@cloudflare/workers-types" />
import { createRequestHandler } from "react-router";

interface Env {
    // Add your environment bindings here (e.g., KV, D1, etc.)
}

declare module "react-router" {
    export interface AppLoadContext {
        cloudflare: {
            env: Env;
            ctx: ExecutionContext;
        };
    }
}

const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
);

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        return requestHandler(request, {
            cloudflare: { env, ctx },
        });
    },
} satisfies ExportedHandler<Env>;
