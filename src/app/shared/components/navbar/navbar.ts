import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TemPermissaoDirective } from '../permissoes/tem-permissao.directive';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Permissoes } from '../../../core/constants/permissions';
import { PermissaoService } from '../../../core/services/permissao.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, TemPermissaoDirective, RouterLinkActive, CommonModule],
  standalone: true,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar {
  
  // 👇 AS INJEÇÕES FORAM ADICIONADAS AQUI 👇
  constructor(
    public permissaoService: PermissaoService,
    private supabaseService: SupabaseService, 
    private router: Router
  ) {}

  protected readonly Permissoes = Permissoes; // Para usar no *temPermissao do HTML
  
  // Variável que controla se o menu do celular está aberto (true) ou fechado (false)
  menuAberto: boolean = false;

  // Função disparada ao clicar no botão hambúrguer (Inverte o valor atual)
  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  // Função disparada ao clicar em qualquer link (Força o fechamento do menu)
  fecharMenu() {
    this.menuAberto = false;
  }

  async logout() {
    try {
      // 👇 Corrigido para minúsculo 👇
      await this.supabaseService.signOut();
      this.router.navigate(['/login']); // Redireciona para o login após sair
    } catch (error) {
      alert('Não foi possível sair do sistema. Tente novamente.');
    }
  }
}