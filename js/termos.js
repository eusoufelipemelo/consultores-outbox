/* ============================================================
   OutBox Consultores — Termos e Políticas (termos.js)
   Termo de Prestação de Serviços / Não Vínculo, Termos de Uso
   e Política de Privacidade (LGPD). Aceite eletrônico obrigatório.
   IMPORTANTE: textos base, recomenda-se revisão por advogado.
   ============================================================ */
const TERMOS = {
  /* Suba a versão sempre que o conteúdo mudar de forma relevante:
     todos os consultores precisarão aceitar de novo no próximo login. */
  VERSAO: '1.0',
  DATA: '01/07/2026',

  EMPRESA: {
    razao: 'OutBox Group Soluções Digitais',
    cnpj: '51.174.401/0001-07',
    endereco: 'Rua João Andriolli, 121, Chácara Peixe, Santa Cruz do Rio Pardo/SP, CEP 18.900-402',
    cidade: 'Santa Cruz do Rio Pardo/SP',
    foro: 'Comarca de Santa Cruz do Rio Pardo, Estado de São Paulo',
    site: 'consultores.outboxgroup.com.br',
    dpo: 'felipe@outboxgroup.com.br'
  },

  /* lista dos documentos que compõem o aceite (para o registro de auditoria) */
  DOCUMENTOS: 'termo_servico,termos_uso,privacidade',

  /* rótulo curto de cada documento (abas do aceite) */
  ABAS: [
    { id: 'termo', nome: 'Termo de Não Vínculo' },
    { id: 'uso', nome: 'Termos de Uso' },
    { id: 'privacidade', nome: 'Privacidade (LGPD)' }
  ],

  /* ---------- 1) TERMO DE PRESTAÇÃO DE SERVIÇOS / NÃO VÍNCULO ---------- */
  termoServico() {
    const e = this.EMPRESA;
    return `
      <h3>Termo de Prestação de Serviços Autônomos e Declaração de Inexistência de Vínculo Empregatício</h3>
      <p class="doc-meta">Versão ${this.VERSAO}, vigente a partir de ${this.DATA}.</p>

      <h4>1. Das partes</h4>
      <p>De um lado, <b>${e.razao}</b>, inscrita no CNPJ sob o nº ${e.cnpj}, com sede na ${e.endereco}, doravante denominada <b>OutBox</b>. De outro lado, a pessoa física ou jurídica identificada no cadastro deste sistema, doravante denominada <b>Consultor(a) Parceiro(a)</b>, que pode atuar como pessoa física mediante CPF ou como pessoa jurídica mediante CNPJ.</p>

      <h4>2. Do objeto</h4>
      <p>O presente Termo tem por objeto a atuação do Consultor Parceiro como profissional autônomo e independente, na divulgação, indicação e intermediação comercial dos produtos e serviços digitais oferecidos pela OutBox, mediante remuneração exclusivamente por comissão sobre as vendas efetivamente concretizadas e pagas, na forma das regras comerciais vigentes na plataforma.</p>

      <h4>3. Da natureza autônoma e da inexistência de vínculo empregatício</h4>
      <p>As partes declaram, de forma expressa e de comum acordo, que a relação ora estabelecida é de natureza estritamente civil e comercial, não configurando vínculo empregatício de qualquer espécie, por não estarem presentes os requisitos do art. 3º da Consolidação das Leis do Trabalho (CLT). Em especial, o Consultor Parceiro reconhece que:</p>
      <ul>
        <li>atua com plena <b>autonomia</b>, definindo livremente seus horários, sua rotina, seus métodos de trabalho e sua organização, sem subordinação jurídica, hierárquica ou pessoal à OutBox;</li>
        <li>não está sujeito a <b>controle de jornada</b>, ponto, escala, metas obrigatórias sob penalidade, ou ordens diretas de superiores hierárquicos;</li>
        <li>não há <b>pessoalidade</b> obrigatória, podendo o Consultor, quando pessoa jurídica, organizar sua própria estrutura para a execução das atividades;</li>
        <li>não há <b>exclusividade</b>, sendo o Consultor livre para exercer outras atividades e representar outras empresas, desde que respeitado o dever de confidencialidade e a vedação à concorrência desleal;</li>
        <li>não receberá salário fixo, décimo terceiro, férias, FGTS ou quaisquer verbas de natureza trabalhista, uma vez que a única contraprestação é a <b>comissão</b> por resultado;</li>
        <li>arca, por conta própria, com todos os <b>custos</b> de sua atividade (deslocamento, comunicação, equipamentos e afins).</li>
      </ul>

      <h4>4. Das obrigações tributárias e previdenciárias do Consultor</h4>
      <p>O Consultor Parceiro é o único responsável pelo recolhimento de todos os tributos, contribuições e encargos incidentes sobre a comissão recebida, incluindo, quando aplicável, imposto de renda, ISS e contribuição previdenciária (INSS), bem como pela emissão dos documentos fiscais cabíveis, isentando a OutBox de qualquer responsabilidade a esse título.</p>

      <h4>5. Da atuação em nome próprio</h4>
      <p>O Consultor Parceiro atua em nome próprio na captação e indicação de clientes, não podendo, salvo autorização expressa e por escrito da OutBox, assumir obrigações, conceder descontos, firmar contratos ou representar a OutBox perante terceiros além do que estiver previamente autorizado nas regras da plataforma.</p>

      <h4>6. Da confidencialidade</h4>
      <p>O Consultor Parceiro compromete-se a manter sigilo sobre informações comerciais, estratégicas, técnicas e cadastrais a que tiver acesso em razão desta parceria, inclusive dados de clientes, sob pena de responsabilização civil, obrigação essa que subsiste após o término da relação.</p>

      <h4>7. Da vigência e da rescisão</h4>
      <p>A parceria vigora por prazo indeterminado e pode ser encerrada por qualquer das partes, a qualquer tempo, sem necessidade de aviso prévio de natureza trabalhista e sem imposição de multa, mediante simples comunicação, resguardado o pagamento das comissões já apuradas e devidas até a data do encerramento.</p>

      <h4>8. Do aceite eletrônico</h4>
      <p>O Consultor Parceiro declara que leu, compreendeu e concorda integralmente com este Termo, manifestando seu aceite de forma eletrônica. As partes reconhecem a validade jurídica do aceite eletrônico, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020, sendo registrados data, hora, versão do documento e identificação do Consultor como prova da manifestação de vontade.</p>

      <h4>9. Do foro</h4>
      <p>Fica eleito o foro da ${e.foro}, para dirimir eventuais controvérsias oriundas deste Termo, com renúncia a qualquer outro, por mais privilegiado que seja.</p>

      <p class="doc-note">Ao marcar a caixa de aceite, o Consultor Parceiro declara, para todos os fins de direito, que atua por conta própria, na condição de profissional autônomo ou de pessoa jurídica, e que <b>não possui qualquer vínculo empregatício</b> com a ${e.razao}.</p>
    `;
  },

  /* ---------- 2) TERMOS DE USO ---------- */
  termosUso() {
    const e = this.EMPRESA;
    return `
      <h3>Termos de Uso da Plataforma</h3>
      <p class="doc-meta">Versão ${this.VERSAO}, vigente a partir de ${this.DATA}.</p>

      <h4>1. Objeto</h4>
      <p>Estes Termos regulam o uso do sistema de gestão de consultores parceiros disponibilizado pela <b>${e.razao}</b> (CNPJ ${e.cnpj}) no endereço ${e.site}, destinado ao acompanhamento de clientes, orçamentos, vendas, comissões, premiações e treinamentos.</p>

      <h4>2. Cadastro e credenciais</h4>
      <p>O acesso é pessoal e intransferível. O Consultor é responsável pela veracidade dos dados informados e pela guarda de sua senha, respondendo por todas as atividades realizadas com suas credenciais. Suspeita de uso indevido deve ser comunicada imediatamente à OutBox.</p>

      <h4>3. Uso permitido</h4>
      <p>A plataforma deve ser utilizada exclusivamente para as finalidades da parceria comercial. É vedado: (a) inserir dados falsos ou de terceiros sem autorização; (b) tentar acessar áreas ou dados de outros usuários; (c) explorar falhas, realizar engenharia reversa ou sobrecarregar o sistema; (d) utilizar os dados de clientes para fins alheios à parceria.</p>

      <h4>4. Comissões e valores</h4>
      <p>Os valores de comissão, metas e premiações exibidos têm caráter gerencial e informativo e estão sujeitos às regras comerciais vigentes e à efetiva confirmação do pagamento pelo cliente. A OutBox pode ajustar regras, faixas e percentuais, comunicando os consultores, sem que isso gere direito adquirido sobre condições anteriores.</p>

      <h4>5. Propriedade intelectual</h4>
      <p>A marca, o sistema, os conteúdos, os materiais de treinamento e o layout são de titularidade da OutBox, sendo vedada a reprodução, distribuição ou uso fora do escopo da parceria sem autorização prévia por escrito.</p>

      <h4>6. Disponibilidade</h4>
      <p>A OutBox emprega esforços razoáveis para manter a plataforma disponível, mas não garante funcionamento ininterrupto ou livre de erros, podendo realizar manutenções, atualizações ou suspensões técnicas. A plataforma é fornecida no estado em que se encontra.</p>

      <h4>7. Limitação de responsabilidade</h4>
      <p>A OutBox não se responsabiliza por danos decorrentes do uso indevido da plataforma, de indisponibilidades temporárias, de decisões comerciais do Consultor ou de dados incorretos por ele inseridos.</p>

      <h4>8. Suspensão e encerramento</h4>
      <p>A OutBox pode suspender ou encerrar o acesso em caso de violação destes Termos, de conduta que prejudique a OutBox, clientes ou terceiros, ou por encerramento da parceria, resguardadas as comissões já devidas.</p>

      <h4>9. Alterações</h4>
      <p>Estes Termos podem ser atualizados a qualquer tempo. Alterações relevantes exigirão novo aceite no próximo acesso, condicionando o uso da plataforma à concordância com a versão vigente.</p>

      <h4>10. Foro</h4>
      <p>Aplica-se a legislação brasileira, elegendo-se o foro da ${e.foro} para dirimir controvérsias.</p>
    `;
  },

  /* ---------- 3) POLÍTICA DE PRIVACIDADE (LGPD) ---------- */
  privacidade() {
    const e = this.EMPRESA;
    return `
      <h3>Política de Privacidade e Proteção de Dados (LGPD)</h3>
      <p class="doc-meta">Versão ${this.VERSAO}, vigente a partir de ${this.DATA}. Em conformidade com a Lei nº 13.709/2018 (LGPD).</p>

      <h4>1. Controlador e Encarregado</h4>
      <p>O controlador dos dados é a <b>${e.razao}</b>, CNPJ ${e.cnpj}, com sede na ${e.endereco}. O Encarregado pelo Tratamento de Dados (DPO) pode ser contatado pelo e-mail <b>${e.dpo}</b> para qualquer questão relativa a privacidade e proteção de dados.</p>

      <h4>2. Dados que tratamos</h4>
      <ul>
        <li><b>Dados cadastrais do Consultor:</b> nome, CPF ou CNPJ, e-mail, telefone, data de nascimento, endereço, instagram e foto de perfil.</li>
        <li><b>Dados de pagamento de comissão:</b> informações necessárias para o repasse das comissões, quando fornecidas.</li>
        <li><b>Dados de clientes inseridos pelo Consultor:</b> nome, contato, documento, endereço e informações do projeto, tratados pela OutBox na qualidade de controladora para a operação da parceria.</li>
        <li><b>Dados de uso:</b> registros de acesso, data e hora, endereço IP e navegador, inclusive o registro do aceite destes documentos.</li>
      </ul>

      <h4>3. Finalidades e bases legais</h4>
      <p>Tratamos os dados para: (a) executar e gerenciar a parceria comercial, com base na <b>execução de contrato</b> (art. 7º, V, da LGPD); (b) cumprir obrigações legais, fiscais e regulatórias, com base no <b>cumprimento de obrigação legal</b> (art. 7º, II); (c) prevenir fraudes, garantir segurança e comprovar o aceite, com base no <b>legítimo interesse</b> (art. 7º, IX); e (d) comunicações e finalidades específicas, quando aplicável, com base no <b>consentimento</b> (art. 7º, I), que pode ser revogado.</p>

      <h4>4. Compartilhamento</h4>
      <p>Os dados podem ser compartilhados com fornecedores de tecnologia e infraestrutura que operam a plataforma (por exemplo, provedores de hospedagem e banco de dados), sempre limitados ao necessário, bem como com autoridades quando houver obrigação legal. Não vendemos dados pessoais.</p>

      <h4>5. Transferência internacional</h4>
      <p>Alguns provedores de infraestrutura podem armazenar dados em servidores localizados fora do Brasil. Nesses casos, adotamos salvaguardas para assegurar proteção compatível com a LGPD.</p>

      <h4>6. Armazenamento, segurança e retenção</h4>
      <p>Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados e situações de perda ou alteração. Os dados são mantidos pelo tempo necessário às finalidades e ao cumprimento de obrigações legais, sendo eliminados ou anonimizados quando não houver mais base legal para sua guarda.</p>

      <h4>7. Direitos do titular</h4>
      <p>Nos termos do art. 18 da LGPD, o titular pode solicitar: confirmação da existência de tratamento; acesso aos dados; correção de dados incompletos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários; portabilidade; informação sobre compartilhamentos; e revogação do consentimento. As solicitações podem ser feitas pelo e-mail do Encarregado (${e.dpo}).</p>

      <h4>8. Cookies e armazenamento local</h4>
      <p>A plataforma utiliza armazenamento local do navegador e cookies estritamente necessários para autenticação, preferências (como o tema) e funcionamento do sistema.</p>

      <h4>9. Alterações desta Política</h4>
      <p>Esta Política pode ser atualizada. Alterações relevantes exigirão novo aceite no próximo acesso.</p>

      <p class="doc-note">Ao aceitar, o titular declara estar ciente do tratamento de seus dados pessoais nos termos desta Política, em conformidade com a LGPD.</p>
    `;
  },

  /* retorna o HTML de um documento pelo id da aba */
  docPorId(id) {
    if (id === 'uso') return this.termosUso();
    if (id === 'privacidade') return this.privacidade();
    return this.termoServico();
  }
};
