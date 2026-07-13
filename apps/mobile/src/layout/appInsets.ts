interface AppInsetsInput {
  platform: string;
  statusBarHeight: number;
}

export function getAppInsets({ platform, statusBarHeight }: AppInsetsInput) {
  if (platform !== "android") {
    return { bottom: 0, top: 0 };
  }

  return {
    bottom: 16,
    top: Math.max(0, statusBarHeight),
  };
}
