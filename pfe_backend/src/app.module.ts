import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Depense } from './depense.entity';
import { Stock } from './stock.entity'; 
import { Devis } from './devis.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forRoot({
      type: 'oracle',
      host: 'localhost',
      port: 1521,
      username: 'system',
      password: 'NewPassword',
      serviceName: 'XE',
      entities: [Depense, Stock, Devis],
      synchronize: false,
    }),
    TypeOrmModule.forFeature([Depense, Stock, Devis])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}