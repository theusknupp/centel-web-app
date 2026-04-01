import { Component, OnInit } from '@angular/core';
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
  styleUrls: ['./cliente-cadastro.scss'],
})

export class ClienteCadastro implements OnInit {

  modalConfirmacao = false;
  modalRetorno = false;
  carregando = false;

  // Lista e controle de edição
  listaClientes: any[] = [];
  editandoClienteId: number | null = null;

  // Controle do modal de confirmação
  tituloConfirmacao = 'Confirmar Cadastro';
  mensagemConfirmacao = 'Tem a certeza que deseja prosseguir?';
  textoBotaoConfirmar = 'Confirmar';
  textoBotaoCancelar = 'Cancelar';
  acaoConfirmacao: any = () => this.inserirCliente();

  //Variaveis que uso na modal de retorno
  tituloRetorno: string = '';
  mensagemRetorno: string = '';

  //Criando novo cliente
  novoCliente: Cliente = {
    nome: '',
    cpf_cnpj: '',
    //nrtel: '',
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

  ngOnInit() {
    this.buscarClientes();
  }

  //ao clicar pra Salvar, chama a modal de confirmação
  salvarCliente() {
    // Define ação do modal conforme criação ou edição
    if (this.editandoClienteId) {
      this.tituloConfirmacao = 'Confirmar Alteração';
      this.mensagemConfirmacao = 'Deseja salvar as alterações deste cliente?';
      this.textoBotaoConfirmar = 'Salvar Alteração';
      this.textoBotaoCancelar = 'Cancelar';
      this.acaoConfirmacao = () => this.atualizarCliente();
    } else {
      this.tituloConfirmacao = 'Confirmar Cadastro';
      this.mensagemConfirmacao = 'Tem a certeza que os dados do cliente estão corretos?';
      this.textoBotaoConfirmar = 'Confirmar';
      this.textoBotaoCancelar = 'Cancelar';
      this.acaoConfirmacao = () => this.inserirCliente();
    }

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
      const { error } = await this.supabaseService.getClient()
        .from('clientes')
        .insert([this.novoCliente]);

      if (error) {
        //Se der erro atribui as mensagens a modal e chama
        this.tituloRetorno = 'Falha'
        this.mensagemRetorno = 'Erro ao cadastrar Cliente ' + error.message;
        this.modalRetorno = true;
      } else {
        //Se der erro atribui as mensagens a modal e chama
        this.tituloRetorno = 'Cadastrado'
        this.mensagemRetorno = 'Cliente cadastrado com sucesso!';
        this.modalRetorno = true;

        this.limparFormulario();

        // Recarrega lista
        await this.buscarClientes();
      }

    } catch (err) {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado de conexão.';
      this.modalRetorno = true;

    } finally {
      this.carregando = false;
    }
  }

  // Busca todos os clientes para listagem
  async buscarClientes() {
    this.carregando = true;
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        this.tituloRetorno = 'Erro';
        this.mensagemRetorno = 'Erro ao buscar clientes: ' + error.message;
        this.modalRetorno = true;
      } else if (data) {
        this.listaClientes = data;
      }
    } catch (err: any) {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao buscar clientes.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  // Prepara formulário para edição
  editarCliente(cliente: any) {
    console.log('editarCliente chamado', cliente);
    this.editandoClienteId = cliente.id;
    this.novoCliente = { ...cliente } as Cliente;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async atualizarCliente() {
    console.log('atualizarCliente chamado, id editando=', this.editandoClienteId, this.novoCliente);
    this.modalConfirmacao = false;
    this.carregando = true;
    try {
      const updateData = { ...this.novoCliente };
      delete (updateData as any).id;

      const { error } = await this.supabaseService.getClient()
        .from('clientes')
        .update(updateData)
        .eq('id', this.editandoClienteId);

      if (error) {
        this.tituloRetorno = 'Falha';
        this.mensagemRetorno = 'Erro ao atualizar cliente: ' + error.message;
        this.modalRetorno = true;
      } else {
        this.tituloRetorno = 'Atualizado';
        this.mensagemRetorno = 'Cliente atualizado com sucesso!';
        this.modalRetorno = true;
        this.limparFormulario();
        await this.buscarClientes();
      }
    } catch (err) {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao atualizar.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  confirmarExclusaoCliente(cliente: any) {
    console.log('confirmarExclusaoCliente chamado', cliente);
    this.tituloConfirmacao = 'Confirmar Exclusão';
    this.mensagemConfirmacao = `Deseja realmente excluir o cliente ${cliente.nome}? Esta ação não poderá ser desfeita.`;
    this.textoBotaoConfirmar = 'Excluir';
    this.textoBotaoCancelar = 'Cancelar';
    this.acaoConfirmacao = () => this.excluirCliente(cliente.id);
    this.modalConfirmacao = true;
  }

  async excluirCliente(id: number) {
    console.log('excluirCliente chamado id=', id);
    this.modalConfirmacao = false;
    this.carregando = true;
    try {
      const { error } = await this.supabaseService.getClient()
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) {
        this.tituloRetorno = 'Falha';
        this.mensagemRetorno = 'Erro ao excluir cliente: ' + error.message;
        this.modalRetorno = true;
      } else {
        this.tituloRetorno = 'Excluído';
        this.mensagemRetorno = 'Cliente excluído com sucesso.';
        this.modalRetorno = true;
        await this.buscarClientes();
      }
    } catch (err) {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao excluir.';
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
      nome: '', cpf_cnpj: '', email: '', cep: '',
      logradouro: '', numero: '', bairro: '',
      cidade: '', uf: '', tipo_pessoa: 'PF'
    };
  }
}
