import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import de from "./locales/de.json";
import en from "./locales/en.json";

export type LanguagePreference = "system" | "de" | "en";

const LANGUAGE_STORAGE_KEY = "readlet.languagePreference";

function deviceLanguage(): "de" | "en" {
  return Localization.getLocales()[0]?.languageCode === "en" ? "en" : "de";
}

/** Reads the stored preference synchronously (expo-secure-store supports this) so i18next has the right language before the first render — no async hydration, no flash of the wrong language. */
export function getLanguagePreference(): LanguagePreference {
  const stored = SecureStore.getItem(LANGUAGE_STORAGE_KEY);
  return stored === "de" || stored === "en" ? stored : "system";
}

/** Persists the choice (or clears it, for "system") and switches i18next immediately. */
export function setLanguagePreference(preference: LanguagePreference): void {
  if (preference === "system") {
    SecureStore.deleteItemAsync(LANGUAGE_STORAGE_KEY).catch(console.error);
    // eslint-disable-next-line import/no-named-as-default-member -- this is i18next's documented singleton API, not the module's named `changeLanguage` export.
    void i18next.changeLanguage(deviceLanguage());
  } else {
    SecureStore.setItemAsync(LANGUAGE_STORAGE_KEY, preference).catch(console.error);
    // eslint-disable-next-line import/no-named-as-default-member -- see above.
    void i18next.changeLanguage(preference);
  }
}

function resolveInitialLanguage(): "de" | "en" {
  const preference = getLanguagePreference();
  return preference === "system" ? deviceLanguage() : preference;
}

// eslint-disable-next-line import/no-named-as-default-member -- see above.
void i18next.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: resolveInitialLanguage(),
  fallbackLng: "de",
  interpolation: { escapeValue: false },
});

export default i18next;
