import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
  
import { IonicModule } from '@ionic/angular';

import { PoolingConfirmedPageRoutingModule } from './pooling-confirmed-routing.module';

import { PoolingConfirmedPage } from './pooling-confirmed.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    PoolingConfirmedPageRoutingModule
  ],
  declarations: [PoolingConfirmedPage]
})
export class PoolingConfirmedPageModule {}
