import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para usar o *ngIf
import { FormsModule } from '@angular/forms'; // Para usar o [(ngModel)]
import { Router } from '@angular/router'; // Para mudar de página
import { SupabaseService } from '../../../core/services/supabase.service'; // Nossa conexão

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
  styleUrl: './login.scss'     
})
export class Login { 
  
  // Variáveis que guardam o que o usuário digita
  email = '';
  senha = '';
  tipoUsuario = '';

  // Variáveis de controle de tela
  mensagemErro = '';
  carregando = false;

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  // Função disparada pelo botão 'Entrar'
  async fazerLogin() {
    this.mensagemErro = ''; // Limpa erro anterior
    this.carregando = true; // Ativa visual de "carregando"

    // Validação básica de preenchimento
    if (!this.email || !this.senha || !this.tipoUsuario) {
      this.mensagemErro = 'Preencha todos os campos obrigatórios.';
      this.carregando = false;
      return;
    }

    try {
      // Chama o Supabase para validar e-mail e senha
      // Usamos 'await' para esperar a resposta do banco de dados
      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: this.email,
        password: this.senha
      });

      // Se o banco retornar erro (senha errada, por exemplo)
      if (error) {
        this.mensagemErro = 'Usuário ou senha inválidos.';
      } 
      // Se der sucesso e o usuário existir
      else if (data.user) {
        console.log('Login realizado! Bem-vindo ao sistema Centel.');
        
        // Esta linha faz o redirecionamento imediato para a tela inicial!
        this.router.navigate(['/dashboard']);
      }

    } catch (err) {
      this.mensagemErro = 'Erro ao conectar com o servidor.';
    } finally {
      this.carregando = false; // Desativa o visual de "carregando"
    }
  }
}