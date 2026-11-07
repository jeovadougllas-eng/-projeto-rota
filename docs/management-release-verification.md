# Verificação da publicação RotaMapa 1.2.0

Publicação de testes concluída em 4 de novembro de 2026.

- Web/PWA: https://traxio-preview.vercel.app/
- Instalador para novas instalações: https://traxio-preview.vercel.app/downloads/rotamapa-android-testes.apk
- Commit com os artefatos: `5a338ccf229d6a6c0f768ac8a5465df85b9cb845`.
- Implantação Vercel: `dpl_BMFC2Pw3VtbpD2VG6SdyGP4buFwt`, projeto existente traxio-preview, estado READY.
- [Execução completa de testes e geração do pacote](https://github.com/jeovadougllas-eng/-projeto-rota/actions/runs/41860023102): banco, navegador, compilação Android e publicação concluídos com sucesso.

## Evidência

134 testes de regras passaram. Foram executados 145 testes de interface/regressão: 66 dos novos fluxos em seis perfis de navegador, 36 da conta, 15 de PDFs anteriores, 9 de preços, 3 de planejamento, 9 de aparência, 3 de backup e 4 de agenda. As três verificações SQL de faturamento, versões de carteira e progressão de planos passaram em banco descartável, incluindo isolamento entre titulares, conflitos de revisão, limites de plano e rejeição de atalhos de upgrade.

Após a publicação, os mesmos fluxos de gestão passaram em 33 verificações no endereço público: 11 em cada perfil de Android, desktop e Safari/iPhone. A identidade e os serviços externos foram simulados; somente a página e os arquivos estáticos publicados foram carregados de verdade. Não foram gravadas vendas ou carteiras reais durante esses testes. A checagem pública também confirmou que a API recusa acesso anônimo e origens não permitidas, e aceita o preflight do aplicativo Android.

Todos os 114 arquivos declarados no pacote foram conferidos byte a byte tanto no APK quanto no ZIP da atualização. Os módulos compartilhados publicados na web também foram comparados com o manifesto. O instalador original permanece com o mesmo hash. Nenhuma instalação em aparelho físico é alegada por esta verificação.

## Artefatos conferidos

- APK: 17,871,397 bytes; SHA-256 `1714c914f82bae180e3730d731c9a56b7d5e26b291c59ba915dc51fdf1bd6317`.
- Atualização: `347ec7b6deee378f9099f4587ac20e4d695b18291c6b529e1f17e6e7e4db36fb`; 12,079,289 bytes; SHA-256 do ZIP `96a7fb3eddaa13632a6d8190b68b14ce8d1bf068f815c3beb2d336a5665b9964`.
- Compatibilidade: `capacitor8-20261026`, versão nativa 2.

As migrações aplicadas e os nomes no repositório estão alinhados: `20261104151001`, `20261104151004` e `20261104151007`. Não houve exclusão nem substituição de clientes existentes na implantação.

O teste de planos exige convite vinculado ao e-mail autorizado e confirmado. O convite e os dados de acesso não são publicados neste documento. A conta do responsável permaneceu Pro; o acesso beta geral não foi alterado. Nenhuma cobrança, cartão, Pix ou serviço de pagamento é utilizado. O titular da conta convidada precisa entrar e ativar o convite para começar o teste real.

Para as instalações Android compatíveis existentes, use **Menu da conta → Sobre e atualizações → Verificar atualizações**. Preserve os dados do aplicativo. O APK acima serve para novas instalações.

Consulte [o funcionamento e as regras desta versão](management-release.md).
