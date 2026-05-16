import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate locale and fallback to default if invalid
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[i18n] Invalid locale: ${locale}, falling back to ${routing.defaultLocale}`);
    }
    locale = routing.defaultLocale;
  }

  // Load translation messages with error handling
  try {
    const messages = (await import(`./messages/${locale}.json`)).default;
    return {
      locale,
      messages,
    };
  } catch (error) {
    // If loading fails, try to load default locale messages as fallback
    console.error(`[i18n] Failed to load messages for locale: ${locale}`, error);
    
    // If we're already trying the default locale, throw the error
    if (locale === routing.defaultLocale) {
      throw new Error(`[i18n] Failed to load default locale messages: ${routing.defaultLocale}`);
    }
    
    // Otherwise, fallback to default locale
    console.warn(`[i18n] Falling back to default locale: ${routing.defaultLocale}`);
    try {
      const defaultMessages = (await import(`./messages/${routing.defaultLocale}.json`)).default;
      return {
        locale: routing.defaultLocale,
        messages: defaultMessages,
      };
    } catch (fallbackError) {
      throw new Error(`[i18n] Failed to load fallback locale messages: ${routing.defaultLocale}`, {
        cause: fallbackError,
      });
    }
  }
});
