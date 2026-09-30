import { createClient } from '@insforge/sdk';

const INSFORGE_URL = import.meta.env.VITE_INSFORGE_URL || 'https://xga5neu3.us-east.insforge.app';
const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || 'anon_61d4fcb074bcc5e3a7b319420ea44caa0cd2edfec2c36a0b06c462862d6bc49c';

export const insforge = createClient({
  baseUrl: INSFORGE_URL,
  anonKey: INSFORGE_ANON_KEY,
});
