import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Cliente } from '../../../models/cliente';
import { SupabaseService } from '../../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ModalConfirmacao } from '../../../shared/components/modal-confirmacao/modal-confirmacao';
import { ModalRetorno } from '../../../shared/components/modal-retorno/modal-retorno';
import { Validadores } from '../../../utils/validadores';
import { TemPermissaoDirective } from '../../../shared/components/permissoes/tem-permissao.directive';
import { Permissoes } from '../../../core/constants/permissions';

@Component({
  selector: 'app-cliente-cadastro',

  imports: [
    Navbar,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    ModalConfirmacao,
    ModalRetorno,
    TemPermissaoDirective
  ],
  templateUrl: './cliente-cadastro.html',
  styleUrls: ['./cliente-cadastro.scss'],
})
export class ClienteCadastro implements OnInit {
  protected readonly Permissoes = Permissoes;

  modalConfirmacao = false;
  modalRetorno = false;
  carregando = false;

  listaClientes: any[] = [];
  editandoClienteId: number | null = null;

  // Termo pesquisa para filtrar (+ validacoes)
  termoPesquisa = '';
  readonly ufsBrasil = Validadores.UFS_BRASIL;

  tituloConfirmacao = 'Confirmar Cadastro';
  mensagemConfirmacao = 'Tem a certeza que deseja prosseguir?';
  textoBotaoConfirmar = 'Confirmar';
  textoBotaoCancelar = 'Cancelar';
  acaoConfirmacao: any = () => this.inserirCliente();

  tituloRetorno = '';
  mensagemRetorno = '';

  //Formulário de cadastro do cliente (Reactive Forms)
  clienteForm: FormGroup;

  //Validações adicionais no formulário
  constructor(
    private supabaseService: SupabaseService,
    private fb: FormBuilder,
  ) {
    this.clienteForm = this.fb.group({
      nome: ['', Validators.required],
      cpf_cnpj: ['', [Validators.required, Validadores.cpfCnpj()]],
      nrtel: ['', [Validators.required, Validadores.telefone()]],
      email: ['', [Validators.required, Validadores.emailDominioPermitido()]],
      tipo_pessoa: ['PF', Validators.required],
      cep: ['', Validadores.cep()],
      logradouro: [''],
      numero: ['', [Validators.required, Validadores.apenasNumeros()]],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      uf: ['', [Validators.required, Validadores.uf()]],
    });
  }

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

  // Removi controles manuais para o Angular verificar diretamente a validação dos campos
  campoInvalido(nome: string): boolean {
    const control = this.clienteForm.get(nome);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  //Chamada da funcao para salvar 
  salvarCliente() {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      this.tituloRetorno = 'Formulário inválido';
      this.mensagemRetorno = this.mensagemErrosValidacao();
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

  //Funcao para erro de validacao (+) 
  private mensagemErrosValidacao(): string {
    const erros: string[] = [];
    const f = this.clienteForm;

    if (f.get('nome')?.hasError('required')) {
      erros.push('Nome / Razão Social é obrigatório.');
    }
    if (f.get('cpf_cnpj')?.hasError('required')) {
      erros.push('CPF/CNPJ é obrigatório.');
    } else if (f.get('cpf_cnpj')?.hasError('cpfCnpjInvalido')) {
      erros.push('CPF/CNPJ inválido.');
    }
    if (f.get('nrtel')?.hasError('required')) {
      erros.push('Telefone é obrigatório.');
    } else if (f.get('nrtel')?.hasError('telefoneInvalido')) {
      erros.push('Telefone deve estar no formato (00) 00000-0000.');
    }
    if (f.get('email')?.hasError('required')) {
      erros.push('E-mail é obrigatório.');
    } else if (f.get('email')?.hasError('emailInvalido')) {
      erros.push('E-mail com formato inválido.');
    } else if (f.get('email')?.hasError('dominioNaoPermitido')) {
      erros.push(
        'Use um e-mail dos domínios permitidos: gmail.com, outlook.com, icloud.com, hotmail.com, yahoo.com.','live.com','mec.com.br','uol.com',
      );
    }
    if (f.get('cep')?.hasError('cepInvalido')) {
      erros.push('CEP deve estar no formato 00000-000.');
    }
    if (f.get('numero')?.hasError('required')) {
      erros.push('Número é obrigatório.');
    } else if (f.get('numero')?.hasError('apenasNumeros')) {
      erros.push('Número da casa deve conter apenas dígitos.');
    }
    if (f.get('bairro')?.hasError('required')) erros.push('Bairro é obrigatório.');
    if (f.get('cidade')?.hasError('required')) erros.push('Cidade é obrigatória.');
    if (f.get('uf')?.hasError('required')) {
      erros.push('UF é obrigatória.');
    } else if (f.get('uf')?.hasError('ufInvalida')) {
      erros.push('Selecione uma UF válida (2 letras).');
    }

    return erros.length
      ? erros.join(' ')
      : 'Verifique os campos destacados e tente novamente.';
  }

  onCpfCnpjInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = Validadores.apenasDigitos(input.value).slice(0, 14);

    const masked =
      digits.length <= 11 ? Validadores.formatCpf(digits) : Validadores.formatCnpj(digits);

    input.value = masked;
    this.clienteForm.get('cpf_cnpj')?.setValue(masked, { emitEvent: true });
  }

  validarCpfCnpjOnBlur() {
    this.clienteForm.get('cpf_cnpj')?.markAsTouched();
    this.clienteForm.get('cpf_cnpj')?.updateValueAndValidity();
  }
  // Padronização para digitação do telefone (+)
  onTelefoneInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = Validadores.apenasDigitos(input.value).slice(0, 11);
    const masked = Validadores.formatTelefone(digits);

    input.value = masked;
    this.clienteForm.get('nrtel')?.setValue(masked, { emitEvent: true });
  }
  // Padronização para digitação do CEP(+)
  onCepInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = Validadores.apenasDigitos(input.value).slice(0, 8);
    const masked = Validadores.formatCep(digits);

