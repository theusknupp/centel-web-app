import { Routes } from '@angular/router';

// Importamos as nossas telas (classes) para que o Angular saiba quem elas são.
// ATENÇÃO: Verifique se o caminho './features/...' bate certinho com os nomes dos seus arquivos!
import { Login } from './features/auth/login/login'; 
import { Dashboard } from './features/home/dashboard/dashboard';
import { ClienteCadastro } from './features/clientes/cliente-cadastro/cliente-cadastro';
import { EmissaoOs } from './features/service-order/os-issue/emissao-os';
import { ListaOsComponent } from './features/service-order/lista-os/lista-os';
import { ReportsComponent } from './features/reports/reports';



export const routes: Routes = [
  // 1. ROTA PADRÃO: Se o usuário acessar o site sem digitar nada na URL, mandamos ele para o login.
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 2. ROTA DE LOGIN: Quando a URL for '/login', mostra a tela LOGIN.
  { path: 'login', component: Login },

  // 3. ROTA DO DASHBOARD: Quando a URL for '/dashboard', mostra a tela DASHBOARD.
  { path: 'dashboard', component: Dashboard },

  // 4. ROTA DO CADASTRO CLIENTE: Quando a URL for '/cliente mostra a tela CLIENTE
  { path: 'cadastro', component: ClienteCadastro},

  // 5. ROTA DA EMISSÃO DE OS
  { path: 'emissao-os', component: EmissaoOs},

  { path: 'lista-os', component: ListaOsComponent },

  { path: 'relatorio', component: ReportsComponent },

];