declare module 'virtual:lab-bridge' {
  /** Provided by labBridge.ts. Available only while the site runs through `npm run dev`. */
  export const labBridge: { available: boolean; token: string }
}
