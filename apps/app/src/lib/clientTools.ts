import type { ClientToolImplementation } from 'ultravox-client';

export interface ViewUpdateData {
  view: string;
  context?: Record<string, any>;
}

export const switchViewTool: ClientToolImplementation = (parameters) => {
  const viewData = parameters as ViewUpdateData;

  if (typeof window !== "undefined") {
    const event = new CustomEvent("viewUpdate", {
      detail: viewData
    });
    window.dispatchEvent(event);
  }

  return `Switched to ${viewData.view} view`;
};
