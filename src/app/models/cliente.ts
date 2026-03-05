
export interface Cliente {
    nome: string;
    cpf_cnpj: string;
    email: string;
    cep: string;
    logradouro: string;
    numero: number;
    bairro: string;
    cidade: string;
    uf: string;
    tipo_pessoa: 'PF' | 'PJ';
}