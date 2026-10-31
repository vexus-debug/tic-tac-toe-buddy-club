import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    // The imported app mounts its own react-router BrowserRouter, which owns
    // the browser history. If this shell router also subscribes to window
    // history, its Transitioner setState fires while BrowserRouter is
    // rendering ("Cannot update a component while rendering..."). On the
    // client the shell uses an isolated memory history instead; the server
    // keeps the default history so SSR matches the real URL.
    history:
      typeof window !== "undefined"
        ? createMemoryHistory({
            initialEntries: [window.location.pathname + window.location.search],
          })
        : undefined,
  });

  return router;
};
