import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
// (+)
export class Validadores {
  static readonly TELEFONE_PATTERN = /^\(\d{2}\) \d{5}-\d{4}$/;
  static readonly CEP_PATTERN = /^\d{5}-\d{3}$/;
  static readonly DOMINIOS_EMAIL_PERMITIDOS = [
    'gmail.com',
    'outlook.com',
    'icloud.com',
    'hotmail.com',
    'yahoo.com',
    'live.com',
    'mec.com.br',
    'uol.com',
  ];


  static readonly UFS_BRASIL: { sigla: string; nome: string }[] = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' },
  ];

  // O 'static' permite usar Validadores.apenasDigitos() direto, sem dar 'new'
  static apenasDigitos(valor: string): string {
    return (valor || '').replace(/\D/g, '');
  }

  // Formatacao para num telefone e cep
  static formatTelefone(digits: string): string {
    const d = digits.slice(0, 11);
    if (!d.length) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  static formatCep(digits: string): string {
    const d = digits.slice(0, 8);
    if (!d.length) return '';
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  }

  // Validacao telefone
  static telefone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value || '').trim();
      if (!valor) return null;
      return Validadores.TELEFONE_PATTERN.test(valor) ? null : { telefoneInvalido: true };
    };
  }

  // Validacao CEP
  static cep(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value || '').trim();
      if (!valor) return null;
      return Validadores.CEP_PATTERN.test(valor) ? null : { cepInvalido: true };
    };
  }

  static emailDominioPermitido(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value || '').trim();
      if (!valor) return null;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(valor)) return { emailInvalido: true };

      const dominio = valor.split('@')[1]?.toLowerCase();
      if (!dominio || !Validadores.DOMINIOS_EMAIL_PERMITIDOS.includes(dominio)) {
        return { dominioNaoPermitido: true };
      }

      return null;
    };
  }

  static apenasNumeros(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (valor == null || valor === '') return null;
      return /^\d+$/.test(String(valor)) ? null : { apenasNumeros: true };
    };
  }

  //Validacoes CEP
  static uf(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value || '').trim().toUpperCase();
      if (!valor) return null;
      if (!/^[A-Z]{2}$/.test(valor)) return { ufInvalida: true };
      const siglas = Validadores.UFS_BRASIL.map((u) => u.sigla);
      return siglas.includes(valor) ? null : { ufInvalida: true };
    };
  }

  // Validacao direto do formulario 
  static cpfCnpj(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = (control.value || '').trim();
      if (!valor) return null;
      return Validadores.isCpfCnpjValido(valor) ? null : { cpfCnpjInvalido: true };
    };
  }

    static isCpfCnpjValido(valor: string): boolean {
      const digitos = this.apenasDigitos(valor);
      if (digitos.length === 11) return this.isValidCpf(digitos);
      if (digitos.length === 14) return this.isValidCnpj(digitos);
      return false;
    }

    static isValidCpf(cpf: string): boolean {
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

      let soma = 0;
      for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i);
      let resto = 11 - (soma % 11);
      if (resto === 10 || resto === 11) resto = 0;
      if (resto !== parseInt(cpf.charAt(9), 10)) return false;

      soma = 0;
      for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i);
      resto = 11 - (soma % 11);
      if (resto === 10 || resto === 11) resto = 0;
      return resto === parseInt(cpf.charAt(10), 10);
    }

  static isValidCnpj(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const calcular = (base: string, pesos: number[]) => {
      let soma = 0;
      for (let i = 0; i < pesos.length; i++) {
        soma += parseInt(base.charAt(i), 10) * pesos[i];
      }
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const d1 = calcular(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (d1 !== parseInt(cnpj.charAt(12), 10)) return false;

    const d2 = calcular(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return d2 === parseInt(cnpj.charAt(13), 10);
  }

  static formatarCpfCnpj(valor: string): string {
    const digits = this.apenasDigitos(valor).slice(0, 14);
    if (digits.length <= 11) {
      return this.formatCpf(digits);
    }
    return this.formatCnpj(digits);
  }

  static formatCpf(digits: string): string {
    const d = digits.padEnd(11, '');
    let out = d.substring(0, 3);
    if (digits.length > 3) out += '.' + d.substring(3, 6);
    if (digits.length > 6) out += '.' + d.substring(6, 9);
    if (digits.length > 9) out += '-' + d.substring(9, 11);
    return out.slice(0, 14);
  }

  static formatCnpj(digits: string): string {
    const d = digits.padEnd(14, '');
    let out = d.substring(0, 2);
    if (digits.length > 2) out += '.' + d.substring(2, 5);
    if (digits.length > 5) out += '.' + d.substring(5, 8);
    if (digits.length > 8) out += '/' + d.substring(8, 12);
    if (digits.length > 12) out += '-' + d.substring(12, 14);
    return out.slice(0, 18);
  }

  static isDataMaiorIgualHoje(dataStr: string): boolean {
    if (!dataStr) return true; // Se o campo for vazio
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas os dias
    
    // Concatena T00:00:00 para forçar o fuso horário local e evitar bug de diferença de horas do UTC
    const dataInput = new Date(dataStr + 'T00:00:00'); 
    
    return dataInput >= hoje;
  }

  /**
   * Remove todos os caracteres numéricos (0-9) de uma string.
   */
  static removerNumeros(valor: string): string {
    return (valor || '').replace(/[0-9]/g, '');
  }

}

// Antigas validacoes se mantiveram, no entanto, foi acrescentado validadores para tel, email, cep, campos numericos,
// uf e cpf.