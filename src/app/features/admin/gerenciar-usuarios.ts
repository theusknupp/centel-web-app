import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/components/navbar/navbar'; // Ajuste o caminho
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-gerenciar-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar],
  templateUrl: './gerenciar-usuarios.html',
  styleUrls: ['./gerenciar-usuarios.scss']
})
export class GerenciarUsuariosComponent implements OnInit {
  
  carregando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  // Variáveis do Formulário
  novoEmail = '';
  novaSenha = '';
  perfilSelecionado = '';
  
  // Listas de Dados
  listaPerfis: any[] = [];
  listaUsuarios: any[] = []; // Aqui guardaremos os usuários cadastrados

  constructor(private supabase: SupabaseService) {}

  ngOnInit() {
    this.carregarPerfis();
  }

  // Busca os perfis (Admin, Técnico, Atendente) para popular o <select>
  async carregarPerfis() {
    try {
      const { data, error } = await this.supabase.getClient()
        .from('perfis')
        .select('id, nome')
        .order('nome');
        
      if (error) throw error;
      this.listaPerfis = data || [];
    } catch (error) {
      console.error('Erro ao buscar perfis:', error);
    }
  }

  // Função principal: Cria a conta e atrela o perfil
  async cadastrarUsuario() {
    if (!this.novoEmail || !this.novaSenha || !this.perfilSelecionado) {
      this.mensagemErro = 'Preencha todos os campos antes de cadastrar.';
      return;
    }

    this.carregando = true;
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    try {
      // 1. Cria a conta na porta dos fundos usando a Admin Auth
      const { data: authData, error: authError } = await this.supabase.getAdminAuthClient().auth.signUp({
        email: this.novoEmail,
        password: this.novaSenha,
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Com a conta criada, vinculamos o ID dela ao Perfil escolhido
        const { error: perfilError } = await this.supabase.getClient()
          .from('perfis_usuario')
          .insert({
            usuario_id: authData.user.id,
            perfil_id: this.perfilSelecionado
          });

        if (perfilError) throw perfilError;

        this.mensagemSucesso = 'Usuário cadastrado com sucesso!';
        this.limparFormulario();
        // this.carregarUsuarios(); // Atualizaremos a tabela logo após o sucesso
      }

    } catch (error: any) {
      this.mensagemErro = error.message || 'Erro ao tentar cadastrar o usuário.';
    } finally {
      this.carregando = false;
    }
  }

  limparFormulario() {
    this.novoEmail = '';
    this.novaSenha = '';
    this.perfilSelecionado = '';
  }
}