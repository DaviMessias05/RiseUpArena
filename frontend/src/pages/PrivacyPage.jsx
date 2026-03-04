import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-primary-light hover:text-primary text-sm transition-colors">
            &larr; Voltar ao inicio
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-light/50 p-8 space-y-6">
          <h1 className="text-3xl font-bold text-white">Politica de Privacidade</h1>
          <p className="text-sm text-gray-500">Ultima atualizacao: 04 de marco de 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Dados Coletados</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena coleta os seguintes dados pessoais durante o cadastro e uso da Plataforma:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Nome completo</li>
              <li>CPF</li>
              <li>Endereco de email</li>
              <li>Nome de usuario</li>
              <li>Dados de jogo e estatisticas</li>
              <li>Informacoes de acesso (IP, navegador, dispositivo)</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Uso dos Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Seus dados pessoais sao utilizados para:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Criar e gerenciar sua conta na Plataforma</li>
              <li>Identificar usuarios de forma unica e prevenir fraudes</li>
              <li>Fornecer os servicos de matchmaking, torneios e rankings</li>
              <li>Enviar comunicacoes sobre a Plataforma</li>
              <li>Melhorar nossos servicos e experiencia do usuario</li>
              <li>Cumprir obrigacoes legais</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Protecao dos Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Adotamos medidas tecnicas e organizacionais adequadas para proteger seus dados pessoais contra acesso nao autorizado, perda, destruicao ou alteracao. Dados sensiveis como o CPF sao armazenados de forma segura em nossos servidores.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Compartilhamento de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena nao vende, aluga ou compartilha seus dados pessoais com terceiros para fins comerciais. Seus dados podem ser compartilhados apenas nas seguintes situacoes:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Com provedores de servico essenciais para o funcionamento da Plataforma</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger os direitos e seguranca da Plataforma e seus usuarios</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Seus Direitos (LGPD)</h2>
            <p className="text-gray-400 leading-relaxed">
              De acordo com a Lei Geral de Protecao de Dados (LGPD), voce tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Confirmar a existencia de tratamento de seus dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a anonimizacao ou eliminacao de dados desnecessarios</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos seus dados</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Cookies</h2>
            <p className="text-gray-400 leading-relaxed">
              A Plataforma utiliza cookies e tecnologias similares para melhorar a experiencia de navegacao, manter sua sessao ativa e coletar dados analiticos. Voce pode gerenciar suas preferencias de cookies nas configuracoes do seu navegador.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Retencao de Dados</h2>
            <p className="text-gray-400 leading-relaxed">
              Seus dados pessoais serao mantidos enquanto sua conta estiver ativa ou conforme necessario para fornecer nossos servicos. Apos a exclusao da conta, seus dados serao removidos em ate 30 dias, exceto quando a retencao for necessaria por obrigacao legal.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Contato</h2>
            <p className="text-gray-400 leading-relaxed">
              Para exercer seus direitos ou esclarecer duvidas sobre esta Politica de Privacidade, entre em contato pelo email: privacidade@riseuparena.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
