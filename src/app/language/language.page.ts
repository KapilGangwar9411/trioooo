import { Component, OnInit, Inject } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../app.config';
import { MyEvent } from 'src/services/myevent.services';
import { Constants } from 'src/models/contants.models';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-language',
  templateUrl: './language.page.html',
  styleUrls: ['./language.page.scss'],
})
export class LanguagePage implements OnInit {
  defaultLanguageCode: string;
  languages: Array<{ code: string; name: string; }> = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' }
  ];

  constructor(
    @Inject(APP_CONFIG) public config: AppConfig,
    private myEvent: MyEvent,
    private navCtrl: NavController,
    private translate: TranslateService
  ) {
    this.defaultLanguageCode = 'en';
    let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
    if (defaultLang) this.defaultLanguageCode = defaultLang;
  }

  ngOnInit() {
    let defaultLang = window.localStorage.getItem(Constants.KEY_DEFAULT_LANGUAGE);
    if (defaultLang) this.defaultLanguageCode = defaultLang;
  }

  onLanguageClick(language: { code: string; }) {
    this.defaultLanguageCode = language.code;
  }

  languageConfirm() {
    window.localStorage.setItem(Constants.KEY_DEFAULT_LANGUAGE, this.defaultLanguageCode);
    this.translate.use(this.defaultLanguageCode);
    this.myEvent.setLanguageData(this.defaultLanguageCode);
    this.navCtrl.back();
  }
}
