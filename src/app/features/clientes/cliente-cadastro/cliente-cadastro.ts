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
  standalone: true, // Adicionado para garantir o funcionamento com imports diretos
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

  editandoClienteId: number | null = null;

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
    // Captura os dados que vieram do roteador se o usuário clicou em "Editar" na tela Lista
    const clienteRecebido = history.state.clienteSelecionado;
    if (clienteRecebido) {
      this.editarCliente(clienteRecebido);
    }
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