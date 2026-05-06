import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  standalone: true,
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar {
  
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
  
}
