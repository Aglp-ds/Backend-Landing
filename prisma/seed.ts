import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  AdminRole,
  ExportFormat,
  LeadSource,
  LeadStatus,
} from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL no está definida en el archivo .env');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // ==========================
  // LIMPIEZA CONTROLADA
  // ==========================
  // Se eliminan primero las tablas hijas para evitar conflictos por relaciones.
  // OJO: esto borra los datos de prueba existentes en estas tablas.
  await prisma.leadNote.deleteMany();
  await prisma.leadExport.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.adminUser.deleteMany();

  // ==========================
  // ADMIN USERS
  // ==========================
  // Password de prueba: Admin123*
  // En un proyecto real, este hash debería generarse con bcrypt.
  const superAdmin = await prisma.adminUser.create({
    data: {
      name: 'Admin Principal',
      email: 'admin@landing.test',
      passwordHash: '$2b$10$exampleHashForDevelopmentOnlyAdmin123',
      role: AdminRole.SUPER_ADMIN,
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  const viewer = await prisma.adminUser.create({
    data: {
      name: 'Usuario Visualizador',
      email: 'viewer@landing.test',
      passwordHash: '$2b$10$exampleHashForDevelopmentOnlyViewer123',
      role: AdminRole.VIEWER,
      isActive: true,
    },
  });

  // ==========================
  // CAMPAIGNS
  // ==========================
  const mainCampaign = await prisma.campaign.create({
    data: {
      name: 'Landing Principal Desarrollador',
      slug: 'landing-principal-desarrollador',
      description: 'Campaña principal para capturar leads desde la landing page de prueba técnica.',
      isActive: true,
      startsAt: new Date('2026-05-01T00:00:00.000Z'),
      endsAt: new Date('2026-12-31T23:59:59.000Z'),
    },
  });

  const metaCampaign = await prisma.campaign.create({
    data: {
      name: 'Campaña Meta Ads',
      slug: 'campania-meta-ads',
      description: 'Leads provenientes de Facebook e Instagram Ads.',
      isActive: true,
      startsAt: new Date('2026-05-01T00:00:00.000Z'),
    },
  });

  const organicCampaign = await prisma.campaign.create({
    data: {
      name: 'Tráfico Orgánico',
      slug: 'trafico-organico',
      description: 'Leads provenientes de búsquedas, referidos y visitas directas.',
      isActive: true,
    },
  });

  // ==========================
  // LEADS
  // ==========================
  const leads = await prisma.lead.createMany({
    data: [
      {
        firstName: 'Carlos',
        lastName: 'Gómez',
        fullName: 'Carlos Gómez',
        email: 'carlos.gomez@example.com',
        phone: '+50255550001',
        company: 'Comercial Gómez',
        jobTitle: 'Gerente General',
        message: 'Estoy interesado en recibir más información sobre sus servicios.',
        status: LeadStatus.NEW,
        source: LeadSource.LANDING_PAGE,
        ipAddress: '190.148.10.20',
        userAgent: 'Mozilla/5.0 Chrome Seed',
        referrer: 'https://google.com',
        metadata: {
          form: 'landing-main',
          acceptedTerms: true,
          utm_source: 'google',
          utm_medium: 'organic',
        },
        campaignId: mainCampaign.id,
        assignedToId: superAdmin.id,
        registeredAt: new Date('2026-05-10T15:30:00.000Z'),
      },
      {
        firstName: 'María',
        lastName: 'López',
        fullName: 'María López',
        email: 'maria.lopez@example.com',
        phone: '+50255550002',
        company: 'López Group',
        jobTitle: 'Directora Comercial',
        message: 'Quisiera una cotización personalizada.',
        status: LeadStatus.CONTACTED,
        source: LeadSource.FACEBOOK,
        ipAddress: '190.149.22.50',
        userAgent: 'Mozilla/5.0 Facebook App Seed',
        referrer: 'https://facebook.com',
        metadata: {
          form: 'meta-leads',
          utm_source: 'facebook',
          utm_medium: 'paid',
          adName: 'Lead Form Mayo',
        },
        campaignId: metaCampaign.id,
        assignedToId: superAdmin.id,
        registeredAt: new Date('2026-05-11T10:15:00.000Z'),
      },
      {
        firstName: 'José',
        lastName: 'Ramírez',
        fullName: 'José Ramírez',
        email: 'jose.ramirez@example.com',
        phone: '+50255550003',
        company: 'Ramírez Logistics',
        jobTitle: 'Encargado de Operaciones',
        message: 'Necesito que me contacten por WhatsApp.',
        status: LeadStatus.QUALIFIED,
        source: LeadSource.WHATSAPP,
        ipAddress: '181.209.33.14',
        userAgent: 'Mozilla/5.0 Mobile Seed',
        referrer: 'https://wa.me',
        metadata: {
          preferredContact: 'whatsapp',
          budget: 'medium',
        },
        campaignId: mainCampaign.id,
        assignedToId: superAdmin.id,
        registeredAt: new Date('2026-05-12T18:40:00.000Z'),
      },
      {
        firstName: 'Andrea',
        lastName: 'Castillo',
        fullName: 'Andrea Castillo',
        email: 'andrea.castillo@example.com',
        phone: '+50255550004',
        company: 'Castillo Studio',
        jobTitle: 'Fundadora',
        message: 'Me gustaría conocer los planes disponibles.',
        status: LeadStatus.CONVERTED,
        source: LeadSource.INSTAGRAM,
        ipAddress: '190.56.90.10',
        userAgent: 'Mozilla/5.0 Instagram Seed',
        referrer: 'https://instagram.com',
        metadata: {
          utm_source: 'instagram',
          utm_medium: 'paid',
          content: 'story-ad',
        },
        campaignId: metaCampaign.id,
        assignedToId: superAdmin.id,
        registeredAt: new Date('2026-05-13T09:05:00.000Z'),
      },
      {
        firstName: 'Luis',
        lastName: 'Morales',
        fullName: 'Luis Morales',
        email: 'luis.morales@example.com',
        phone: '+50255550005',
        company: null,
        jobTitle: null,
        message: 'Solo estoy consultando información por ahora.',
        status: LeadStatus.REJECTED,
        source: LeadSource.REFERRAL,
        ipAddress: '181.174.44.88',
        userAgent: 'Mozilla/5.0 Safari Seed',
        referrer: 'https://referido.test',
        metadata: {
          referredBy: 'cliente-existente',
        },
        campaignId: organicCampaign.id,
        assignedToId: viewer.id,
        registeredAt: new Date('2026-05-14T12:20:00.000Z'),
      },
      {
        firstName: 'Fernanda',
        lastName: 'Pérez',
        fullName: 'Fernanda Pérez',
        email: 'fernanda.perez@example.com',
        phone: '+50255550006',
        company: 'Pérez Consulting',
        jobTitle: 'Consultora',
        message: 'Busco una solución para capturar y ordenar prospectos.',
        status: LeadStatus.NEW,
        source: LeadSource.GOOGLE,
        ipAddress: '190.115.66.70',
        userAgent: 'Mozilla/5.0 Chrome Seed',
        referrer: 'https://google.com/search',
        metadata: {
          utm_source: 'google',
          utm_medium: 'cpc',
          keyword: 'crm para leads',
        },
        campaignId: organicCampaign.id,
        assignedToId: null,
        registeredAt: new Date('2026-05-15T08:00:00.000Z'),
      },
    ],
  });

  const createdLeads = await prisma.lead.findMany({
    orderBy: {
      registeredAt: 'asc',
    },
  });

  // ==========================
  // NOTES
  // ==========================
  if (createdLeads[0]) {
    await prisma.leadNote.create({
      data: {
        leadId: createdLeads[0].id,
        adminUserId: superAdmin.id,
        note: 'Lead nuevo. Contactar durante horario laboral.',
      },
    });
  }

  if (createdLeads[1]) {
    await prisma.leadNote.create({
      data: {
        leadId: createdLeads[1].id,
        adminUserId: superAdmin.id,
        note: 'Ya fue contactada. Solicita cotización por correo.',
      },
    });
  }

  if (createdLeads[2]) {
    await prisma.leadNote.create({
      data: {
        leadId: createdLeads[2].id,
        adminUserId: superAdmin.id,
        note: 'Lead calificado. Prefiere seguimiento por WhatsApp.',
      },
    });
  }

  // ==========================
  // EXPORT HISTORY
  // ==========================
  await prisma.leadExport.create({
    data: {
      fileName: 'leads_export_2026_05_15.csv',
      format: ExportFormat.CSV,
      totalRows: leads.count,
      filters: {
        dateFrom: '2026-05-01',
        dateTo: '2026-05-15',
        status: 'ALL',
      },
      exportedById: superAdmin.id,
    },
  });

  console.log('✅ Seed completada correctamente');
  console.log(`👤 Admins creados: 2`);
  console.log(`📣 Campañas creadas: 3`);
  console.log(`🧲 Leads creados: ${leads.count}`);
  console.log(`📝 Notas creadas: 3`);
  console.log(`📤 Exportaciones creadas: 1`);
}

main()
  .catch((error) => {
    console.error('❌ Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
