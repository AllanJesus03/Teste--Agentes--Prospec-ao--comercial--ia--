import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { MOCK_LEADS } from "../src/data/mock-leads";
import { WebsiteAnalyzer } from "../src/lib/website/analyzer";
import { detectCommercialSignals } from "../src/lib/validation/commercial";
import { QualificationAgent } from "../src/agents/qualification-agent";
import { SalesAgent } from "../src/agents/sales-agent";
import { upsertLead } from "../src/lib/database/leads";
import { LEAD_STATUS } from "../src/lib/constants";

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@leadscout.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

async function main() {
  console.log("→ Seed iniciado");

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash },
    create: {
      email: ADMIN_EMAIL,
      name: "Administrador",
      passwordHash,
      role: "admin",
    },
  });
  console.log(`✓ Usuário admin: ${user.email}`);

  const existingTemplates = await prisma.template.count();
  if (existingTemplates === 0) {
    await prisma.template.createMany({
      data: [
        {
          name: "Primeiro contato genérico",
          category: "first_contact",
          body: "Olá! Vi que o {{business_name}} publica conteúdos profissionais e notei que talvez ainda não tenha uma página própria na internet. Trabalho com criação de landing pages e posso ajudar a organizar suas informações em um único lugar — funcionam para fornecer endereço, telefone e até WhatsApp diretamente. Se fizer sentido, posso enviar um exemplo rápido.",
        },
        {
          name: "Oferta de landing page",
          category: "landing_offer",
          body: "Olá, {{business_name}}! Vi o perfil e penso que uma landing page simples e profissional ajudaria a converter seguidores em clientes: com link na bio, botão de WhatsApp e informações do serviço em {{city}}. Quer que eu monte uma proposta sem compromisso?",
        },
        {
          name: "Oferta de site institucional",
          category: "site_offer",
          body: "Oi! Seu conteúdo no Instagram é bem apresentado. Avaliei que um site institucional com portfólio e contato pode passar ainda mais credibilidade para quem chega pelo perfil. Posso te chamar no WhatsApp com uma sugestão personalizada?",
        },
        {
          name: "Follow-up padrão",
          category: "follow_up",
          body: "Oi! Ficou um tempo sem resposta em relação à proposta de uma página profissional para o {{business_name}}. Se preferir, posso enviar um exemplo prático do que faria. É só me dizer.",
        },
      ],
    });
    console.log(`✓ Templates iniciais criados`);
  }

  const analyzer = new WebsiteAnalyzer();
  let created = 0;
  let updated = 0;

  for (const mock of MOCK_LEADS) {
    const { lead, created: isCreated } = await upsertLead({
      instagramUsername: mock.username,
      instagramUrl: `https://instagram.com/${mock.username}`,
      businessName: mock.businessName,
      category: mock.category,
      bio: mock.bio,
      city: mock.city,
      state: mock.state,
      country: mock.country,
      followers: mock.followers,
      posts: mock.posts,
      whatsapp: mock.whatsapp,
      contactEmail: mock.contactEmail,
      websiteUrl: mock.websiteUrl,
      externalLinks:
        mock.externalLinks.length > 0
          ? JSON.stringify(mock.externalLinks)
          : undefined,
      dataSource: "seed",
      sourceUrl: `https://instagram.com/${mock.username}`,
      leadStatus: LEAD_STATUS.NEW,
    });

    if (isCreated) created++;
    else updated++;

    const classification = await analyzer.classify({
      bio: mock.bio,
      externalLinks: mock.externalLinks,
      websiteUrl: mock.websiteUrl,
    });

    const { signals, score } = detectCommercialSignals(mock.bio);

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        websiteStatus: classification.status,
        externalLinks: classification.urls.length
          ? JSON.stringify(classification.urls)
          : lead.externalLinks,
        commercialSignals: JSON.stringify(signals.filter((s) => s.found)),
        commercialScore: score,
        websiteNotReachable: false,
        analysisFailed: false,
      },
    });

    if (created % 10 === 0) {
      console.log(`  → ${created} leads classificados`);
    }
  }

  console.log(`✓ Perfis: ${created} criados, ${updated} atualizados`);

  const qualificationAgent = new QualificationAgent();
  const salesAgent = new SalesAgent();
  const leads = await prisma.lead.findMany({ select: { id: true } });
  for (const { id } of leads) {
    await qualificationAgent.execute({ leadId: id });
    await salesAgent.execute({ leadId: id });
  }
  console.log(`✓ ${leads.length} leads qualificados com análise de IA`);

  console.log("→ Seed concluído");
}

main()
  .catch((e) => {
    console.error("ERRO NO SEED", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });