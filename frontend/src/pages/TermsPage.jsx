import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link to="/" className="text-primary-light hover:text-primary text-sm transition-colors">
            &larr; Voltar ao inicio
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-light/50 p-8 space-y-6">
          <h1 className="text-3xl font-bold text-white">Termos de Servico</h1>
          <p className="text-sm text-gray-500">Ultima atualizacao: 04 de marco de 2026</p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Aceitacao dos Termos</h2>
            <p className="text-gray-400 leading-relaxed">
              Ao acessar e utilizar a plataforma Rise Up Arena ("Plataforma"), voce concorda em cumprir e estar vinculado a estes Termos de Servico. Se voce nao concordar com qualquer parte destes termos, nao devera utilizar a Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Descricao do Servico</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena e uma plataforma de esports competitivos que oferece servicos de matchmaking, campeonatos, rankings e loja virtual para jogadores. A Plataforma permite que usuarios participem de lobbies, torneios e acompanhem suas estatisticas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Cadastro e Conta</h2>
            <p className="text-gray-400 leading-relaxed">
              Para utilizar os servicos da Plataforma, voce devera criar uma conta fornecendo informacoes verdadeiras, completas e atualizadas, incluindo nome completo, CPF, email e nome de usuario. Voce e responsavel por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Elegibilidade</h2>
            <p className="text-gray-400 leading-relaxed">
              Voce declara ter pelo menos 16 anos de idade para utilizar a Plataforma. Menores de 18 anos devem ter autorizacao dos pais ou responsaveis legais. A Plataforma reserva-se o direito de solicitar comprovacao de idade a qualquer momento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Conduta do Usuario</h2>
            <p className="text-gray-400 leading-relaxed">Ao utilizar a Plataforma, voce concorda em nao:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
              <li>Utilizar cheats, hacks, bots ou qualquer software nao autorizado</li>
              <li>Assediar, ameacar ou intimidar outros usuarios</li>
              <li>Criar contas falsas ou multiplas contas</li>
              <li>Manipular resultados de partidas ou rankings</li>
              <li>Compartilhar conteudo ofensivo, ilegal ou inapropriado</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Tentar acessar sistemas ou dados sem autorizacao</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Creditos e Loja Virtual</h2>
            <p className="text-gray-400 leading-relaxed">
              A Plataforma pode oferecer um sistema de creditos virtuais que podem ser utilizados na loja da Plataforma. Creditos nao possuem valor monetario real e nao podem ser trocados por dinheiro. A Plataforma reserva-se o direito de modificar precos e disponibilidade de itens a qualquer momento.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Suspensao e Encerramento</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena reserva-se o direito de suspender ou encerrar sua conta, a qualquer momento e sem aviso previo, caso haja violacao destes Termos de Servico ou por qualquer outro motivo considerado razoavel pela administracao da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Limitacao de Responsabilidade</h2>
            <p className="text-gray-400 leading-relaxed">
              A Plataforma e fornecida "como esta", sem garantias de qualquer tipo. A Rise Up Arena nao se responsabiliza por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso da Plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">9. Alteracoes nos Termos</h2>
            <p className="text-gray-400 leading-relaxed">
              A Rise Up Arena reserva-se o direito de alterar estes Termos de Servico a qualquer momento. As alteracoes serao comunicadas atraves da Plataforma e entrarao em vigor imediatamente apos sua publicacao. O uso continuado da Plataforma apos as alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">10. Contato</h2>
            <p className="text-gray-400 leading-relaxed">
              Em caso de duvidas sobre estes Termos de Servico, entre em contato conosco atraves do email: suporte@riseuparena.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
