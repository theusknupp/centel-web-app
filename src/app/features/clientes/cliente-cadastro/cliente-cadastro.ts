import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Cliente } from '../../../models/cliente';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';
import { ModalRetorno } from '../../../shared/components/modal-retorno/modal-retorno';

@Component({
  selector: 'app-cliente-cadastro',
  imports: [Navbar, FormsModule, CommonModule, ModalConfirmacao, ModalRetorno],
  templateUrl: './cliente-cadastro.html',
  styleUrl: './cliente-cadastro.scss',
})

export class ClienteCadastro {

  modalConfirmacao = false;
  modalRetorno = false;
  carregando = false;

  //Variaveis que uso na modal de retorno
  tituloRetorno: string = '';
  mensagemRetorno: string = '';

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
          //Se der erro atribui as mensagens a modal e chama
          this.tituloRetorno = 'Falha'
          this.mensagemRetorno= 'Erro ao cadastrar Cliente ' +error.message;        
          this.modalRetorno = true;
        } else {
           //Se der erro atribui as mensagens a modal e chama
          this.tituloRetorno = 'Cadastrado'
          this.mensagemRetorno= 'Cliente cadastrado com sucesso!';      
          this.modalRetorno = true;

          this.limparFormulario();
        }

      } catch(err) {
        this.tituloRetorno = 'Erro de Sistema';
        this.mensagemRetorno = 'Ocorreu um erro inesperado de conexão.';
        this.modalRetorno = true;

      } finally {
        this.carregando = false;
      }
  }

  //Quando clica no Ok da modal de retorno.
  fecharModalRetorno() {
    this.modalRetorno = false;
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
