import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // IMPORTANTE PARA O REDIRECIONAMENTO
import { Navbar } from '../../../shared/components/navbar/navbar';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';
import { ModalRetorno } from '../../../shared/components/modal-retorno/modal-retorno';
import { TemPermissaoDirective } from '../../../shared/components/permissoes/tem-permissao.directive';
import { Permissoes } from '../../../core/constants/permissions';

@Component({
  selector: 'app-lista-clientes',
  standalone: true,
  imports: [
    Navbar,
    CommonModule,
    FormsModule,
    ModalConfirmacao,
    ModalRetorno,
    TemPermissaoDirective
  ],
  templateUrl: './lista-clientes.html',
  styleUrls: ['./lista-clientes.scss'] 
})
export class ListaClientes implements OnInit {
  protected readonly Permissoes = Permissoes;

  carregando = false;
  modalConfirmacao = false;
  modalRetorno = false;
  
  listaClientes: any[] = [];
  termoPesquisa = '';

  tituloConfirmacao = '';
  mensagemConfirmacao = '';
  textoBotaoConfirmar = '';
  textoBotaoCancelar = '';
  acaoConfirmacao: any;

  tituloRetorno = '';
  mensagemRetorno = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router // Injetado para fazer a navegação
  ) {}

  ngOnInit() {
    this.buscarClientes();
  }

  get listaClientesFiltrada() {
    const termo = (this.termoPesquisa || '').trim().toLowerCase();
    if (!termo) return this.listaClientes;

    const termoDigits = termo.replace(/\D/g, '');

    return this.listaClientes.filter((cliente) => {
      const nome = (cliente.nome || '').toLowerCase();
      const cpfCnpj = (cliente.cpf_cnpj || '').toLowerCase();
      const cpfDigits = (cpfCnpj || '').replace(/\D/g, '');

      const nomeMatch = nome.startsWith(termo);
      const cpfMatch = termoDigits ? cpfDigits.startsWith(termoDigits) : false;

      return nomeMatch || cpfMatch;
    });
  }

  async buscarClientes() {
    this.carregando = true;
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });
        
      if (error) throw error;
      this.listaClientes = data ?? [];
    } catch {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao buscar clientes.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  editarCliente(cliente: any) {
    // Redireciona para a tela de cadastro enviando o objeto inteiro do cliente invisivelmente
    this.router.navigate(['/cadastro'], { 
      state: { clienteSelecionado: cliente } 
    });
  }

  // LÓGICA DE EXCLUSÃO 
  async confirmarExclusaoCliente(cliente: any) {
    const possuiOS = await this.clientePossuiOrdemServico(cliente.id);

    if (possuiOS) {
      this.tituloRetorno = 'Exclusão não permitida';
      this.mensagemRetorno = `O cliente ${cliente.nome} não pode ser excluído, pois possui Ordem de Serviço vinculada.`;
      this.modalRetorno = true;
      return;
    }

    this.tituloConfirmacao = 'Confirmar Exclusão';
    this.mensagemConfirmacao = `Deseja realmente excluir o cliente ${cliente.nome}? Esta ação não poderá ser desfeita.`;
    this.textoBotaoConfirmar = 'Excluir';
    this.textoBotaoCancelar = 'Cancelar';
    this.acaoConfirmacao = () => this.excluirCliente(cliente.id);

    this.modalConfirmacao = true;
  }

  async clientePossuiOrdemServico(clienteId: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('ordens_servico').select('id').eq('cliente_id', clienteId).limit(1);
      if (error) throw error;
      return !!data && data.length > 0;
    } catch {
      return true; // Bloqueia por segurança em caso de erro
    }
  }

  async excluirCliente(id: number) {
    this.modalConfirmacao = false;
    this.carregando = true;
    try {
      const { error } = await this.supabaseService.getClient().from('clientes').delete().eq('id', id);
      if (error) throw error;
      
      this.tituloRetorno = 'Excluído';
      this.mensagemRetorno = 'Cliente excluído com sucesso.';
      await this.buscarClientes();
      this.modalRetorno = true;
    } catch {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao excluir.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  fecharModalSemSalvar() { this.modalConfirmacao = false; }
  fecharModalRetorno() { this.modalRetorno = false; }
}