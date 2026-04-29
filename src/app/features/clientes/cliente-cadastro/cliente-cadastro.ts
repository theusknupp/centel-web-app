import { Component, OnInit } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Cliente } from '../../../models/cliente';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';
import { ModalRetorno } from '../../../shared/components/modal-retorno/modal-retorno';
import { Validadores } from '../../../utils/validadores';

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

  listaClientes: any[] = [];
  editandoClienteId: number | null = null;

  // pesquisa
  termoPesquisa = '';
  nomeInvalido = false;
  cpfInvalido = false;

  tituloConfirmacao = 'Confirmar Cadastro';
  mensagemConfirmacao = 'Tem a certeza que deseja prosseguir?';
  textoBotaoConfirmar = 'Confirmar';
  textoBotaoCancelar = 'Cancelar';
  acaoConfirmacao: any = () => this.inserirCliente();

  tituloRetorno = '';
  mensagemRetorno = '';

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

  constructor(private supabaseService: SupabaseService) { }

  ngOnInit() {
    this.buscarClientes();
  }

  get listaClientesFiltrada() {
    const termo = this.termoPesquisa.trim().toLowerCase();

    if (!termo) {
      return this.listaClientes;
    }

    return this.listaClientes.filter((cliente) => {
      const nome = (cliente.nome || '').toLowerCase();
      const cpfCnpj = (cliente.cpf_cnpj || '').toLowerCase();

      return nome.includes(termo) || cpfCnpj.includes(termo);
    });
  }

  salvarCliente() {
    const nome = (this.novoCliente.nome || '').trim();
    const cpf = (this.novoCliente.cpf_cnpj || '').trim();

    // sinaliza campos inválidos visualmente
    this.nomeInvalido = !nome;
    // cpf pode vir mascarado, normalize para dígitos ao validar obrigatoriedade
    const cpfDigits = (cpf || '').replace(/\D/g, '');
    this.cpfInvalido = !cpfDigits;

    if (!nome || !cpf) {
      const acao = this.editandoClienteId ? 'salvar' : 'criar';
      if (!nome && !cpf) {
        this.tituloRetorno = 'Campos obrigatórios';
        this.mensagemRetorno = `Não é possível ${acao} um cliente sem Razão Social e CPF/CNPJ.`;
      } else if (!nome) {
        this.tituloRetorno = 'Campo obrigatório';
        this.mensagemRetorno = `Não é possível ${acao} um cliente sem Razão Social.`;
      } else {
        this.tituloRetorno = 'Campo obrigatório';
        this.mensagemRetorno = `Não é possível ${acao} um cliente sem CPF/CNPJ.`;
      }
      this.modalRetorno = true;
      return;
    }

    // valida CPF/CNPJ - chama utils de validação
    if (!Validadores.isCpfCnpjValido(cpf)) {

      //Pega o tamanho do cpf.
      const digitos = (cpf || '').replace(/\D/g, '').length;
      //Define se é CPF ou CNPJ pela quantidade de digitos.
      const tipo = digitos === 11 ? 'CPF' : digitos === 14 ? 'CNPJ' : 'CPF/CNPJ';
      const acao = this.editandoClienteId ? 'salvar' : 'criar';
      
      this.tituloRetorno = 'Valor inválido';
      this.mensagemRetorno = `Não é possível ${acao} um cliente com ${tipo} inválido.`;
      this.modalRetorno = true;
      return;
    }

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

  onCpfCnpjInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let raw = input.value || '';
    const digits = Validadores.apenasDigitos(raw).slice(0, 14); // limitar a 14 dígitos

    let masked = raw;
    if (digits.length <= 11) {
      masked = Validadores.formatCpf(digits);
    } else {
      masked = Validadores.formatCnpj(digits);
    }

    input.value = masked;
    this.novoCliente.cpf_cnpj = masked;

    // definir estado visual de invalidez: se número incompleto ou inválido
    if (digits.length === 11) {
      this.cpfInvalido = Validadores.isValidCpf(digits);
    } else if (digits.length === 14) {
      this.cpfInvalido = Validadores.isValidCnpj(digits);
    } else {
      this.cpfInvalido = digits.length > 0; // incompleto -> sinalizar
    }
  }

  validarCpfCnpjOnBlur() {
    const digits = Validadores.apenasDigitos(this.novoCliente.cpf_cnpj || '');
    if (digits.length === 11) this.cpfInvalido = !Validadores.isValidCpf(digits);
    else if (digits.length === 14) this.cpfInvalido = !Validadores.isValidCnpj(digits);
    else this.cpfInvalido = digits.length > 0;
  }

  fecharModalSemSalvar() {
    this.modalConfirmacao = false;
  }

  async inserirCliente() {
    this.modalConfirmacao = false;
    this.carregando = true;

    try {
      const { error } = await this.supabaseService.getClient()
        .from('clientes')
        .insert([this.novoCliente]);

      if (error) {
        this.tituloRetorno = 'Falha';
        this.mensagemRetorno = 'Erro ao cadastrar cliente: ' + error.message;
      } else {
        this.tituloRetorno = 'Cadastrado';
        this.mensagemRetorno = 'Cliente cadastrado com sucesso!';
        this.limparFormulario();
        await this.buscarClientes();
      }

      this.modalRetorno = true;
    } catch {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado de conexão.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  async buscarClientes() {
    this.carregando = true;

    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('clientes')
        .select('*')
        .order('id', { ascending: false });

        console.log('' + this.supabaseService.getClient);
        console.log('Teste')

        console.log('Quantidade de clientes encontrados:', data?.length);

      if (error) {
        this.tituloRetorno = 'Erro';
        this.mensagemRetorno = 'Erro ao buscar clientes: ' + error.message;
        this.modalRetorno = true;
        return;
      }

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
    this.editandoClienteId = cliente.id;
    this.novoCliente = {
      nome: cliente.nome ?? '',
      cpf_cnpj: cliente.cpf_cnpj ?? '',
      email: cliente.email ?? '',
      nrtel: cliente.nrtel ?? '',
      cep: cliente.cep ?? '',
      logradouro: cliente.logradouro ?? '',
      numero: cliente.numero ?? '',
      bairro: cliente.bairro ?? '',
      cidade: cliente.cidade ?? '',
      uf: cliente.uf ?? '',
      tipo_pessoa: cliente.tipo_pessoa ?? 'PF',
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
    // resetar marcação de erro ao entrar em edição
    this.nomeInvalido = false;
    this.cpfInvalido = false;
  }

  async atualizarCliente() {
    if (!this.editandoClienteId) {
      return;
    }

    this.modalConfirmacao = false;
    this.carregando = true;

    try {
      const { error } = await this.supabaseService.getClient()
        .from('clientes')
        .update(this.novoCliente)
        .eq('id', this.editandoClienteId);

      if (error) {
        this.tituloRetorno = 'Falha';
        this.mensagemRetorno = 'Erro ao atualizar cliente: ' + error.message;
      } else {
        this.tituloRetorno = 'Atualizado';
        this.mensagemRetorno = 'Cliente atualizado com sucesso!';
        this.limparFormulario();
        await this.buscarClientes();
      }

      this.modalRetorno = true;
    } catch {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao atualizar.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  async confirmarExclusaoCliente(cliente: any) {
    const possuiOS = await this.clientePossuiOrdemServico(cliente.id);

    if (possuiOS) {
      this.tituloRetorno = 'Exclusão não permitida';
      this.mensagemRetorno =
        `O cliente ${cliente.nome} não pode ser excluído, pois possui Ordem de Serviço vinculada.`;
      this.modalRetorno = true;
      return;
    }

    this.tituloConfirmacao = 'Confirmar Exclusão';
    this.mensagemConfirmacao =
      `Deseja realmente excluir o cliente ${cliente.nome}? Esta ação não poderá ser desfeita.`;
    this.textoBotaoConfirmar = 'Excluir';
    this.textoBotaoCancelar = 'Cancelar';
    this.acaoConfirmacao = () => this.excluirCliente(cliente.id);

    this.modalConfirmacao = true;
  }

  async clientePossuiOrdemServico(clienteId: number): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getClient()
        .from('ordens_servico')
        .select('id')
        .eq('cliente_id', clienteId)
        .limit(1);

      if (error) {
        throw error;
      }

      return !!data && data.length > 0;
    } catch {
      this.tituloRetorno = 'Erro';
      this.mensagemRetorno = 'Não foi possível validar se o cliente possui Ordem de Serviço vinculada.';
      this.modalRetorno = true;
      return true; // por segurança, bloqueia exclusão em caso de erro
    }
  }

  async excluirCliente(id: number) {
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
      } else {
        this.tituloRetorno = 'Excluído';
        this.mensagemRetorno = 'Cliente excluído com sucesso.';
        await this.buscarClientes();

        if (this.editandoClienteId === id) {
          this.limparFormulario();
        }
      }

      this.modalRetorno = true;
    } catch {
      this.tituloRetorno = 'Erro de Sistema';
      this.mensagemRetorno = 'Ocorreu um erro inesperado ao excluir.';
      this.modalRetorno = true;
    } finally {
      this.carregando = false;
    }
  }

  fecharModalRetorno() {
    this.modalRetorno = false;
  }

  limparFormulario() {
    this.editandoClienteId = null;

    this.novoCliente = {
      nome: '',
      cpf_cnpj: '',
      email: '',
      nrtel: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      tipo_pessoa: 'PF',
    };
    this.nomeInvalido = false;
    this.cpfInvalido = false;
  }
}