import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Cliente } from '../../../models/cliente';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';

@Component({
  selector: 'app-cliente-cadastro',
  imports: [Navbar, FormsModule, CommonModule, ModalConfirmacao],
  templateUrl: './cliente-cadastro.html',
  styleUrl: './cliente-cadastro.scss',
})

export class ClienteCadastro {

  modalConfirmacao = false;
  carregando = false;

  //Criando novo cliente
  novoCliente: Cliente = {
    nome: '',
    cpf_cnpj: '',
    nrtel: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    tipo_pessoa: 'PF',
  };

  constructor(private supabaseService: SupabaseService) {
    this.supabaseService = supabaseService;
  }

  //ao clicar pra Salvar, chama a modal de confirmação
  salvarCliente() {
    this.carregando = true; 
    this.modalConfirmacao = true;
  }
  
  fecharModalSemSalvar() {
    // Apenas oculta a modal. 
    this.modalConfirmacao = false;
  }
   
  async inserirCliente() {

    //Oculta modal
    this.modalConfirmacao = false;

    try {
        //getClient pegando o Cliente do Supabase
        //Await p aguardar o retorno da resposta
        const {error} = await this.supabaseService.getClient()
        .from('clientes')
        .insert([this.novoCliente]);

        if (error) {
          alert ('Erro ao cadastrar: ' +error.message);
        } else {
          alert('Cliente cadastrado com sucesso!');
          this.limparFormulario();
        }

      } catch(err) {
        console.error(err)
        alert('Ocorreu um erro inesperado')

      } finally {
        this.carregando = false;
      }
  }

  //Se clicar em cancelar, limpa o formulário
  limparFormulario() {
    this.novoCliente = {
      nome: '', cpf_cnpj: '', nrtel: '',email: '', cep: '',
      logradouro: '', numero: '', bairro: '',
      cidade: '', uf: '', tipo_pessoa: 'PF'
    };
  }
}
