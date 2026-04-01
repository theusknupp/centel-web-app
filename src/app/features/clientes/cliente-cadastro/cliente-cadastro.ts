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

  validarCpfCnpj(valor: string): boolean {
    const numeros = valor.replace(/\D/g, '');

    if (this.novoCliente.tipo_pessoa === 'PF') {
      return this.validarCPF(numeros);
    } else {
      return this.validarCNPJ(numeros);
    }
  }

  formatarCpfCnpj(valor: string): string {
    valor = valor.replace(/\D/g, '');

    if (this.novoCliente.tipo_pessoa === 'PF') {
      valor = valor.substring(0, 11);
      // CPF: 000.000.000-00
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
      valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      valor = valor.substring(0, 14);
      // CNPJ: 00.000.000/0000-00
      valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
      valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    }

    return valor;
  }

  onCpfCnpjInput() {
    this.novoCliente.cpf_cnpj = this.formatarCpfCnpj(this.novoCliente.cpf_cnpj);
  }

  validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let soma = 0;
    let resto;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === parseInt(cpf.substring(10, 11));
  }

  validarCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');

    if (cnpj.length !== 14) return false;

    if (/^(\d)\1+$/.test(cnpj)) return false;

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    return resultado === parseInt(digitos.charAt(1));
  }

  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  bloquearExcessoCpfCnpj(event: KeyboardEvent) {
    const valor = this.novoCliente.cpf_cnpj.replace(/\D/g, '');

    const limite = this.novoCliente.tipo_pessoa === 'PF' ? 11 : 14;

    // Permite backspace, delete, setas etc.
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Tab'
    ) {
      return;
    }

    // Bloqueia se atingir limite
    if (valor.length >= limite) {
      event.preventDefault();
    }

    // Bloqueia letras
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  onTelefoneInput() {
    this.novoCliente.nrtel = this.formatarTelefone(this.novoCliente.nrtel);
  }

  formatarTelefone(valor: string): string {
    valor = valor.replace(/\D/g, '');
    valor = valor.substring(0, 11);

    if (valor.length <= 10) {
      // Telefone fixo: (00) 0000-0000
      valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Celular: (00) 9 0000-0000
      valor = valor.replace(/(\d{2})(\d)/, '($1) $2');
      valor = valor.replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3');
    }

    return valor;
  }

  bloquearExcessoTelefone(event: KeyboardEvent) {
    const valor = this.novoCliente.nrtel.replace(/\D/g, '');

    // Permitir teclas especiais
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Tab'
    ) {
      return;
    }

    // Bloquear letras
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }

    // Limite de 11 dígitos
    if (valor.length >= 11) {
      event.preventDefault();
    }
  }

}
