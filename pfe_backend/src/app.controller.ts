import { Controller, Post, Get, UseInterceptors, UploadedFile, Body } from '@nestjs/common'; 
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller('api/ia')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('upload-facture')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFacture(@UploadedFile() file: Express.Multer.File) {
    return await this.appService.ocrFacture(file);
  }

  @Post('upload-plan')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPlan(@UploadedFile() file: Express.Multer.File) {
    return await this.appService.devisFromPlan(file);
  }

  @Post('upload-bl')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBL(@UploadedFile() file: Express.Multer.File) {
    return await this.appService.ocrBonDeLivraison(file);
  }

  @Post('valider-facture')
  async validerFacture(@Body() body: any) {
    return await this.appService.validerFacture(body);
  }

  @Post('valider-devis-plan')
  async validerDevisPlan(@Body() body: any) {
    return await this.appService.validerDevisPlan(body);
  }

  @Post('valider-bl')
  async validerBL(@Body() body: any) {
    return await this.appService.validerEtIncrementerStock(body);
  }


  @Get('logs')
  async getLogs() {
    return await this.appService.getLogs();
  }
}