export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = async (
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    renderSource:
      | 'react-server-components'
      | 'react-server-components-payload'
      | 'server-rendering';
    revalidateReason: 'on-demand' | 'stale' | undefined;
    renderType: 'dynamic' | 'dynamic-resume';
  }
) => {
  const Sentry = await import('@sentry/nextjs');
  
  Sentry.withScope((scope) => {
    scope.setTag('request_path', request.path);
    scope.setTag('request_method', request.method);
    scope.setTag('router_kind', context.routerKind);
    scope.setTag('route_path', context.routePath);
    scope.setTag('route_type', context.routeType);
    
    Sentry.captureException(error, {
      mechanism: {
        type: 'nextjs-instrumentation',
        handled: false,
      },
    });
  });
};
