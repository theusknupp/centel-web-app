import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PermissaoService } from './core/services/permissao.service';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('centel-app');
  
  constructor(private permissaoService: PermissaoService) {}

  ngOnInit(): void {
    // Reidrata permissões imediatamente (cache local ou backend)
    this.permissaoService.carregarPermissoes();

    // Mantém refresh periódico para sincronização contínua
    this.permissaoService.iniciarRefreshAutomatico(environment.PERMISSION_REFRESH_INTERVAL_MS);
  }
}
