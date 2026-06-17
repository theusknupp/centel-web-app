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
  
  constructor(
    public permissaoService: PermissaoService,
    private supabaseService: SupabaseService, 
    private router: Router
  ) {}

  protected readonly Permissoes = Permissoes; 
  
  // Controles de estado dos menus
  menuAberto: boolean = false;
  menuAdminAberto: boolean = false;

  toggleMenu() {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenu() {
    this.menuAberto = false;
  }

  // --- Lógica do Menu do Administrador ---
  toggleAdminMenu() {
    this.menuAdminAberto = !this.menuAdminAberto;
  }

  fecharAdminMenu() {
    this.menuAdminAberto = false;
  }

  fecharMenusCompletos() {
    this.menuAdminAberto = false;
    this.menuAberto = false;
  }

  async logout() {
    try {
      await this.supabaseService.signOut();
      this.router.navigate(['/login']); 
    } catch (error) {
      alert('Não foi possível sair do sistema. Tente novamente.');
    }
  }
}