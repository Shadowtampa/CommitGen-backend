import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CliModule } from './cli/cli.module';

@Module({
  imports: [CliModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
