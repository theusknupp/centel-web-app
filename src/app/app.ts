import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissaoService } from './core/services/permissao/permissao.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('centel-app');

  constructor(private permissaoService: PermissaoService) {}

  ngOnInit(): void {
    this.permissaoService.carregarPermissoes()
  }
}
