import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Para usar o *ngIf
import { FormsModule } from '@angular/forms'; // Para usar o [(ngModel)]
import { Router } from '@angular/router'; // Para mudar de página
import { SupabaseService } from '../../../core/services/supabase.service'; // Nossa conexão

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', // Nome conforme seu arquivo
  styleUrl: './login.scss'     // Nome conforme seu arquivo
})
export class Login { // Conforme sua regra: Classe em MAIÚSCULO
  
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
        // Por enquanto apenas um alerta didático
        alert('Login realizado! Bem-vindo ao sistema Centel.');
        
        // No futuro, aqui faremos: this.router.navigate(['/home']);
      }

    } catch (err) {
      this.mensagemErro = 'Erro ao conectar com o servidor.';
    } finally {
      this.carregando = false; // Desativa o visual de "carregando"
    }
  }
}