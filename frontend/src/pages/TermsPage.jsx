import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-primary-light hover:text-primary text-sm transition-colors">
            &larr; Voltar ao início
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-light/50 p-8 space-y-6">
          <h1 className="text-3xl font-bold text-white">Termos de Serviço</h1>
          <p className="text-sm text-gray-500">Última atualização: 04 de março de 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Aceitação dos Termos</h2>
            <p className="text-gray-400 leading-relaxed">
              Ao acessar e utilizar a plataforma Rise Up Arena ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não deverá utilizar a Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Descrição do Serviço</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena é uma plataforma de esports competitivos que oferece serviços de matchmaking, campeonatos, rankings e loja virtual para jogadores. A Plataforma permite que usuários participem de lobbies, torneios e acompanhem suas estatísticas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Cadastro e Conta</h2>
            <p className="text-gray-400 leading-relaxed">
              Para utilizar os serviços da Plataforma, você deverá criar uma conta fornecendo informações verdadeiras, completas e atualizadas, incluindo nome completo, CPF, email e nome de usuário. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Elegibilidade</h2>
            <p className="text-gray-400 leading-relaxed">
              Você declara ter pelo menos 16 anos de idade para utilizar a Plataforma. Menores de 18 anos devem ter autorização dos pais ou responsáveis legais. A Plataforma reserva-se o direito de solicitar comprovação de idade a qualquer momento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Conduta do Usuário</h2>
            <p className="text-gray-400 leading-relaxed">Ao utilizar a Plataforma, você concorda em não:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Utilizar cheats, hacks, bots ou qualquer software não autorizado</li>
              <li>Assediar, ameaçar ou intimidar outros usuários</li>
              <li>Criar contas falsas ou múltiplas contas</li>
              <li>Manipular resultados de partidas ou rankings</li>
              <li>Compartilhar conteúdo ofensivo, ilegal ou inapropriado</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Tentar acessar sistemas ou dados sem autorização</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Créditos e Loja Virtual</h2>
            <p className="text-gray-400 leading-relaxed">
              A Plataforma pode oferecer um sistema de créditos virtuais que podem ser utilizados na loja da Plataforma. Créditos não possuem valor monetário real e não podem ser trocados por dinheiro. A Plataforma reserva-se o direito de modificar preços e disponibilidade de itens a qualquer momento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Suspensão e Encerramento</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena reserva-se o direito de suspender ou encerrar sua conta, a qualquer momento e sem aviso prévio, caso haja violação destes Termos de Serviço ou por qualquer outro motivo considerado razoável pela administração da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-400 leading-relaxed">
              A Plataforma é fornecida "como está", sem garantias de qualquer tipo. A Rise Up Arena não se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">9. Alterações nos Termos</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena reserva-se o direito de alterar estes Termos de Serviço a qualquer momento. As alterações serão comunicadas através da Plataforma e entrarão em vigor imediatamente após sua publicação. O uso continuado da Plataforma após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">10. Contato</h2>
            <p className="text-gray-400 leading-relaxed">
              Em caso de dúvidas sobre estes Termos de Serviço, entre em contato conosco através do email: suporte@riseuparena.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
