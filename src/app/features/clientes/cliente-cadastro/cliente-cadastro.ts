import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Cliente } from '../../../models/cliente';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TemPermissaoDirective } from '../../../shared/components/permissoes/tem-permissao.directive';

@Component({
  selector: 'app-cliente-cadastro',
  imports: [Navbar, FormsModule, CommonModule, TemPermissaoDirective],
  templateUrl: './cliente-cadastro.html',
  styleUrl: './cliente-cadastro.scss',
})

export class ClienteCadastro {

  carregando = false;

  novoCliente: Cliente = {
    nome: '',
    cpf_cnpj: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: 0,
    bairro: '',
    cidade: '',
    uf: '',
    tipo_pessoa: 'PF',
  };

  constructor(private supabaseService: SupabaseService) {
    this.supabaseService = supabaseService;
  }

  async salvarCliente() {
    this.carregando = true; 


    try {
        const {error} = await this.supabaseService.getClient()
        .from('clientes')
        .insert([this.novoCliente]);

        if (error) {
          alert ('Erro ao cadastrar: ' +error.message);
        } else {
          alert('Cliente cadastrado com sucesso!');
        }
      } catch(err) {
        console.error(err)
        alert('Ocorreu um erro inesperado')
      } finally {
        this.carregando = false;
      }
  }
}
