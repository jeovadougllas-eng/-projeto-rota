# Primeira instalação com as atualizações automáticas

O site atualizado já pode ser usado em https://traxio-preview.vercel.app/ sem instalar nada.

O APK anterior tem uma assinatura de testes diferente. O Android não permite substituí-lo diretamente. Não desinstale o anterior sem guardar seus dados: o histórico e alguns planejamentos existem somente no aparelho, e um backup JSON de clientes não inclui todo esse conteúdo.

## Caminho que preserva o aparelho antigo

Mantenha o APK antigo instalado e use o site atualizado. O novo APK também pode ser testado num aparelho sem a versão antiga, usando a própria conta. A validação não exige apagar nada no tablet em uso.

## Migração completa assistida por computador

Disponível para os APKs de teste depuráveis utilizados nesta entrega. Requer computador com Python 3.11 ou superior, [Android Platform Tools oficial](https://developer.android.com/tools/releases/platform-tools), cabo USB e autorização de depuração USB no tablet. Não requer root nem acesso administrativo ao Supabase.

1. Encerre a navegação. Confira a sincronização em Planilhas e guarde também o backup JSON dos clientes, quando possível.
2. Baixe o [APK testado](../downloads/traxio-android-testes.apk) e a [ferramenta de migração](../downloads/traxelo-migrar.py) para uma pasta particular no computador.
3. Conecte apenas o tablet correspondente e autorize o computador na tela dele. Verifique se `adb devices` mostra um aparelho autorizado.
4. Faça primeiro somente o backup, na pasta dos arquivos:

   ```sh
   python traxelo-migrar.py
   ```

   O comando para o app, preserva seus diretórios de dados e o APK anterior e verifica os arquivos. Não desinstala o app. Ao terminar, ele é reaberto.

5. Quando decidir fazer a troca:

   ```sh
   python traxelo-migrar.py --apk traxio-android-testes.apk --migrate
   ```

   É criado outro backup completo. Só depois de verificá-lo a ferramenta pede para digitar `MIGRAR`. A troca remove o APK antigo, instala o novo, restaura os dados antes de usá-lo e confere o conteúdo de cada arquivo. Se houver falha na transição, tenta reinstalar o APK antigo e restaurar o backup. Os arquivos originais ficam guardados no computador.

6. Confira clientes, pontos confirmados, histórico e login. O Android pode pedir a permissão de localização novamente. Mantenha o backup até concluir essa conferência e desative a depuração USB quando terminar.

O backup completo contém dados pessoais e possivelmente a sessão de acesso. Guarde-o como informação privada; não o envie no chat nem o publique. A ferramenta aborta sem apagar o aplicativo se não conseguir obter/verificar o backup ou se o APK não corresponder ao SHA-256 testado.

## Depois dessa primeira troca

As versões web compatíveis são baixadas em segundo plano. Feche completamente e reabra o aplicativo para ativar uma atualização pendente; uma rota em andamento não é reiniciada. A versão anterior ou a incluída no APK é usada se a nova falhar nas verificações ou na inicialização.

Mudanças em permissões, plugins ou componentes Android ainda precisam de outro APK. Esta entrega não é uma publicação na Play Store. A migração foi verificada em emulador; a conferência final dos dados no tablet físico continua necessária.
