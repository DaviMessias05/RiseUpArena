import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-primary-light hover:text-primary text-sm transition-colors">
            &larr; Voltar ao início
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-light/50 p-8 space-y-6">
          <h1 className="text-3xl font-bold text-white">Política de Privacidade</h1>
          <p className="text-sm text-gray-500">Última atualização: 04 de março de 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Dados Coletados</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena coleta os seguintes dados pessoais durante o cadastro e uso da Plataforma:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Nome completo</li>
              <li>CPF</li>
              <li>Endereço de email</li>
              <li>Nome de usuário</li>
              <li>Dados de jogo e estatísticas</li>
              <li>Informações de acesso (IP, navegador, dispositivo)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Uso dos Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Seus dados pessoais são utilizados para:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Criar e gerenciar sua conta na Plataforma</li>
              <li>Identificar usuários de forma única e prevenir fraudes</li>
              <li>Fornecer os serviços de matchmaking, torneios e rankings</li>
              <li>Enviar comunicações sobre a Plataforma</li>
              <li>Melhorar nossos serviços e experiência do usuário</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Proteção dos Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso não autorizado, perda, destruição ou alteração. Dados sensíveis como o CPF são armazenados de forma segura em nossos servidores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Compartilhamento de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena não vende, aluga ou compartilha seus dados pessoais com terceiros para fins comerciais. Seus dados podem ser compartilhados apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Com provedores de serviço essenciais para o funcionamento da Plataforma</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger os direitos e segurança da Plataforma e seus usuários</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Seus Direitos (LGPD)</h2>
            <p className="text-gray-400 leading-relaxed">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Confirmar a existência de tratamento de seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a anonimização ou eliminação de dados desnecessários</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos seus dados</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              A Plataforma utiliza cookies e tecnologias similares para melhorar a experiência de navegação, manter sua sessão ativa e coletar dados analíticos. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Retenção de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Seus dados pessoais serão mantidos enquanto sua conta estiver ativa ou conforme necessário para fornecer nossos serviços. Após a exclusão da conta, seus dados serão removidos em até 30 dias, exceto quando a retenção for necessária por obrigação legal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Contato</h2>
            <p className="text-gray-400 leading-relaxed">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato pelo email: privacidade@riseuparena.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
