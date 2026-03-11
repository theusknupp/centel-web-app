import { StatusOS } from "../enums/StatusOS-enum";
import { StatusPagamento } from "../enums/StatusPagamento-enum";
import { TipoDefeito } from "../enums/TipoDefeito-enum";

export interface OrdemServico {
  id?: number;
  cliente_id: number | null;
  tipo_servico_id: number | null;
  tecnico_id: number | null;
  
  // Aqui aplicamos a tipagem forte usando os seus Enums!
  status_servico: StatusOS;
  status_pagamento: StatusPagamento;
  defeito_constatado: TipoDefeito;
  
  equipamento: string;
  marca_modelo: string;
  numero_serie: string;
  acessorios_deixados: string;
  relato_cliente: string;
  data_previsao: string;
  atividade_realizada: string;
  pecas_trocadas: string;
  data_conclusao: string;
  valor_total: number;
}