    input.value = masked;
    this.clienteForm.get('cep')?.setValue(masked, { emitEvent: true });
  }
  // Não salvar caracteres no número da casa(+)
  onNumeroInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = Validadores.apenasDigitos(input.value);

    input.value = digits;
    this.clienteForm.get('numero')?.setValue(digits, { emitEvent: true });
  }

  fecharModalSemSalvar() {
    this.modalConfirmacao = false;
  }

  private getClienteFromForm(): Cliente {
    return this.clienteForm.getRawValue() as Cliente;
  }

  async inserirCliente() {
    this.modalConfirmacao = false;
    this.carregando = true;
    // (+) Funcao para inserir cliente
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('clientes')
        // 
        .insert([this.getClienteFromForm()]);

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
      const { data, error } = await this.supabaseService
        .getClient()
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

    const telDigits = Validadores.apenasDigitos(cliente.nrtel ?? '');
    const cepDigits = Validadores.apenasDigitos(cliente.cep ?? '');
    const cpfCnpjDigits = Validadores.apenasDigitos(cliente.cpf_cnpj ?? '');

    // Melhora na edicao 
    this.clienteForm.patchValue({
      nome: cliente.nome ?? '',
      cpf_cnpj: cpfCnpjDigits
        ? cpfCnpjDigits.length <= 11
          ? Validadores.formatCpf(cpfCnpjDigits)
          : Validadores.formatCnpj(cpfCnpjDigits)
        : '',
      email: (cliente.email ?? '').trim().toLowerCase(),
      nrtel: telDigits ? Validadores.formatTelefone(telDigits) : '',
      cep: cepDigits ? Validadores.formatCep(cepDigits) : '',
      logradouro: cliente.logradouro ?? '',
      numero: Validadores.apenasDigitos(String(cliente.numero ?? '')),
      bairro: cliente.bairro ?? '',
      cidade: cliente.cidade ?? '',
      uf: (cliente.uf ?? '').trim().toUpperCase(),
      tipo_pessoa: cliente.tipo_pessoa ?? 'PF',
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Para a formatação do email
  onEmailBlur() {
    const control = this.clienteForm.get('email');
    const normalizado = (control?.value || '').trim().toLowerCase();
    control?.setValue(normalizado, { emitEvent: true });
    control?.markAsTouched();
    control?.updateValueAndValidity();
  }

  async atualizarCliente() {
    if (!this.editandoClienteId) {
      return;
    }

    this.modalConfirmacao = false;
    this.carregando = true;

    // (+) Funcao para atualizar cliente
    try {
      const { error } = await this.supabaseService
        .getClient()
        .from('clientes')
        // Atualiza os dados do cliente com os dados do formulário
        .update(this.getClienteFromForm())
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
      const { data, error } = await this.supabaseService
        .getClient()
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
      this.mensagemRetorno =
        'Não foi possível validar se o cliente possui Ordem de Serviço vinculada.';
      this.modalRetorno = true;
      return true;
    }
  }

  async excluirCliente(id: number) {
    this.modalConfirmacao = false;
    this.carregando = true;

    try {
      const { error } = await this.supabaseService
        .getClient()
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
    this.clienteForm.reset({
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
    });
  }
}