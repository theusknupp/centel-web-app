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
    const termo = (this.termoPesquisa || '').trim().toLowerCase();
    if (!termo) return this.listaClientes;

    // versão de busca que exige que o nome ou CPF/CNPJ comecem pelo termo informado
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

  salvarCliente() {
    const nome = (this.novoCliente.nome || '').trim();
    const cpf = (this.novoCliente.cpf_cnpj || '').trim();

    // sinaliza campos inválidos visualmente test
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

    // valida CPF/CNPJ
    if (!this.isCpfCnpjValido(cpf)) {
      const digitos = (cpf || '').replace(/\D/g, '').length;
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
    const digits = this.apenasDigitos(raw).slice(0, 14); // limitar a 14 dígitos

    let masked = raw;
    if (digits.length <= 11) {
      masked = this.formatCpf(digits);
    } else {
      masked = this.formatCnpj(digits);
    }

    input.value = masked;
    this.novoCliente.cpf_cnpj = masked;

    // definir estado visual de invalidez: se número incompleto ou inválido
    if (digits.length === 11) {
      this.cpfInvalido = !this.isValidCpf(digits);
    } else if (digits.length === 14) {
      this.cpfInvalido = !this.isValidCnpj(digits);
    } else {
      this.cpfInvalido = digits.length > 0; // incompleto -> sinalizar
    }
  }

  validarCpfCnpjOnBlur() {
    const digits = this.apenasDigitos(this.novoCliente.cpf_cnpj || '');
    if (digits.length === 11) this.cpfInvalido = !this.isValidCpf(digits);
    else if (digits.length === 14) this.cpfInvalido = !this.isValidCnpj(digits);
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
      // Ajuste o nome da tabela e da coluna conforme seu banco
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

  private apenasDigitos(valor: string) {
    return (valor || '').replace(/\D/g, '');
  }

  private isValidCpf(cpf: string): boolean {
    cpf = this.apenasDigitos(cpf);
    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i), 10) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9), 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i), 10) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10), 10);
  }

  private isValidCnpj(cnpj: string): boolean {
    cnpj = this.apenasDigitos(cnpj);
    if (cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    const calcular = (base: string, pesos: number[]) => {
      let soma = 0;
      for (let i = 0; i < pesos.length; i++) {
        soma += parseInt(base.charAt(i), 10) * pesos[i];
      }
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = calcular(cnpj, pesos1);
    if (d1 !== parseInt(cnpj.charAt(12), 10)) return false;

    const pesos2 = [6].concat(pesos1) as number[];
    const d2 = calcular(cnpj, pesos2);
    return d2 === parseInt(cnpj.charAt(13), 10);
  }

  public isCpfCnpjValido(valor: string): boolean {
    const digitos = this.apenasDigitos(valor);
    if (digitos.length === 11) return this.isValidCpf(digitos);
    if (digitos.length === 14) return this.isValidCnpj(digitos);
    return false;
  }

  private formatCpf(digits: string) {
    const d = (digits || '').padEnd(11, '');
    const part1 = d.substring(0, 3);
    const part2 = d.substring(3, 6);
    const part3 = d.substring(6, 9);
    const part4 = d.substring(9, 11);
    let out = part1;
    if (digits.length > 3) out += '.' + part2;
    if (digits.length > 6) out += '.' + part3;
    if (digits.length > 9) out += '-' + part4;
    return out.slice(0, 14);
  }

  private formatCnpj(digits: string) {
    const d = (digits || '').padEnd(14, '');
    const p1 = d.substring(0, 2);
    const p2 = d.substring(2, 5);
    const p3 = d.substring(5, 8);
    const p4 = d.substring(8, 12);
    const p5 = d.substring(12, 14);
    let out = p1;
    if (digits.length > 2) out += '.' + p2;
    if (digits.length > 5) out += '.' + p3;
    if (digits.length > 8) out += '/' + p4;
    if (digits.length > 12) out += '-' + p5;
    return out.slice(0, 18);
  }
}