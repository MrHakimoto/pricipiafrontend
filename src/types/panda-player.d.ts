// types/panda-player.d.ts
export {};

declare global {
  interface Window {
    pandascripttag?: Array<() => void>;
    PandaPlayer?: any;
  }

  const PandaPlayer: any;
}