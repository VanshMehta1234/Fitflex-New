// Auth/auth-app/src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
    readonly VITE_STRIPE_BASIC_MONTHLY_PRICE_ID: string;
    readonly VITE_STRIPE_BASIC_YEARLY_PRICE_ID: string;
    readonly VITE_STRIPE_PREMIUM_MONTHLY_PRICE_ID: string;
    readonly VITE_STRIPE_PREMIUM_YEARLY_PRICE_ID: string;
    readonly VITE_STRIPE_ELITE_MONTHLY_PRICE_ID: string;
    readonly VITE_STRIPE_ELITE_YEARLY_PRICE_ID: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }