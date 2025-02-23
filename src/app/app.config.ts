import { InjectionToken } from "@angular/core";
import { Constants } from "src/models/contants.models";

export const APP_CONFIG = new InjectionToken<AppConfig>("app.config");

export interface AppConfig {
	availableLanguages: Array<{ code: string, name: string }>;
    defaultThemeMode: string;
    demoMode: boolean;
}

export const BaseAppConfig: AppConfig = {
    availableLanguages: [
        {
            code: 'en',
            name: 'English'
        },
        {
            code: 'hi',
            name: 'हिंदी'
        }
    ],
    defaultThemeMode: Constants.THEME_MODE_LIGHT,
    demoMode: false
};
