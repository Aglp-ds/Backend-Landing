import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LeadsModule } from './leads/leads.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AdminUsersModule } from './admin-users/admin-users.module';

@Module({
  imports: [
    // Carga las variables del archivo .env y las deja disponibles en toda la app.
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    LeadsModule,
    CampaignsModule,
    AdminUsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
