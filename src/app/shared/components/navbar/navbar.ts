import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TemPermissaoDirective } from '../permissoes/tem-permissao.directive';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, TemPermissaoDirective, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {

}
